from __future__ import annotations
import cv2
import numpy as np
import mediapipe as mp


class HandLandmarkExtractor:
    """
    Extract hand landmarks using Google MediaPipe Hands.

    Parameters
    ----------
    max_hands : int
        Maximum number of hands to detect (1 or 2).
    min_detection_confidence : float
        Minimum confidence for detection.
    min_tracking_confidence : float
        Minimum confidence for tracking (ignored when static_image_mode=True).
    static_image_mode : bool
        Set True when processing individual images (dataset building).
        Set False for video streams / real-time webcam.
    """

    def __init__(
        self,
        max_hands: int = 2,
        min_detection_confidence: float = 0.7,
        min_tracking_confidence: float = 0.5,
        static_image_mode: bool = False,
    ) -> None:
        # Verify MediaPipe installed correctly (HPC / headless environments)
        if not hasattr(mp, 'solutions'):
            raise RuntimeError(
                "MediaPipe solutions module is missing.\n"
                "Fix: pip uninstall opencv-python mediapipe && "
                "pip install opencv-python-headless mediapipe"
            )
        self.mp_hands = mp.solutions.hands
        self.mp_draw  = mp.solutions.drawing_utils
        self.hands    = self.mp_hands.Hands(
            static_image_mode=static_image_mode,
            max_num_hands=max_hands,
            min_detection_confidence=min_detection_confidence,
            min_tracking_confidence=min_tracking_confidence,
        )

    # ── Core extraction ───────────────────────────────────────────────────────

    def extract_landmarks(
        self, frame: np.ndarray
    ) -> tuple[np.ndarray, np.ndarray, bool]:
        """
        Extract raw hand landmarks from a single BGR frame.

        Returns
        -------
        landmarks : np.ndarray, shape (126,)
            Flattened x, y, z for up to 2 hands (21 lm × 3 coords × 2 hands).
            Zero-padded if fewer than 2 hands are detected.
        frame : np.ndarray
            Input frame with landmark skeleton drawn on it.
        hand_detected : bool
            True if at least one hand was found.
        """
        frame_rgb     = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results       = self.hands.process(frame_rgb)
        landmarks     = np.zeros(126, dtype=np.float32)
        hand_detected = False

        if results.multi_hand_landmarks:
            hand_detected = True
            for hand_idx, hand_lms in enumerate(results.multi_hand_landmarks[:2]):
                offset = hand_idx * 63  # 21 lm × 3 coords per hand
                for lm_idx, lm in enumerate(hand_lms.landmark):
                    landmarks[offset + lm_idx * 3]     = lm.x
                    landmarks[offset + lm_idx * 3 + 1] = lm.y
                    landmarks[offset + lm_idx * 3 + 2] = lm.z
                self.mp_draw.draw_landmarks(
                    frame, hand_lms, self.mp_hands.HAND_CONNECTIONS
                )

        return landmarks, frame, hand_detected

    # ── Normalisation ─────────────────────────────────────────────────────────

    def normalize_landmarks(self, landmarks: np.ndarray) -> np.ndarray:
        """
        Wrist-relative normalisation — scale & translation invariant.
        Applied independently to each hand block in the 126-d vector.

        Returns
        -------
        np.ndarray, shape (126,)
        """
        reshaped = landmarks.reshape(2, 21, 3)
        for h in range(2):
            wrist = reshaped[h, 0].copy()
            reshaped[h] -= wrist
            max_dist = np.max(np.linalg.norm(reshaped[h], axis=1))
            if max_dist > 0:
                reshaped[h] /= max_dist
        return reshaped.flatten()

    # ── Frame-sequence extraction ─────────────────────────────────────────────

    def extract_from_frames(
        self, frames: list[np.ndarray]
    ) -> np.ndarray | None:
        """
        Extract a fixed-size (252,) feature vector from a list of frames.

        Strategy: collect per-frame feature vectors for all frames where a hand
        is detected, then return their mean.
        Returns None if no hand is found in any frame.

        Feature layout (252 dims):
            raw_hand_landmarks     (126)
            normalised_landmarks   (126)
        """
        all_features: list[np.ndarray] = []
        for frame in frames:
            landmarks, _, detected = self.extract_landmarks(frame)
            if detected:
                raw        = landmarks.copy()
                normalised = self.normalize_landmarks(landmarks)
                all_features.append(np.concatenate([raw, normalised]))
        if not all_features:
            return None
        return np.mean(all_features, axis=0).astype(np.float32)

    def extract_from_frame(self, frame: np.ndarray) -> np.ndarray | None:
        """
        Single-frame convenience wrapper for the FastAPI server.
        Wraps extract_from_frames([frame]) so the API doesn't need to pass a list.
        """
        return self.extract_from_frames([frame])

    # ── Finger counting ───────────────────────────────────────────────────────

    def count_extended_fingers(self, frame: np.ndarray) -> int:
        """
        Count extended fingers (0–5) from the first detected hand.
        Used in real-time mode so the user can select NLP sentence options
        by holding up 1 / 2 / 3 fingers.
        """
        frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results   = self.hands.process(frame_rgb)
        if not results.multi_hand_landmarks:
            return 0
        lm          = results.multi_hand_landmarks[0].landmark
        fingertips  = [8, 12, 16, 20]
        finger_pips = [6, 10, 14, 18]
        count = sum(
            1 for tip, pip in zip(fingertips, finger_pips)
            if lm[tip].y < lm[pip].y
        )
        # Thumb
        if abs(lm[4].x - lm[0].x) > abs(lm[3].x - lm[0].x):
            count += 1
        return count

    # ── Cleanup ───────────────────────────────────────────────────────────────

    def __del__(self) -> None:
        if hasattr(self, 'hands'):
            self.hands.close()