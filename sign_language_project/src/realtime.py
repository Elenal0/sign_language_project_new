"""
Sign Language Interpreter — real-time
Run from the PROJECT ROOT:
    python -m src.realtime

Controls:  Q = quit  |  R = reset sentence
"""
import cv2
import numpy as np
import time
import os
import sys
import joblib

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.feature_extraction import HandLandmarkExtractor
from src.nlp_model          import SentenceGenerator

HERE         = os.path.dirname(os.path.abspath(__file__))
BASE_DIR     = os.path.dirname(HERE)
MODEL_PATH   = os.path.join(BASE_DIR, "models",            "sign_language_model.pkl")
ENCODER_PATH = os.path.join(BASE_DIR, "data", "processed", "label_encoder.pkl")

FRAME_WINDOW          = 15
CONFIDENCE_THRESHOLD  = 0.60
CONSISTENCY_REQUIRED  = 2
SILENCE_THRESHOLD     = 2.0
GESTURE_HOLD_REQUIRED = 1.5
CONFIRM_DISPLAY_TIME  = 3.0

STATE_DETECTING = "detecting"
STATE_SELECTING = "selecting"
STATE_CONFIRMED = "confirmed"


def load_model():
    if not os.path.exists(MODEL_PATH):
        raise FileNotFoundError(
            f"Model not found at {MODEL_PATH}\nRun  python -m src.train  first."
        )
    if not os.path.exists(ENCODER_PATH):
        raise FileNotFoundError(
            f"Label encoder not found at {ENCODER_PATH}\n"
            "Run  python -m src.build_dataset  first."
        )
    model   = joblib.load(MODEL_PATH)
    encoder = joblib.load(ENCODER_PATH)
    print(f"[INFO] Model loaded.  Classes: {list(encoder.classes_)}")
    return model, encoder


def draw_ui(frame, state, current_words, options, selected_idx,
            status_msg, progress=0.0):
    h, w = frame.shape[:2]

    overlay = frame.copy()
    cv2.rectangle(overlay, (0, 0), (w, 65), (15, 15, 15), -1)
    cv2.addWeighted(overlay, 0.75, frame, 0.25, 0, frame)

    state_colors = {
        STATE_DETECTING: (50, 210, 100),
        STATE_SELECTING: (50, 180, 255),
        STATE_CONFIRMED: (50, 255, 80),
    }
    color = state_colors.get(state, (200, 200, 200))
    cv2.putText(frame, f"● {state.upper()}", (10, 26),
                cv2.FONT_HERSHEY_SIMPLEX, 0.65, color, 2)

    # ── FIX: force all items to str before joining ──────────────────
    word_strs = [str(w) for w in current_words]
    if word_strs:
        cv2.putText(frame, "Detected: " + " ".join(word_strs), (10, 52),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.52, (190, 190, 255), 1)

    if state == STATE_SELECTING and options:
        n       = len(options)
        panel_h = n * 44 + 70
        panel_y = h - panel_h
        ov2     = frame.copy()
        cv2.rectangle(ov2, (0, panel_y), (w, h), (20, 20, 30), -1)
        cv2.addWeighted(ov2, 0.85, frame, 0.15, 0, frame)
        cv2.putText(frame, "Hold fingers to choose:", (10, panel_y + 28),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.55, (180, 180, 180), 1)
        for i, opt in enumerate(options):
            y_pos    = panel_y + 60 + i * 44
            is_sel   = (i == selected_idx)
            bg_color = (40, 120, 80) if is_sel else (30, 30, 45)
            cv2.rectangle(frame, (8, y_pos - 28), (w - 8, y_pos + 12), bg_color, -1)
            cv2.putText(frame, f"[{i+1}]  {opt}", (16, y_pos),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.52,
                        (100, 255, 160) if is_sel else (210, 210, 210), 1)
        if selected_idx >= 0 and 0.0 < progress <= 1.0:
            bar_w = int((w - 16) * progress)
            cv2.rectangle(frame, (8, h - 12), (8 + bar_w, h - 4), (50, 220, 120), -1)

    cv2.putText(frame, status_msg, (10, h - 18),
                cv2.FONT_HERSHEY_SIMPLEX, 0.48, (200, 200, 200), 1)
    cv2.putText(frame, "Q=quit  R=reset", (w - 148, h - 10),
                cv2.FONT_HERSHEY_SIMPLEX, 0.38, (90, 90, 90), 1)
    return frame


def reset_state() -> dict:
    return dict(
        state              = STATE_DETECTING,
        frame_buffer       = [],
        current_words      = [],         # list[str]  — always strings
        options            = [],
        selected_idx       = -1,
        last_prediction    = "",
        same_pred_count    = 0,
        last_hand_time     = time.time(),
        confirmed_time     = 0.0,
        gesture_hold_start = {},
        progress           = 0.0,
        status_msg         = "Show hand to begin…",
    )


def main() -> None:
    print("[INFO] Loading sign language model …")
    model, encoder = load_model()

    print("[INFO] Loading NLP grammar model …")
    nlp = SentenceGenerator()

    extractor = HandLandmarkExtractor()
    cap       = cv2.VideoCapture(0)

    if not cap.isOpened():
        print("[ERROR] Cannot open webcam.")
        return

    print("[INFO] Ready.  Q = quit  |  R = reset")
    s = reset_state()

    while True:
        ret, frame = cap.read()
        if not ret:
            print("[ERROR] Failed to read frame.")
            break

        frame = cv2.flip(frame, 1)
        landmarks, frame, hand_detected = extractor.extract_landmarks(frame)

        # ── STATE: DETECTING ─────────────────────────────────────────
        if s["state"] == STATE_DETECTING:
            if hand_detected:
                s["last_hand_time"] = time.time()
                s["frame_buffer"].append(frame.copy())

                if len(s["frame_buffer"]) >= FRAME_WINDOW:
                    features = extractor.extract_from_frames(s["frame_buffer"])
                    s["frame_buffer"] = []

                    if features is not None:
                        features = features.reshape(1, -1)
                        proba    = model.predict_proba(features)[0]
                        max_prob = float(np.max(proba))

                        if max_prob >= CONFIDENCE_THRESHOLD:
                            # ── DECODE int → string label ─────────────
                            raw_pred = model.predict(features)[0]
                            if isinstance(raw_pred, (int, np.integer)):
                                predicted_label = str(encoder.classes_[int(raw_pred)])
                            else:
                                predicted_label = str(raw_pred)
                            # ──────────────────────────────────────────

                            if predicted_label == s["last_prediction"]:
                                s["same_pred_count"] += 1
                            else:
                                s["same_pred_count"]  = 1
                                s["last_prediction"]  = predicted_label

                            s["status_msg"] = (
                                f"Seeing '{predicted_label}'  "
                                f"{max_prob:.0%}  "
                                f"[{s['same_pred_count']}/{CONSISTENCY_REQUIRED}]"
                            )

                            if s["same_pred_count"] >= CONSISTENCY_REQUIRED:
                                words = s["current_words"]
                                if not words or words[-1] != predicted_label:
                                    words.append(predicted_label)
                                    print(f"[DETECT] Added '{predicted_label}'")
                                    s["status_msg"] = f"Added '{predicted_label}' to sentence!"
                                s["same_pred_count"] = 0
                        else:
                            s["status_msg"] = (
                                f"Low confidence {max_prob:.0%} — show hand more clearly"
                            )
            else:
                elapsed = time.time() - s["last_hand_time"]
                if s["current_words"] and elapsed >= SILENCE_THRESHOLD:
                    gloss = " ".join(s["current_words"])
                    s["status_msg"] = f"Generating options for '{gloss}' …"
                    print(f"[NLP] Input gloss: {gloss}")
                    s["options"]            = nlp.generate(gloss, num_options=3)
                    s["selected_idx"]       = -1
                    s["progress"]           = 0.0
                    s["gesture_hold_start"] = {}
                    s["state"]              = STATE_SELECTING
                    print("[NLP] Generated options:")
                    for i, opt in enumerate(s["options"]):
                        print(f"  {i+1}. {opt}")
                elif not s["current_words"]:
                    s["status_msg"] = "Show hand to begin"

        # ── STATE: SELECTING ─────────────────────────────────────────
        elif s["state"] == STATE_SELECTING:
            if hand_detected:
                finger_count = extractor.count_extended_fingers(frame)
                now          = time.time()

                if 1 <= finger_count <= len(s["options"]):
                    if finger_count not in s["gesture_hold_start"]:
                        s["gesture_hold_start"] = {finger_count: now}
                    held              = now - s["gesture_hold_start"][finger_count]
                    s["progress"]     = min(held / GESTURE_HOLD_REQUIRED, 1.0)
                    s["selected_idx"] = finger_count - 1
                    s["status_msg"]   = (
                        f"Holding {finger_count} finger(s)  "
                        f"{int(s['progress']*100)}% — keep still!"
                    )
                    if held >= GESTURE_HOLD_REQUIRED:
                        s["state"]          = STATE_CONFIRMED
                        s["confirmed_time"] = now
                        s["status_msg"]     = f"Option {finger_count} confirmed!"
                        print(f"[SELECT] Confirmed: {s['options'][s['selected_idx']]}")
                else:
                    s["gesture_hold_start"] = {}
                    s["selected_idx"]       = -1
                    s["progress"]           = 0.0
                    s["status_msg"] = (
                        "Show 1, 2, or 3 fingers to choose"
                        if finger_count == 0
                        else f"{finger_count} fingers — only 1–{len(s['options'])} valid"
                    )
            else:
                s["status_msg"] = "Show your hand with 1, 2, or 3 fingers"

        # ── STATE: CONFIRMED ─────────────────────────────────────────
        elif s["state"] == STATE_CONFIRMED:
            if time.time() - s["confirmed_time"] >= CONFIRM_DISPLAY_TIME:
                print("[INFO] Auto-reset. Ready for next sentence.")
                s = reset_state()
                s["status_msg"] = "Ready! Show hand to begin."

        draw_ui(
            frame,
            s["state"],
            s["current_words"],
            s["options"],
            s["selected_idx"],
            s["status_msg"],
            s["progress"],
        )
        cv2.imshow("Sign Language Interpreter", frame)

        key = cv2.waitKey(1) & 0xFF
        if key == ord("q"):
            print("[INFO] Quitting …")
            break
        elif key == ord("r"):
            s = reset_state()
            s["status_msg"] = "Reset! Show hand to begin."
            print("[INFO] Manual reset.")

    cap.release()
    cv2.destroyAllWindows()


if __name__ == "__main__":
    main()