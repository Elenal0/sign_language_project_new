"""
server.py  — SanketSetu FastAPI backend
Serves:
  POST /predict        — ISL sign prediction from webcam frame
  GET  /health         — model readiness check
  WS   /ws/signal/{r}  — WebRTC signaling relay (2-user video call)
  WS   /ws/chat/{r}    — Translation text relay (2-user video call)
"""

from __future__ import annotations

import base64
import binascii
import json
import logging
import os
import sys
import time
from pathlib import Path

import cv2
import joblib
import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Resolve paths relative to project root (signlanguageproject/)
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

from src.feature_extraction import HandLandmarkExtractor
from api.signaling import router as signaling_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="SanketSetu API", version="2.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount signaling routes (WebSocket endpoints)
app.include_router(signaling_router)

# ── Model loading ─────────────────────────────────────────────────────────────
MODEL_PATH = BASE_DIR / "models" / "sign_language_model.pkl"
ENCODER_PATH = BASE_DIR / "data" / "processed" / "label_encoder.pkl"

model        = None
labelencoder = None
extractor    = None

@app.on_event("startup")
async def load_models() -> None:
    global model, labelencoder, extractor
    try:
        model        = joblib.load(MODEL_PATH)
        labelencoder = joblib.load(ENCODER_PATH)
        extractor    = HandLandmarkExtractor(static_image_mode=True)
        logger.info(f"SanketSetu API ready. Classes: {list(labelencoder.classes_)}")
    except FileNotFoundError as e:
        logger.error(f"Model file missing: {e}. Run python -m src.train first.")


# ── Schemas ───────────────────────────────────────────────────────────────────
class PredictRequest(BaseModel):
    image: str  # base64-encoded JPEG frame

class PredictResponse(BaseModel):
    sign:        str
    confidence:  float
    all_scores:  dict
    hand_detected: bool
    inference_ms:  float


# ── Predict endpoint ──────────────────────────────────────────────────────────
@app.post("/predict", response_model=PredictResponse)
async def predict(req: PredictRequest) -> PredictResponse:
    if model is None or labelencoder is None or extractor is None:
        raise HTTPException(status_code=503, detail="Models not loaded yet.")

    try:
        img_bytes = base64.b64decode(req.image, validate=True)
        nparr     = np.frombuffer(img_bytes, np.uint8)
        frame     = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    except (binascii.Error, ValueError) as e:
        raise HTTPException(status_code=400, detail=f"Invalid image data: {e}")
    except Exception:
        logger.exception("Unexpected image decode failure")
        raise HTTPException(status_code=400, detail="Invalid image data.")

    if frame is None:
        raise HTTPException(status_code=400, detail="Could not decode image frame.")

    t0 = time.perf_counter()
    try:
        features = extractor.extract_from_frame(frame)
        inference_ms = (time.perf_counter() - t0) * 1000
    except Exception:
        logger.exception("Hand landmark extraction failed")
        inference_ms = (time.perf_counter() - t0) * 1000
        return PredictResponse(
            sign="",
            confidence=0.0,
            all_scores={},
            hand_detected=False,
            inference_ms=round(inference_ms, 1),
        )

    if features is None:
        return PredictResponse(
            sign="",
            confidence=0.0,
            all_scores={},
            hand_detected=False,
            inference_ms=round(inference_ms, 1),
        )

    try:
        features = features.reshape(1, -1)
        expected_features = getattr(model, "n_features_in_", None)
        if expected_features is not None and features.shape[1] != expected_features:
            logger.error(
                "Feature size mismatch: got %s, model expects %s",
                features.shape[1],
                expected_features,
            )
            raise HTTPException(status_code=500, detail="Model feature size mismatch.")

        proba = model.predict_proba(features)[0]
        idx   = int(np.argmax(proba))
        sign  = str(labelencoder.classes_[idx])
        conf  = float(proba[idx])
    except HTTPException:
        raise
    except Exception:
        logger.exception("Model prediction failed")
        raise HTTPException(status_code=500, detail="Model prediction failed.")

    all_scores = {
        str(labelencoder.classes_[i]): round(float(p), 4)
        for i, p in enumerate(proba)
    }

    return PredictResponse(
        sign=sign,
        confidence=conf,
        all_scores=all_scores,
        hand_detected=True,
        inference_ms=round(inference_ms, 1),
    )


# ── Health check ──────────────────────────────────────────────────────────────
@app.get("/health")
async def health() -> dict:
    return {
        "status":      "ok",
        "model_loaded": model is not None,
        "classes":     list(labelencoder.classes_) if labelencoder else [],
    }
