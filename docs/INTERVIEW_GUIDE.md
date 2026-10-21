# MiniLedger — Technical Interview Preparation Guide

This guide is designed to help you confidently explain the architectural decisions, design patterns, security controls, and code implementations in MiniLedger during technical interviews.

---

## 1. Core Architecture Decisions

### Q: Why did you choose an npm workspaces monorepo structure?
**Answer**:
A monorepo containing `apps/api` and `apps/mobile` provides unified dependency management and synchronized versioning while maintaining strict architectural boundaries. The API has zero runtime coupling to the mobile application, and mobile communicates solely over HTTP/REST contracts. It prevents code duplication, simplifies full-stack CI/CD workflows, and makes local reproduction seamless with a single command.

### Q: Why PostgreSQL and Prisma instead of an ORM like TypeORM or MongoDB?
**Answer**:
Financial ledger records inherently require ACID guarantees, relational integrity, and strict consistency:
- **Foreign Keys & Cascading**: A loan must never be orphaned without a valid user owner.
- **Transactions & Aggregations**: Ledger summaries require exact sum aggregations and atomic state updates.
- **Prisma Benefits**: Prisma provides end-to-end type safety, auto-generated TypeScript clients that stay in lockstep with the database schema, predictable migrations, and built-in support for exact `Decimal` precision.
- **Relational vs NoSQL**: In financial tracking, schema enforcement at the database level prevents corrupted balance states that frequently occur in schema-less document stores.

---

## 2. Authentication & Security

### Q: Explain the OTP workflow. Why is the OTP not returned in the API response?
**Answer**:
1. **Separation of Concerns**: In a production system, OTPs are transmitted over an out-of-band channel (SMS, WhatsApp, or voice call via Twilio/Gupshup). The client requesting the OTP should never be able to inspect the OTP in the HTTP response; doing so would completely defeat the purpose of two-factor/possession verification.
2. **Cryptographic Generation**: We use Node.js `crypto.randomInt(100000, 1000000)` to prevent pseudo-random number generator (PRNG) predictability.
3. **Storage Security**: OTPs are salted and hashed with `bcrypt` (10 rounds) before being saved to PostgreSQL. If the database were compromised, the raw OTPs could not be extracted.
4. **Replay & Brute Force Prevention**:
   - Challenges expire in 5 minutes.
   - Max 5 verification attempts before invalidation.
   - Upon successful verification, the challenge is marked `consumed: true`, making replay attacks impossible.
   - Previous unconsumed OTPs for the same number are automatically invalidated when a new one is requested.

### Q: How does JWT authentication work and how is the session maintained on mobile?
**Answer**:
- On OTP verification, the server signs a JSON Web Token containing the user's `userId` and normalized `phone`.
- The token is signed using HMAC SHA-256 with a secret key from environment variables (`JWT_SECRET`) and a 7-day expiration.
- On the mobile client:
  - Tokens are persisted securely using `expo-secure-store` on iOS (Keychain) and Android (KeyStore/EncryptedSharedPreferences), and `localStorage` on web.
  - An Axios request interceptor attaches the token as `Authorization: Bearer <token>`.
  - A response interceptor intercepts HTTP 401s, clears invalid storage, and gracefully redirects the user to the login screen.

---

## 3. Financial Logic & Ledger Integrity

### Q: How do you store and calculate monetary amounts?
**Answer**:
- **Why not JavaScript Numbers?**: JavaScript represents numbers as double-precision 64-bit IEEE-754 floats. Floating point arithmetic leads to rounding errors (e.g., `0.1 + 0.2 !== 0.3`). In financial systems, even fractional cent errors are unacceptable.
- **Solution**: We store money as `Decimal(12, 2)` in PostgreSQL (`NUMERIC`). On the backend, we validate input with Zod ensuring positive finite numbers with maximum 2 decimal places and instantiate `Prisma.Decimal`.
- **Formatting**: On the frontend, amounts are formatted using Indian Rupee notation (`₹1,500.00`) via a dedicated locale-aware formatting utility.

### Q: How is the summary calculated and how do you handle overdue loans?
**Answer**:
The summary endpoint (`GET /api/summary`) calculates three distinct aggregate figures directly via database query:
1. `totalLent`: Sum of `amount` across all loans belonging to the authenticated user.
2. `totalRepaid`: Sum of `amount` for loans where `isRepaid == true`.
3. `overdueAmount`: Sum of `amount` for outstanding loans (`isRepaid == false`) where `dueDate < todayUtcMidnight`.

**Crucial Edge Cases Handled**:
- **Due Today**: A loan due today is **not overdue** merely because of the time of day. It becomes overdue only when the calendar day has passed.
- **Repaid Loans**: Repaid loans never contribute to the overdue amount, even if their due date was in the past.
- **Empty State**: Database `null` sums from empty sets safely fallback to `0.00`.
- **User Scoping**: Every aggregate query filters on `userId: req.user.userId`.

---

## 4. Repayment & Idempotency

### Q: Why is the repay endpoint a `PATCH` and how is it idempotent?
**Answer**:
- `PATCH /api/loans/:id/repay` modifies only the repayment status fields (`isRepaid: true` and `repaidAt: timestamp`) rather than replacing the entire loan resource (which would be `PUT`).
- **Idempotency**: If a client sends multiple repayment requests (e.g., due to mobile network retries or accidental double-taps), the server checks if the loan is already repaid. If so, it returns the current state with status 200 without creating conflicting timestamps or throwing an error.

---

## 5. Bonus: Receipt Photo Upload

### Q: How does the receipt upload bonus work and how is it secured?
**Answer**:
- **Upload**: `POST /api/loans/:id/receipt` uses `multer` to accept `multipart/form-data`.
- **Validation**: Strict MIME type filtering (`image/jpeg`, `image/png`, `image/webp`) and a 5MB size limit.
- **Storage**: Files are assigned a random UUID filename and saved to an ignored `./uploads` directory. Metadata (`receiptPath`, `receiptMime`, `receiptOriginalName`, `receiptSize`) is linked to the loan record in PostgreSQL.
- **Security & Path Traversal Prevention**:
  - The endpoint verifies user ownership of the loan before writing or reading.
  - The download route (`GET /api/loans/:id/receipt`) validates that the requested file path resolves within the allowed upload directory using `path.resolve` before calling `res.sendFile`.

---

## 6. Testing Strategy & Quality Assurance

### Q: What automated tests were implemented and how do they ensure confidence?
**Answer**:
We use Vitest and Supertest for integration and unit testing:
1. **Authentication Suite**:
   - OTP generation and persistence.
   - Rejection of invalid phone formats.
   - Verification with incorrect OTP (testing attempt limits).
   - Successful verification, JWT generation, and user creation.
   - Rejection of expired OTPs.
   - Rejection of consumed OTPs on reuse.
   - Enforcement of authentication on protected routes.
2. **Loans API Suite**:
   - Creation of valid loans.
   - Rejection of nonpositive amounts, invalid dates, and empty names.
   - Strict user isolation (User A cannot list or repay User B's loans).
   - Repayment and idempotency verification.
3. **Summary Suite**:
   - Zero-loan baseline.
   - Multi-loan calculation with overdue, active, and repaid records.
   - Boundary check ensuring loans due today are not counted as overdue.
   - Isolation check ensuring another user's loans do not leak into the summary.
4. **Receipts Suite**:
   - Valid image upload and retrieval.
   - Rejection of unsupported file formats.
   - Authorization checks preventing cross-user receipt access.

---

## 7. Known Limitations & Production Roadmap

### Q: If this were moving to production, what would you improve?
**Answer**:
1. **Real SMS Integration**: Replace terminal mock OTP with Twilio / AWS SNS SMS provider with circuit breakers and fallback delivery.
2. **Cloud Object Storage**: Transition receipt uploads from local disk to AWS S3 or Cloudflare R2 using pre-signed upload URLs to keep the API stateless.
3. **Partial Repayments**: Extend the data model to support a `repayments` ledger table allowing installment payments against a single loan.
4. **Push Notifications**: Expo Push Notifications / FCM to notify friends about upcoming or overdue loans.
5. **Multi-Currency Support**: Support currency exchange rates for international friend groups.
