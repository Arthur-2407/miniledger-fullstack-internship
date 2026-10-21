# MiniLedger — Implementation Plan

## 1. Project Overview & Architecture
MiniLedger is a full-stack financial tracking application for money lent to friends. It consists of:
- **Backend (`apps/api`)**: Node.js, Express, TypeScript, Prisma ORM, PostgreSQL database, Zod validation, JWT authentication, rate limiting, and Winston/Morgan logging.
- **Mobile (`apps/mobile`)**: React Native with Expo SDK 52+, TypeScript, Expo Router / Navigation, responsive fintech UI, Zod form validation, Indian Rupee (`INR`) formatting, overdue highlighting, and mock OTP integration.
- **Bonus Feature**: Receipt photo attachment associated with loans with file validation and secure retrieval.
- **Infrastructure & Quality**: Docker Compose for PostgreSQL, Vitest & Supertest automated test suite, GitHub Actions CI workflow, and full documentation.

## 2. Directory Structure
```text
miniledger/
├── apps/
│   ├── api/
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   └── migrations/
│   │   ├── src/
│   │   │   ├── config/
│   │   │   ├── middleware/
│   │   │   ├── modules/
│   │   │   │   ├── auth/
│   │   │   │   ├── loans/
│   │   │   │   └── summary/
│   │   │   ├── services/
│   │   │   ├── utils/
│   │   │   ├── app.ts
│   │   │   └── server.ts
│   │   └── tests/
│   └── mobile/
│       ├── app/
│       ├── components/
│       ├── features/
│       ├── services/
│       ├── hooks/
│       ├── utils/
│       └── assets/
├── docs/
├── scripts/
├── submission/
├── docker-compose.yml
├── package.json
├── .env.example
├── .gitignore
├── README.md
└── docs/PROGRESS.md
```

## 3. Step-by-Step Implementation Strategy

### Phase 1: Environment & Workspace Setup
- Initialize Git repository with safe `.gitignore`.
- Set up root `package.json` with npm workspaces (`apps/api`, `apps/mobile`).
- Configure Docker Compose with PostgreSQL 16 container, persistent volume, and health checks.

### Phase 2: Backend & Database (`apps/api`)
- Initialize TypeScript & Express structure with strict typing.
- Configure Prisma with PostgreSQL schema:
  - `User`: id, phone (unique normalized), createdAt, updatedAt.
  - `Loan`: id, userId (FK), friendName, amount (Decimal/Numeric 12,2), dueDate (Date/string YYYY-MM-DD), isRepaid (Boolean), repaidAt (DateTime, nullable), receiptPath (String, nullable), receiptMime (String, nullable), createdAt, updatedAt.
  - `OtpChallenge`: id, phone, hashedOtp, expiresAt, attempts, consumed, createdAt.
- Implement Authentication module:
  - `POST /api/auth/request-otp`: phone validation (E.164 / 10-digit Indian), 6-digit cryptographically random OTP generation, bcrypt hash storage with 5m expiry, log OTP clearly to server terminal with masked phone, rate-limited.
  - `POST /api/auth/verify-otp`: rate limit, verify hash, mark consumed, find/create user, issue signed JWT.
- Implement Loans module:
  - `GET /api/loans`: authenticated, user-scoped, ordered by dueDate/createdAt.
  - `POST /api/loans`: Zod validation (friendName, positive amount, valid YYYY-MM-DD date), user-scoped.
  - `PATCH /api/loans/:id/repay`: ownership check, marks repaid, sets repaidAt, idempotent.
- Implement Summary module:
  - `GET /api/summary`: aggregation of totalLent, totalRepaid, overdueAmount (dueDate < today calendar date AND not repaid), currency "INR".
- Implement Receipt Upload bonus:
  - `POST /api/loans/:id/receipt`: multer multipart upload, MIME & 5MB size validation, secure storage, associate metadata with loan.
  - `GET /api/loans/:id/receipt`: authenticated streaming of receipt image.
- Error handling, health check (`GET /api/health`), CORS, helmet, and graceful shutdown.

### Phase 3: Automated Backend Testing
- Vitest + Supertest integration test suite with dedicated test database or isolated transactional lifecycle.
- Test suites:
  - Auth: OTP generation, terminal logging, invalid OTP, expired OTP, rate limits, JWT generation.
  - Loans: create loan, validation errors, user isolation (user A cannot see/modify user B's loan), mark repaid.
  - Summary: empty state, all outstanding, mixed repaid, overdue calculation against calendar date.
  - Receipts: upload validation, unauthorized access, format check.

### Phase 4: Mobile Application (`apps/mobile`)
- Initialize Expo React Native TypeScript project configured for Mobile and Web preview.
- Implement Design System:
  - Fintech dark/light high-contrast theme, clear visual hierarchy, accessible typography, rupee formatting (`₹`).
- Screens & Components:
  - **Auth Flow**: Phone number login screen with formatted input, OTP verification screen with countdown & terminal OTP indicator.
  - **Dashboard / Loan List**:
    - Summary Card: Total Lent, Total Repaid, Overdue Amount (highlighted in red/amber).
    - Loan List: Item cards showing friend name, due date, amount, status badge (Overdue, Active, Repaid), repay action button, receipt badge/viewer.
    - Add Loan Modal/Screen: Name, positive amount, native calendar date picker, receipt photo picker.
    - Loading states, empty states, error retry banners.
- HTTP Client: Axios with JWT token interceptor and automatic session management.

### Phase 5: Runtime Verification & Integration
- Run PostgreSQL container via Docker Compose.
- Apply Prisma migrations and verify client generation.
- Start API server and Mobile web/native dev server.
- Perform end-to-end user journey verification:
  1. Phone input -> Request OTP.
  2. Read OTP from terminal.
  3. Verify OTP -> Receive JWT.
  4. Fetch summary (₹0 / empty).
  5. Add loans (future due date + past overdue date).
  6. Confirm overdue styling & summary calculation.
  7. Mark loan repaid -> Confirm summary update.
  8. Upload receipt photo -> Confirm display.

### Phase 6: Documentation, CI & Packaging
- Comprehensive `README.md` with complete setup instructions (PowerShell + Unix), API reference, architecture diagram, and verification guide.
- Detailed `docs/ARCHITECTURE.md` and `docs/INTERVIEW_GUIDE.md`.
- GitHub Actions CI workflow (`.github/workflows/ci.yml`).
- Demo recording captured in `submission/` with `DEMO_SCRIPT.md`.
- Verification audit and final report in `submission/SUBMISSION_STATUS.md`.
