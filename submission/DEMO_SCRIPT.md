# MiniLedger — Demonstration Script & Video Walkthrough

## 1. Video Recording Deliverable
- **File Location**: `submission/miniledger-demo.mp4`
- **Backup WebP Recording**: `submission/miniledger-demo.webp`
- **Exact Duration**: 145.0 seconds (2 minutes, 25 seconds)
- **Resolution**: 430 x 880 (Mobile Smartphone Viewport)
- **Frame Rate**: 10 FPS
- **File Size**: ~3.6 MB

---

## 2. Chronological Walkthrough Sequence

| Timestamp | Step Name | Interaction & Features Showcased |
|---|---|---|
| **00:00 - 00:16** | **Step 1: App Launch & Login** | MiniLedger launches with high-contrast fintech dark UI (`#0B0F19`), Indian Rupee branding (`₹`), and international phone input prefilled with demo number `+919876543210`. User triggers *Send Verification Code →*. |
| **00:16 - 00:34** | **Step 2: Server Terminal Mock OTP** | Screen transitions to OTP verification. The client displays a development notice explaining that the mock OTP is logged in the server terminal logs (`🔑 [DEV-OTP] Verification code for +91 ****** 3210: >>> 269454 <<<`). |
| **00:34 - 00:50** | **Step 3: OTP Verification & JWT** | User enters the 6-digit OTP `269454`. The backend validates the cryptographic bcrypt hash, marks the challenge consumed (preventing replay attacks), creates/finds the user, and returns a signed JWT stored securely. |
| **00:50 - 01:10** | **Step 4: Financial Dashboard** | Main ledger view loads. Prominently displays the **Financial Summary Card** with Total Lent, Total Repaid, and Overdue Amount. Displays active loans, overdue loans (in crimson), and settled loans (in emerald green). |
| **01:10 - 01:30** | **Step 5: Overdue Highlighting & Filters** | Demonstrates the filter tabs (*All*, *Active*, *Overdue*, *Repaid*). Selecting *Overdue* filters down to overdue obligations whose due dates have elapsed. Returns to *All* and clicks *+ Add Loan*. |
| **01:30 - 01:50** | **Step 6: Add Loan Entry** | The Add Loan modal appears with form validation. User enters friend's name (*Ananya Roy*), positive amount (*₹3,200*), and clicks the quick *+14 Days* preset button. Clicks *Save Loan*. |
| **01:50 - 02:08** | **Step 7: Real-Time PostgreSQL Update** | The loan entry is committed to PostgreSQL with exact `Decimal(12, 2)` precision. The summary updates immediately: Total Lent increases by ₹3,200 to reflect the new loan. |
| **02:08 - 02:28** | **Step 8: Repayment & Settlement** | User clicks *✓ Mark as Repaid* on an outstanding loan (*Priya Patel*, ₹2,000). The backend patches `isRepaid = true` and `repaidAt = timestamp`. The card updates to green `✓ REPAID` and Total Repaid increases to ₹4,500.00. |
| **02:28 - 02:45** | **Conclusion** | Final overview of the synchronized ledger, showcasing mathematical accuracy, persistent state, zero unhandled errors, and clean fintech aesthetic. |

---

## 3. Playback Instructions

To inspect the generated demonstration recording:
- Open `submission/miniledger-demo.mp4` using any standard media player (VLC, Windows Media Player, QuickTime).
- Web browser preview can also be viewed by launching `submission/miniledger-demo.mp4` directly in Chrome or Edge.
