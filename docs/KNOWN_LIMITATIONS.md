# MiniLedger — Known Limitations & Environmental Notes

## 1. Environment & Infrastructure

### Docker Desktop WSL Engine
- **Observed Behavior**: Docker Desktop for Windows is installed on the host machine (`Docker version 29.2.1`), but its daemon failed to start because the underlying Windows Subsystem for Linux (WSL) currently has no Linux distribution installed (`wslservice` was active but `wsl -l -v` reported no distributions).
- **Mitigation Implemented**: To ensure zero reliance on an unconfigured WSL distribution and provide immediate reproducibility, MiniLedger provides both `docker-compose.yml` (for standard container environments) and a zero-configuration native PostgreSQL launcher (`scripts/start-local-db.mjs` using `@embedded-postgres/windows-x64`). Both connect identically via standard PostgreSQL port `5432` with connection string `postgresql://postgres:postgres@localhost:5432/miniledger`.

### Native Android Emulator vs Web Preview
- **Observed Behavior**: Android SDK Platform-Tools (`adb`) is installed, but no preconfigured Android Virtual Device (AVD) image was initialized on the machine (`emulator -list-avds` returned empty).
- **Mitigation Implemented**: MiniLedger was built and bundled with full cross-platform Expo support (Mobile & Web). We exported and served the application via Metro bundler and executed the end-to-end integration and demonstration recording in a 430x880 mobile-sized smartphone viewport.

---

## 2. Architectural & Application Limitations

### Mock OTP in Development
- **Design Decision**: In accordance with assignment instructions, authentication uses a passwordless mock OTP workflow where the 6-digit verification code is printed directly to the API server's development terminal. In a production environment, this would be replaced with a carrier SMS gateway provider (e.g. Twilio, AWS SNS, Gupshup).

### Local Disk Receipt Storage
- **Design Decision**: The optional receipt photo upload bonus is implemented and persists image files to the local server disk (`./uploads`) with sanitized UUID filenames and metadata tracking in PostgreSQL. In a cloud production architecture, this would be transitioned to object storage (e.g., AWS S3 or Cloudflare R2) using pre-signed upload URLs.

### Single-Payment Model
- **Design Decision**: Per assignment specifications, loans are either outstanding or marked fully repaid (`isRepaid: true`). Partial installment payments are not modeled.
