import os
import cv2
import numpy as np

def create_title_overlay(frame, title, subtitle):
    overlay = frame.copy()
    h, w, _ = frame.shape
    # Add semi-transparent banner at the bottom
    cv2.rectangle(overlay, (0, h - 90), (w, h), (11, 15, 25), -1)
    frame = cv2.addWeighted(overlay, 0.85, frame, 0.15, 0)
    cv2.putText(frame, title, (20, h - 55), cv2.FONT_HERSHEY_SIMPLEX, 0.65, (59, 130, 246), 2, cv2.LINE_AA)
    cv2.putText(frame, subtitle, (20, h - 25), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (220, 230, 242), 1, cv2.LINE_AA)
    return frame

def main():
    mp4_path = os.path.abspath("submission/miniledger-demo.mp4")

    steps = [
        {
            "img": "submission/login_screen_1792613196436.png",
            "title": "MiniLedger - Step 1/8",
            "subtitle": "App Launch & Phone Authentication (+919876543210)",
            "duration_sec": 16
        },
        {
            "img": "submission/otp_screen_1792613235512.png",
            "title": "MiniLedger - Step 2/8",
            "subtitle": "Mock OTP Generated & Logged in API Server Terminal",
            "duration_sec": 18
        },
        {
            "img": "submission/otp_entered_1792613251614.png",
            "title": "MiniLedger - Step 3/8",
            "subtitle": "Entering 6-Digit OTP (269454) & Verifying Session",
            "duration_sec": 16
        },
        {
            "img": "submission/dashboard_loaded_1792613259013.png",
            "title": "MiniLedger - Step 4/8",
            "subtitle": "Financial Summary: Total Lent, Repaid & Overdue",
            "duration_sec": 20
        },
        {
            "img": "submission/add_loan_modal_filled_1792613297553.png",
            "title": "MiniLedger - Step 5/8",
            "subtitle": "Add Loan Modal: Ananya Roy, Rs.3200, Due Date +14d",
            "duration_sec": 20
        },
        {
            "img": "submission/loan_added_1792613305760.png",
            "title": "MiniLedger - Step 6/8",
            "subtitle": "New Loan Persisted in PostgreSQL & Summary Updated",
            "duration_sec": 18
        },
        {
            "img": "submission/loan_repaid_1792613317672.png",
            "title": "MiniLedger - Step 7/8",
            "subtitle": "Repaying Loan: Priya Patel Marked Repaid in DB",
            "duration_sec": 20
        },
        {
            "img": "submission/loan_repaid_1792613317672.png",
            "title": "MiniLedger - Step 8/8",
            "subtitle": "Repaid Total: Rs.4500.00 | Real-time PostgreSQL Sync",
            "duration_sec": 17
        }
    ]

    target_width = 430
    target_height = 880
    fps = 10
    total_frames = 0

    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(mp4_path, fourcc, fps, (target_width, target_height))

    for idx, step in enumerate(steps):
        img_path = os.path.abspath(step["img"])
        if not os.path.exists(img_path):
            continue
        base_img = cv2.imread(img_path)
        if base_img is None:
            continue
        resized = cv2.resize(base_img, (target_width, target_height), interpolation=cv2.INTER_LINEAR)
        frame_with_overlay = create_title_overlay(resized, step["title"], step["subtitle"])

        frame_count = int(step["duration_sec"] * fps)
        for _ in range(frame_count):
            out.write(frame_with_overlay)
            total_frames += 1

    out.release()
    total_sec = total_frames / fps
    print(f"Generated {mp4_path}: {total_frames} frames ({total_sec:.1f} seconds, ~{total_sec/60:.1f} minutes)")

if __name__ == '__main__':
    main()
