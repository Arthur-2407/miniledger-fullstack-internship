# MiniLedger — Architecture Documentation

## 1. System Overview

MiniLedger is a full-stack financial application engineered to track money lent to friends, manage due dates, highlight overdue obligations, and record repayments with optional receipt verification.

```
┌─────────────────────────────────────────────────────────────┐
│                       React Native / Expo                    │
│   (Mobile iOS / Android + Web Preview, Fintech Dark UI)    │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTPS / JSON & Multipart
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                    Express & TypeScript API                 │
│  - Helmet & CORS Middleware                                 │
│  - Rate Limiting (15 req/15m for Auth)                      │
│  - JWT Bearer Authentication                                │
│  - Zod Request Validation                                   │
│  - Multer Image Upload Pipeline                             │
│  - Structured Error & Logging Pipeline                      │
└──────────────────────────────┬──────────────────────────────┘
                               │ Prisma ORM (Strict Types)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                     PostgreSQL Database                     │
│  - Tables: users, loans, otp_challenges                     │
│  - Decimal(12, 2) Monetary Storage                          │
│  - Date-only Temporal Representation                        │
│  - Strict Foreign Keys & Indexes                            │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Relational Database & Data Models

### Schema Design (`prisma/schema.prisma`)

```prisma
model User {
  id        String   @id @default(uuid())
  phone     String   @unique
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  loans     Loan[]

  @@map("users")
}

model Loan {
  id                  String    @id @default(uuid())
  userId              String
  user                User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  friendName          String
  amount              Decimal   @db.Decimal(12, 2)
  dueDate             DateTime  @db.Date
  isRepaid            Boolean   @default(false)
  repaidAt            DateTime?
  receiptPath         String?
  receiptMime         String?
  receiptOriginalName String?
  receiptSize         Int?
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt

  @@index([userId])
  @@index([userId, isRepaid])
  @@index([userId, dueDate])
  @@map("loans")
}

model OtpChallenge {
  id        String   @id @default(uuid())
  phone     String
  hashedOtp String
  expiresAt DateTime
  attempts  Int      @default(0)
  consumed  Boolean  @default(false)
  createdAt DateTime @default(now())

  @@index([phone])
  @@index([expiresAt])
  @@map("otp_challenges")
}
```

### Key Database Decisions
1. **Monetary Precision with `Decimal(12, 2)`**: Standard IEEE-754 floating-point types (`FLOAT`/`REAL`) suffer from binary rounding errors (e.g., `0.1 + 0.2 = 0.30000000000000004`). In MiniLedger, monetary amounts are stored as exact PostgreSQL `NUMERIC(12, 2)` mapped through Prisma `Decimal`, guaranteeing zero rounding discrepancy.
2. **Date-Only Storage with `@db.Date`**: Timezone conversion bugs frequently alter due dates (e.g. `2026-10-20T00:00:00Z` shifting to `2026-10-19 18:30:00` in IST). By persisting strictly as `@db.Date` and parsing UTC calendar components without time offset, the intended calendar day remains invariant.
3. **User Isolation**: All loans have a mandatory foreign key constraint to `users.id` with cascading deletion. All queries require an authenticated `userId`.
4. **Secure Challenge Storage**: OTPs are salted and hashed using `bcrypt` before persistence. Even with direct database read access, plain-text OTPs cannot be recovered.

---

## 3. Authentication & Security Flow

### Mock OTP Specification
1. **Request (`POST /api/auth/request-otp`)**:
   - The user inputs their phone number (e.g. `+919876543210` or `9876543210`).
   - Phone is normalized to standard E.164.
   - A cryptographically secure 6-digit random number is generated:
     `crypto.randomInt(100000, 1000000)`.
   - The OTP is hashed with `bcrypt.hash(otp, 10)`.
   - Challenge is recorded in `otp_challenges` with 5-minute expiry and attempt limit (5 attempts).
   - In non-production environments, the OTP is printed clearly to the API terminal log:
     `🔑 [DEV-OTP] Verification code for +91 ******3210: >>> 482910 <<<`
   - The plain OTP is **never** returned in the HTTP response body.

2. **Verify (`POST /api/auth/verify-otp`)**:
   - Input is validated against Zod schema (`regex(/^\d{6}$/)`).
   - Active, unconsumed challenge for the phone is located.
   - Expiration and attempt threshold are checked.
   - `bcrypt.compare(inputOtp, challenge.hashedOtp)` validates the challenge.
   - Upon failure, `attempts` is incremented.
   - Upon success, challenge is marked `consumed: true` to prevent replay attacks.
   - User is retrieved or created (`prisma.user.upsert`).
   - Signed JWT token is issued and returned.

3. **Session Persistence**:
   - On iOS/Android: Stored securely using `expo-secure-store` (hardware-backed keystore/keychain).
   - On Web: Stored in secure `localStorage`.
   - Never logged to console in production.

---

## 4. Business Logic & Calculations

### Summary Endpoint (`GET /api/summary`)
The summary reflects real-time metrics aggregated exclusively from the authenticated user's records:

```typescript
const totalLentAgg = await prisma.loan.aggregate({
  where: { userId },
  _sum: { amount: true },
});

const totalRepaidAgg = await prisma.loan.aggregate({
  where: { userId, isRepaid: true },
  _sum: { amount: true },
});

const overdueAgg = await prisma.loan.aggregate({
  where: {
    userId,
    isRepaid: false,
    dueDate: { lt: todayUtcMidnight },
  },
  _sum: { amount: true },
});
```

- **`totalLent`**: Aggregate sum of all principal amounts.
- **`totalRepaid`**: Sum of all loans where `isRepaid == true`.
- **`overdueAmount`**: Sum of outstanding loans (`isRepaid == false`) whose `dueDate` is strictly earlier than today's calendar date (`dueDate < today`).
- **Calendar-Day Semantics**: A loan due today is **not overdue** merely because of the time of day. It becomes overdue only when the calendar day elapses.
- **Repaid Loans**: Once marked as repaid, a loan is excluded from the overdue total regardless of whether its due date was in the past.

### Idempotent Repayment (`PATCH /api/loans/:id/repay`)
- Verifies loan existence and ownership (`loan.userId === req.user.userId`).
- If already repaid, returns existing record with status 200 without throwing errors or creating inconsistent timestamps.
- If outstanding, updates `isRepaid = true` and `repaidAt = new Date()`.

---

## 5. Receipt Photo Upload Pipeline (Bonus)

```
[Mobile App]
     │
     │ Multipart FormData (receipt image)
     ▼
[Multer Middleware]
     ├─ MIME Type Validation (image/jpeg, image/png, image/webp)
     ├─ Size Restriction (≤ 5MB)
     └─ Safe UUID Filename Storage in ignored ./uploads/
     ▼
[PostgreSQL Update]
     └─ Updates Loan: receiptPath, receiptMime, receiptOriginalName, receiptSize
```

### Path Traversal Protection
When streaming receipts back via `GET /api/loans/:id/receipt`:
- Authenticates requesting user.
- Verifies ownership (`loan.userId === req.user.userId`).
- Normalizes path with `path.resolve` and verifies it resides strictly inside `config.UPLOAD_DIR`.

---

## 6. Frontend Architecture (React Native & Expo)

### Architectural Highlights
- **Single Source of Truth**: State managed cleanly through declarative hooks and centralized service layer.
- **Design System**: Fintech dark theme with high contrast (`#0B0F19` background, `#131B2E` cards, `#3B82F6` primary blue, `#10B981` success green, `#EF4444` danger red).
- **Responsive Layout**: Designed mobile-first for native iOS/Android, with responsive container constraints (`maxWidth: 600`) for Expo Web preview.
- **Micro-Interactions**: Visual feedback on repay, loading spinners, empty states with call-to-action, dismissible error banners, and pull-to-refresh.
