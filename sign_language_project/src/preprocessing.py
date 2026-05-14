from __future__ import annotations
import cv2
import numpy as np
from pathlib import Path


def load_video_frames(video_path: Path) -> list[np.ndarray]:
    cap = cv2.VideoCapture(str(video_path))
    if not cap.isOpened():
        raise ValueError(f"Could not open video {video_path}")
    frames: list[np.ndarray] = []
    while True:
        ret, frame = cap.read()
        if not ret:
            break
        frames.append(frame)
    cap.release()
    if not frames:
        raise ValueError(f"No frames extracted from {video_path}")
    return frames


def load_image_frames_from_folder(folder_path: Path) -> list[np.ndarray]:
    from src.config import IMAGE_EXTENSIONS
    image_files = [
        p for p in folder_path.iterdir()
        if p.suffix in IMAGE_EXTENSIONS
    ]

    def _key(p: Path):
        try:
            return int(p.stem.rsplit("_", 1)[-1])
        except (ValueError, IndexError):
            return p.stem

    image_files = sorted(image_files, key=_key)
    frames: list[np.ndarray] = []
    for img_path in image_files:
        frame = cv2.imread(str(img_path))
        if frame is not None:
            frames.append(frame)
    return frames


def load_single_image(img_path: Path) -> np.ndarray:
    frame = cv2.imread(str(img_path))
    if frame is None:
        raise ValueError(f"Could not read image {img_path}")
    return frame


def normalize_landmarks(landmarks: np.ndarray) -> np.ndarray:
    lm = landmarks.copy().reshape(-1, 3)
    wrist = lm[0].copy()
    lm = lm - wrist
    max_dist = np.max(np.linalg.norm(lm, axis=1))
    if max_dist > 0:
        lm = lm / max_dist
    return lm.flatten()