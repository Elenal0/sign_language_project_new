from __future__ import annotations
import cv2
import numpy as np
import mediapipe as mp
from mediapipe.tasks import python as mp_python
from mediapipe.tasks.python import vision as mp_vision
from mediapipe.tasks.python.vision import RunningMode
import urllib.request
import os
from pathlib import Path

# ── MediaPipe Hand Landmarker model download ──────────────────────────────────
_MODEL_FILENAME = "hand_landmarker.task"
_MODEL_URL = (
    "https://storage.googleapis.com/mediapipe-models/hand_landmarker/"
    "hand_landmarker/float16/latest/hand_landmarker.task"
)
_MODEL_PATH = Path(__file__).resolve().parent.parent / "models" / _MODEL_FILENAME


def _ensure_model() -> str:
    """Download the MediaPipe hand landmarker task file if not already present."""
    _MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
    if not _MODEL_PATH.exists():
        print(f"[HandLandmarkExtractor] Downloading MediaPipe model -> {_MODEL_PATH}")
        urllib.request.urlretrieve(_MODEL_URL, str(_MODEL_PATH))
        print("[HandLandmarkExtractor] Download complete.")
    return str(_MODEL_PATH)


class HandLandmarkExtractor:
    """
    Extract hand landmarks using Google MediaPipe HandLandmarker (Tasks API).

    Compatible with mediapipe >= 0.10.21 which removed mp.solutions.hands.

    Parameters
    ----------
    max_hands : int
        Maximum number of hands to detect (1 or 2).
    min_detection_confidence : float
        Minimum confidence for detection.
    min_tracking_confidence : float
        Minimum confidence for tracking (ignored when static_image_mode=True).
    static_image_mode : bool
        Set True when processing individual images (dataset building / API).
        Set False for video streams / real-time webcam.
    """

    def __init__(
        self,
        max_hands: int = 2,
        min_detection_confidence: float = 0.7,
        min_tracking_confidence: float = 0.5,
        static_image_mode: bool = False,
    ) -> None:
        model_path = _ensure_model()

        running_mode = RunningMode.IMAGE if static_image_mode else RunningMode.IMAGE

        base_options = mp_python.BaseOptions(model_asset_path=model_path)
        options = mp_vision.HandLandmarkerOptions(
            base_options=base_options,
            running_mode=running_mode,
            num_hands=max_hands,
            min_hand_detection_confidence=min_detection_confidence,
            min_hand_presence_confidence=min_detection_confidence,
            min_tracking_confidence=min_tracking_confidence,
        )
        self._detector = mp_vision.HandLandmarker.create_from_options(options)
        self._max_hands = max_hands

    # ── Internal helper ───────────────────────────────────────────────────────

    def _detect(self, frame: np.ndarray):
        """Run the MediaPipe detector on a BGR numpy frame. Returns detection result."""
        frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=frame_rgb)
        return self._detector.detect(mp_image)

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
            Input frame (unchanged — drawing removed for headless server).
        hand_detected : bool
            True if at least one hand was found.
        """
        result = self._detect(frame)
        landmarks = np.zeros(126, dtype=np.float32)
        hand_detected = False

        if result.hand_landmarks:
            hand_detected = True
            for hand_idx, hand_lms in enumerate(result.hand_landmarks[:2]):
                offset = hand_idx * 63  # 21 lm × 3 coords per hand
                for lm_idx, lm in enumerate(hand_lms):
                    landmarks[offset + lm_idx * 3]     = lm.x
                    landmarks[offset + lm_idx * 3 + 1] = lm.y
                    landmarks[offset + lm_idx * 3 + 2] = lm.z

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
        Used in real-time mode for NLP sentence selection.
        """
        result = self._detect(frame)
        if not result.hand_landmarks:
            return 0
        lm = result.hand_landmarks[0]
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
        if hasattr(self, '_detector'):
            self._detector.close()