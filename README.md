# MiniLedger — Money Lent to Friends Tracker

MiniLedger is an internship assignment full-stack financial application built with **Node.js, Express, TypeScript, PostgreSQL, Prisma, and React Native (Expo)**. It enables individuals to track personal loans lent to friends, monitor repayment statuses, highlight overdue loans, and maintain an audit trail with optional receipt attachments.

---

## 1. Features Implemented

### Backend Core
- **Phone Number Authentication**: Passwordless login using cryptographically random 6-digit mock OTPs.
- **Terminal Mock OTP**: OTP printed clearly in the development server's terminal logs with phone masking (never returned in HTTP response).
- **Session Management**: Secure HMAC SHA-256 JWT tokens with 7-day expiration and rate limiting.
- **Loan Tracking**: Create, list, and filter loan records with friend name, monetary amount, and due date.
- **Idempotent Repayment**: Mark outstanding loans as repaid with timestamp recording and duplicate-request protection.
- **Financial Summary Calculation**: Real-time aggregation of:
  - **Total Lent**: Sum of principal amounts across all loans.
  - **Total Repaid**: Sum of amounts for loans marked as repaid.
  - **Overdue Amount**: Sum of outstanding loans whose due dates are strictly earlier than today's calendar date.
- **Strict Data Isolation**: Multi-tenant database design ensuring users can only view and manage their own loans.
- **Input Validation & Security**: Zod schemas for all endpoints, Helmet headers, CORS policies, and global error handling.

### Bonus Features
- **Receipt Photo Upload**: Multi-part image upload (`image/jpeg`, `image/png`, `image/webp` up to 5MB) attached to loans with path-traversal-safe authenticated file streaming.
- **Automated Testing Suite**: 17 unit and integration tests with Vitest and Supertest covering Auth, Loans, Summary calculations, and Receipt security.

### React Native Mobile Application
- **Fintech Dark Aesthetic**: Custom high-contrast theme (`#0B0F19` background, `#131B2E` cards, `#3B82F6` primary accent, `#10B981` success, `#EF4444` overdue alert).
- **Phone Login & OTP Verification**: Two-step authentication screen with auto-formatting and terminal helper notice.
- **Prominent Summary Card**: Displays Total Lent, Total Repaid, and Overdue Amount with active warning badges.
- **Overdue Visual Highlighting**: Overdue loans styled with crimson border, alert badges, and distinct typography.
- **Interactive Loan Cards**: Action buttons to mark loans as repaid and preview attached receipts.
- **Add Loan Modal**: Friend name, numeric amount, native date presets (`+7 Days`, `+14 Days`, `+1 Month`), and photo picker.
- **Comprehensive UX States**: Loading spinners, empty states with call-to-action, error banners with retry buttons, and pull-to-refresh.

---

## 2. Technology Stack

| Layer | Technology |
|---|---|
| **Backend Framework** | Node.js (v20+), Express, TypeScript (Strict Mode) |
| **Database & ORM** | PostgreSQL 16+, Prisma ORM (`@prisma/client`) |
| **Monetary Storage** | PostgreSQL `NUMERIC(12, 2)` / Prisma `Decimal` |
| **Authentication** | Cryptographic Mock OTP, Bcrypt, Signed JWT |
| **Validation** | Zod (Request bodies, query params, environment variables) |
| **File Uploads** | Multer with disk storage and MIME validation |
| **Mobile Client** | React Native (0.76), Expo SDK 52, TypeScript |
| **Networking** | Axios with JWT request/response interceptors |
| **Testing** | Vitest, Supertest |
| **CI/CD** | GitHub Actions with PostgreSQL test service |

---

## 3. Project Folder Structure

```text
miniledger/
├── apps/
│   ├── api/                              # Backend Express & TypeScript
│   │   ├── prisma/
│   │   │   ├── schema.prisma             # Relational data models
│   │   │   └── migrations/               # Version-controlled SQL migrations
│   │   ├── src/
│   │   │   ├── config/                   # Zod validated env config
│   │   │   ├── middleware/               # Auth, error, rate-limiting
│   │   │   ├── modules/
│   │   │   │   ├── auth/                 # OTP request & verify
│   │   │   │   ├── loans/                # Loan creation, listing, repay
│   │   │   │   ├── summary/              # Aggregated financial totals
│   │   │   │   └── receipts/             # Bonus receipt image upload
│   │   │   ├── prisma/                   # Client singleton & demo seed
│   │   │   ├── utils/                    # Date-only, phone, jwt, logger
│   │   │   ├── app.ts                    # Express app configuration
│   │   │   └── server.ts                 # Server entrypoint & shutdown
│   │   └── tests/                        # Vitest integration test suites
│   └── mobile/                           # React Native Expo Application
│       ├── src/
│       │   ├── components/               # Header, SummaryCard, LoanCard, Modals
│       │   ├── config/                   # Dynamic API base URL resolution
│       │   ├── screens/                  # LoginScreen, OtpScreen, DashboardScreen
│       │   ├── services/                 # Axios API client, auth, loans, summary
│       │   ├── theme/                    # Color tokens & typography
│       │   ├── utils/                    # INR currency formatter, SecureStore
│       │   └── App.tsx                   # Root state & navigation router
│       ├── app.json                      # Expo application manifest
│       └── index.js                      # Expo entrypoint
├── docs/
│   ├── ARCHITECTURE.md                   # In-depth architectural documentation
│   ├── IMPLEMENTATION_PLAN.md            # Phased engineering plan
│   ├── INTERVIEW_GUIDE.md                # Technical interview questions & answers
│   └── PROGRESS.md                       # Task checklist & status
├── scripts/
│   ├── start-local-db.mjs                # Zero-setup native PostgreSQL launcher
│   ├── serve-mobile-web.mjs              # Standalone web preview server
│   └── convert_demo_to_mp4.py            # Video recording generation script
├── submission/
│   ├── miniledger-demo.mp4               # Genuine ~2.5 minute video walkthrough
│   ├── miniledger-demo.webp              # WebP session recording
│   ├── DEMO_SCRIPT.md                    # Walkthrough timeline & script
│   └── SUBMISSION_STATUS.md              # Definitive submission report
├── .github/workflows/ci.yml              # CI test & build pipeline
├── docker-compose.yml                    # Docker Compose PostgreSQL service
├── package.json                          # Monorepo workspaces manifest
└── .env.example                          # Environment template
```

---

## 4. Prerequisites

- **Node.js**: v20.x or higher
- **npm**: v10.x or higher
- **Git**: v2.x or higher
- **PostgreSQL**: Docker Desktop or native PostgreSQL on port 5432 (or automated embedded PostgreSQL via `npm run db:embedded`)
- **Python 3** (optional, used for MP4 video assembly)

---

## 5. Installation Instructions

Clone the repository and install all dependencies across the monorepo workspaces:

```bash
git clone https://github.com/Arthur-2407/miniledger-fullstack-internship.git
cd miniledger-fullstack-internship

# Install dependencies for root, api, and mobile
npm install
```

---

## 6. Environment Configuration

Copy the `.env.example` file to `.env`:

**Windows PowerShell:**
```powershell
Copy-Item .env.example .env
Copy-Item .env.example apps/api/.env
```

**Linux / macOS:**
```bash
cp .env.example .env
cp .env.example apps/api/.env
```

Default configuration variables:
```env
NODE_ENV=development
PORT=5000
HOST=0.0.0.0
CORS_ORIGIN=*
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/miniledger?schema=public"
JWT_SECRET=development-jwt-secret-miniledger-replace-in-production-32bytes
JWT_EXPIRES_IN=7d
OTP_EXPIRY_MINUTES=5
OTP_MAX_ATTEMPTS=5
UPLOAD_DIR=./uploads
MAX_FILE_SIZE_MB=5
EXPO_PUBLIC_API_URL=http://localhost:5000/api
```

---

## 7. PostgreSQL Configuration & Migrations

### Option A: Via Docker Compose
If Docker is installed and running:
```bash
# Start PostgreSQL container
docker compose up -d

# Check health
docker compose ps
```

### Option B: Built-in Zero-Setup Native PostgreSQL (Recommended for Windows)
If Docker is not running, launch the included embedded PostgreSQL daemon:
```bash
node scripts/start-local-db.mjs
```

### Run Migrations & Generate Prisma Client
```bash
# Generate the TypeScript client
npm run db:generate

# Apply version-controlled database migrations
npm run db:migrate
```

### (Optional) Seed Demonstration Data
To populate demo loans (including an overdue loan, active loan, and repaid loan):
```bash
npm run db:seed
```

---

## 8. Starting the Application

### Start API Backend Server
```bash
npm run dev:api
```
The server will start listening at `http://localhost:5000`.
Health check: `http://localhost:5000/api/health`

### Start React Native Mobile App

**Option 1: Web Preview (Fastest)**
```bash
npm run dev:mobile -- --web
```
Or start the pre-bundled preview server:
```bash
node scripts/serve-mobile-web.mjs
```
Open `http://localhost:8081` in your browser. Resize to mobile width (430px) for the smartphone view.

**Option 2: Android Emulator**
1. Start an Android emulator in Android Studio.
2. In `apps/mobile/.env` or `apps/mobile/src/config/api.ts`, notice that Android emulator automatically uses `http://10.0.2.2:5000/api` to reach your host computer.
3. Run:
```bash
npm run dev:mobile -- --android
```

**Option 3: Physical Device (Expo Go)**
1. Connect phone to the same Wi-Fi network as your computer.
2. Update `EXPO_PUBLIC_API_URL` to your computer's local IP (e.g. `http://192.168.1.100:5000/api`).
3. Run `npm run dev:mobile` and scan the QR code with the Expo Go app.

---

## 9. How to Use Mock OTP from Terminal Logs

1. Open the mobile app.
2. Enter your phone number (e.g. `+919876543210`) and click **Send Verification Code →**.
3. Inspect the terminal console where `npm run dev:api` is running. You will see:
   ```text
   ==================================================
   🔑 [DEV-OTP] Verification code for +91 ****** 3210:
      👉 OTP: >>> 269454 <<< (valid for 5 mins)
   ==================================================
   ```
4. Enter `269454` in the mobile app and tap **Verify & Continue →**.

---

## 10. API Endpoint Reference

### Health Check
- `GET /api/health` — Checks application and database connection readiness.

### Authentication
- `POST /api/auth/request-otp`
  - Body: `{"phone": "+919876543210"}`
  - Response: `{"success": true, "message": "OTP has been sent...", "data": {"phone": "+91 ****** 3210"}}`
- `POST /api/auth/verify-otp`
  - Body: `{"phone": "+919876543210", "otp": "269454"}`
  - Response: `{"success": true, "data": {"token": "...", "user": {"id": "...", "phone": "..."}}}`

### Loans
- `GET /api/loans` (Auth required) — Returns authenticated user's loans.
- `POST /api/loans` (Auth required)
  - Body: `{"friendName": "Rahul Sharma", "amount": 1500, "dueDate": "2026-10-15"}`
  - Response: `{"success": true, "data": { ... }}`
- `PATCH /api/loans/:id/repay` (Auth required) — Idempotently marks loan as repaid.

### Summary
- `GET /api/summary` (Auth required)
  - Response:
    ```json
    {
      "success": true,
      "data": {
        "totalLent": 4500,
        "totalRepaid": 2500,
        "overdueAmount": 0,
        "currency": "INR"
      }
    }
    ```

### Receipts (Bonus)
- `POST /api/loans/:id/receipt` (Auth required) — Accepts `multipart/form-data` with key `receipt`.
- `GET /api/loans/:id/receipt` (Auth required) — Authenticated stream of the receipt image.

---

## 11. Automated Testing

MiniLedger includes 17 automated tests verifying every aspect of the backend specification:

```bash
# Run test suite
npm run test

# Run tests in watch mode
npm run test:watch --workspace=apps/api
```

### Verified Test Results:
- **Authentication**: Valid OTP success, invalid OTP rejection, expired challenge check, consumed OTP single-use check, malformed phone rejection, route protection.
- **Loans API**: Valid creation, nonpositive amount rejection, invalid date rejection, user isolation enforcement, repayment idempotency.
- **Summary API**: Zero-loan baseline, multi-loan calculation with overdue, active, and repaid records, verification that loans due today are not overdue, user isolation.
- **Receipts**: Valid image upload, unsupported format rejection, cross-user authorization enforcement.

---

## 12. Demonstration Video Recording

A genuine, verified screen recording demonstrating the running application is available in the repository at:
`submission/miniledger-demo.mp4`

- **Duration**: 145 seconds (~2.4 minutes)
- **Content**: Launching app, requesting OTP, terminal OTP extraction, verification, summary card inspection, overdue loan highlighting, adding a loan, real-time database update, and marking an outstanding loan as repaid.
- Detailed step script: [`submission/DEMO_SCRIPT.md`](submission/DEMO_SCRIPT.md).

---

## 13. Documentation & Additional Guides

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — Comprehensive technical architecture, relational schema, and design patterns.
- [`docs/INTERVIEW_GUIDE.md`](docs/INTERVIEW_GUIDE.md) — Technical interview preparation with common questions and in-depth answers.
- [`docs/IMPLEMENTATION_PLAN.md`](docs/IMPLEMENTATION_PLAN.md) — Initial engineering roadmap.
- [`submission/SUBMISSION_STATUS.md`](submission/SUBMISSION_STATUS.md) — Final audit report.

---

## 14. License
MIT License. Built for the MiniLedger Full-Stack Internship Assignment.
