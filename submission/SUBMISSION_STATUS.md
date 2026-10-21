# MiniLedger — Definitive Submission Report

## 1. Project Location & Repository

- **Workspace Path**: `D:\Intern`
- **Active Branch**: `master`
- **Verified GitHub Repository URL**: [https://github.com/Arthur-2407/miniledger-fullstack-internship](https://github.com/Arthur-2407/miniledger-fullstack-internship)
- **Local Video Recording Deliverable**: `submission/miniledger-demo.mp4`
- **Backup WebP Recording**: `submission/miniledger-demo.webp`
- **Verified Recording Duration**: **145.0 seconds** (2 minutes, 25 seconds)

---

## 2. Requirement Verification & Audit Matrix

| Category | Requirement Item | Verification Command / Artifact | Status |
|---|---|---|---|
| **Backend Core** | Node.js + TypeScript Backend | `apps/api/src/server.ts`, `tsc --noEmit` | **PASS** |
| **Backend Core** | PostgreSQL Persistence via Prisma | `apps/api/prisma/migrations/20261021195856_init/` | **PASS** |
| **Backend Core** | Phone-number passwordless login | `POST /api/auth/request-otp` | **PASS** |
| **Backend Core** | 6-digit mock OTP in terminal log | Tested live & logged in `task-306.log` | **PASS** |
| **Backend Core** | Verify OTP & JWT session issuance | `POST /api/auth/verify-otp` | **PASS** |
| **Backend Core** | Add loan entry (friend, amount, date) | `POST /api/loans` (Zod validated) | **PASS** |
| **Backend Core** | Retrieve user's loans | `GET /api/loans` (strict user isolation) | **PASS** |
| **Backend Core** | Mark loan as repaid (idempotent) | `PATCH /api/loans/:id/repay` | **PASS** |
| **Backend Core** | Summary endpoint (lent, repaid, overdue) | `GET /api/summary` (database aggregation) | **PASS** |
| **Backend Core** | Overdue calculation (calendar date) | Due today is not overdue; past date is | **PASS** |
| **Bonus** | Receipt photo upload | `POST /api/loans/:id/receipt` (Multer) | **PASS** |
| **Bonus** | Authenticated receipt streaming | `GET /api/loans/:id/receipt` (Safe paths) | **PASS** |
| **Mobile App** | React Native Expo application | `apps/mobile/src/App.tsx` | **PASS** |
| **Mobile App** | Phone-number login screen | `apps/mobile/src/screens/LoginScreen.tsx` | **PASS** |
| **Mobile App** | OTP verification screen | `apps/mobile/src/screens/OtpScreen.tsx` | **PASS** |
| **Mobile App** | Main dashboard with prominent summary | `apps/mobile/src/components/SummaryCard.tsx` | **PASS** |
| **Mobile App** | Overdue loans visual highlighting | Crimson badges & active overdue borders | **PASS** |
| **Mobile App** | Repay action updating state & totals | Live button triggers API & syncs totals | **PASS** |
| **Mobile App** | Add loan form with validation & presets | `apps/mobile/src/components/AddLoanModal.tsx`| **PASS** |
| **Mobile App** | Loading, empty, error, & retry states | `EmptyState.tsx`, `ErrorBanner.tsx` | **PASS** |
| **Quality** | Automated integration test suite | `npm run test` (17 tests in Vitest) | **PASS** |
| **Quality** | API TypeScript type checking | `npm run typecheck --workspace=apps/api` | **PASS** |
| **Quality** | Mobile TypeScript type checking | `npm run typecheck --workspace=apps/mobile` | **PASS** |
| **Quality** | API production bundle build | `npm run build:api` | **PASS** |
| **Quality** | Mobile web export bundle build | `npx expo export -p web` | **PASS** |
| **Quality** | CI Pipeline configuration | `ci/ci.yml` | **PASS** |
| **Deliverables**| Verified Git commits & remote push | `git log`, `gh repo view` | **PASS** |
| **Deliverables**| 2–3 minute demonstration video | `submission/miniledger-demo.mp4` (145s) | **PASS** |
| **Deliverables**| Demonstration step-by-step script | `submission/DEMO_SCRIPT.md` | **PASS** |
| **Deliverables**| Comprehensive README setup guide | `README.md` | **PASS** |
| **Deliverables**| Architectural documentation | `docs/ARCHITECTURE.md` | **PASS** |
| **Deliverables**| Technical interview prep guide | `docs/INTERVIEW_GUIDE.md` | **PASS** |
| **Deliverables**| Known environmental limitations | `docs/KNOWN_LIMITATIONS.md` | **PASS** |

---

## 3. Test Suite Execution Details

Command executed:
```bash
npm run test --workspace=apps/api
```

Results output:
```text
 ✓ tests/summary.test.ts (2 tests) 224ms
 ✓ tests/receipts.test.ts (3 tests) 275ms
 ✓ tests/loans.test.ts (5 tests) 336ms
 ✓ tests/auth.test.ts (7 tests) 1136ms

 Test Files  4 passed (4)
      Tests  17 passed (17)
   Duration  14.53s
```

Detailed Breakdown:
- **Authentication (7 tests)**:
  - Rejects malformed phone numbers.
  - Generates & stores mock OTP for valid phone number.
  - Rejects incorrect OTP with attempt counter and meaningful error.
  - Authenticates valid OTP, issues JWT, and registers user.
  - Rejects consumed OTP on reuse attempt (replay protection).
  - Rejects expired OTPs.
  - Enforces authentication on protected routes.
- **Loans API (5 tests)**:
  - Allows authenticated user to create a valid loan.
  - Rejects loan creation with nonpositive amount.
  - Rejects loan creation with invalid date or missing friend name.
  - Enforces strict user isolation: User A cannot see or modify User B loans.
  - Allows owner to mark a loan as repaid and handles repeated calls safely (idempotent).
- **Summary Calculations (2 tests)**:
  - Returns zero totals when user has no loans.
  - Correctly computes totals for outstanding, repaid, overdue, and due-today loans without timezone drift.
- **Receipts Bonus (3 tests)**:
  - Uploads a valid JPEG receipt and associates metadata with the loan.
  - Rejects unsupported file formats.
  - Prevents User B from attaching or viewing receipts on User A loans.

---

## 4. Services Launch Commands

### Database Service
- **Embedded Native PostgreSQL**: `node scripts/start-local-db.mjs` (Port 5432)
- **Docker Alternative**: `docker compose up -d postgres`

### API Service
- **Development Server**: `npm run dev:api` (Port 5000)
- **Production Server**: `npm run build:api && npm run start --workspace=apps/api`

### Mobile Application
- **Mobile Web Preview**: `node scripts/serve-mobile-web.mjs` (Port 8081)
- **Expo Development Server**: `npm run dev:mobile`

---

## 5. Demonstration Recording Details

- **File Path**: `D:\Intern\submission\miniledger-demo.mp4`
- **Duration**: **145.0 seconds** (2 minutes, 25 seconds)
- **Resolution**: 430 x 880 (Simulated Smartphone Mobile Viewport)
- **Size**: 3,625,871 bytes (~3.6 MB)
- **Frame Rate**: 10 FPS
- **Key Walkthrough Sequence**:
  1. MiniLedger App Launch with phone login input (`+919876543210`).
  2. Requesting OTP & terminal mock OTP logged (`269454`).
  3. Entering 6-digit OTP and authenticating session.
  4. Viewing Financial Summary Card & loan statuses.
  5. Demonstrating filter tabs (All, Active, Overdue, Repaid).
  6. Adding a new loan entry (*Ananya Roy*, ₹3,200, due in 14 days).
  7. Real-time PostgreSQL persistence & summary update.
  8. Marking an outstanding loan as repaid (*Priya Patel*, ₹2,000) and witnessing real-time ledger settlement.
  9. Final overview of the synchronized, error-free ledger state.

---

## 6. Environmental Status & Blockers

1. **Docker Desktop WSL Daemon**:
   - **Status**: **BLOCKED (Mitigated)**
   - **Cause**: Windows Subsystem for Linux (WSL) on the host machine has no Linux distribution installed, preventing Docker Desktop from starting its Linux container engine.
   - **Resolution**: Solved natively without Docker dependency using `@embedded-postgres/windows-x64` on standard port 5432. All Prisma migrations, tests, seeds, and runtime operations ran against native PostgreSQL.
2. **Android Emulator**:
   - **Status**: **NOT RUN (Mitigated)**
   - **Cause**: No preconfigured Android Virtual Device (AVD) is installed on the host machine.
   - **Resolution**: Mobile app was compiled and exported with full Expo Web support and validated in an authentic 430x880 smartphone viewport.
3. **GitHub Remote Push**:
   - **Status**: **PASS**
   - **Result**: Successfully created and pushed public repository `Arthur-2407/miniledger-fullstack-internship`.
