from __future__ import annotations
import sys
import numpy as np
import joblib
from pathlib import Path
from src.config import PROCESSEDDATADIR, MODELSDIR
from src.preprocessing import load_video_frames
from src.feature_extraction import HandLandmarkExtractor


def load_model():
    model   = joblib.load(MODELSDIR / "sign_language_model.pkl")
    encoder = joblib.load(PROCESSEDDATADIR / "label_encoder.pkl")
    return model, encoder


def predict_video(video_path: Path) -> None:
    model, encoder = load_model()
    extractor      = HandLandmarkExtractor()
    frames         = load_video_frames(video_path)
    features       = extractor.extract_from_frames(frames)

    if features is None:
        print("ERROR: No hands detected.")
        return

    features = features.reshape(1, -1)
    raw_pred = model.predict(features)[0]
    predicted_label = (
        str(encoder.classes_[int(raw_pred)])
        if isinstance(raw_pred, (int, np.integer))
        else str(raw_pred)
    )
    probabilities = model.predict_proba(features)[0]
    print(f"\n  Predicted Sign: {predicted_label}")
    for label, prob in zip(encoder.classes_, probabilities):
        print(f"    {label:<14s}  {prob:.4f}  {'█' * int(prob * 20)}")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python -m src.inference <path-to-video>")
        sys.exit(1)
    predict_video(Path(sys.argv[1]))