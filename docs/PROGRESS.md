# MiniLedger — Progress Tracker

## Status Overview
- **Phase 1: Environment & Workspace Inspection**: COMPLETED
- **Phase 2: Project Architecture & Setup**: IN PROGRESS
- **Phase 3: Backend & Database Implementation**: PENDING
- **Phase 4: Receipt Upload Bonus Feature**: PENDING
- **Phase 5: React Native Mobile Application**: PENDING
- **Phase 6: Development Environment & Reproducibility**: PENDING
- **Phase 7: Automated Testing & QA**: PENDING
- **Phase 8: Full Integration & Runtime Validation**: PENDING
- **Phase 9: Deployment Readiness & Security**: PENDING
- **Phase 10: README & Documentation**: PENDING
- **Phase 11: GitHub Repository & Release**: PENDING
- **Phase 12: Demonstration Video Recording**: PENDING
- **Phase 13: Final Acceptance Audit & Deliverables**: PENDING

## Detailed Task Checklist

### Environment & Tools
- [x] Check Node.js (v20.20.1) & npm (10.8.2)
- [x] Check Git (v2.53.0)
- [x] Check Docker & Docker Engine (running)
- [x] Check GitHub CLI (authenticated as `Arthur-2407`)
- [x] Check Android SDK & ADB (`C:\Users\SATYAJEET\AppData\Local\Android\Sdk`)
- [x] Create `docs/IMPLEMENTATION_PLAN.md`
- [x] Create `docs/PROGRESS.md`

### Architecture & Setup
- [ ] Initialize Git repository
- [ ] Setup root `package.json` with npm workspaces (`apps/api`, `apps/mobile`)
- [ ] Setup `.gitignore` with strict security exclusions
- [ ] Setup `docker-compose.yml` for PostgreSQL
- [ ] Setup `.env.example`

### Backend (`apps/api`)
- [ ] Initialize TypeScript, Express, Prisma, Zod, JWT, bcryptjs, Multer
- [ ] Prisma Schema (`User`, `Loan`, `OtpChallenge`) with Decimal precision & Date types
- [ ] Run Prisma migration & generate client
- [ ] Health check endpoint (`GET /api/health`)
- [ ] Auth: `POST /api/auth/request-otp` (cryptographic 6-digit OTP, terminal log, rate-limited)
- [ ] Auth: `POST /api/auth/verify-otp` (bcrypt check, expiry check, single-use, JWT issuance)
- [ ] Loans: `GET /api/loans` (user-scoped, sorted)
- [ ] Loans: `POST /api/loans` (validated amount & due date, user-scoped)
- [ ] Loans: `PATCH /api/loans/:id/repay` (ownership check, idempotent, updates summary)
- [ ] Summary: `GET /api/summary` (totalLent, totalRepaid, overdueAmount, currency: INR)
- [ ] Bonus: `POST /api/loans/:id/receipt` & `GET /api/loans/:id/receipt` (authenticated, sanitized)
- [ ] Security middlewares (Helmet, CORS, Rate Limit, Error Handler)

### Automated Testing (`apps/api`)
- [ ] Vitest configuration
- [ ] Unit & Integration tests for Auth
- [ ] Unit & Integration tests for Loans
- [ ] Unit & Integration tests for Summary calculations
- [ ] Unit & Integration tests for Receipt Upload & Isolation

### Mobile (`apps/mobile`)
- [ ] Expo React Native TypeScript project structure
- [ ] Fintech design system & tokens (light/dark contrast, rupee symbol ₹)
- [ ] API Client with auth token interceptor & configurable base URL
- [ ] Screen: Phone Number Login
- [ ] Screen: OTP Verification with terminal helper notice
- [ ] Screen: Dashboard with Summary Card (Total Lent, Repaid, Overdue alert)
- [ ] Screen: Loan List with status badges & overdue visual highlighting
- [ ] Screen: Add Loan form with validation, date picker & receipt photo picker
- [ ] Modal/Viewer: View receipt photo
- [ ] Empty, Loading, and Error/Retry states

### Verification, Recording & Deliverables
- [ ] Run automated test suite
- [ ] Integration validation with live Docker Postgres & backend
- [ ] Create walkthrough recording (`submission/miniledger-demo.mp4` / web recording)
- [ ] Write `README.md`, `docs/ARCHITECTURE.md`, `docs/INTERVIEW_GUIDE.md`
- [ ] Write `submission/DEMO_SCRIPT.md` & `submission/SUBMISSION_STATUS.md`
- [ ] Stage and commit cleanly to Git; push to GitHub via authenticated `gh`
