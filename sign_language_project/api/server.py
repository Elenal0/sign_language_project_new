"""
SanketSetu — FastAPI Backend Server
"""

import sys
import os
import base64
import time
import logging
from pathlib import Path

import cv2
import numpy as np
import joblib
from fastapi import FastAPI, HTTPException, Security, Depends
from fastapi.security import APIKeyHeader
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# Resolve paths directly — no dependency on config variable names
PROJECT_ROOT = Path(__file__).resolve().parent.parent
MODELS_DIR = PROJECT_ROOT / "models"
PROCESSED_DATA_DIR = PROJECT_ROOT / "data" / "processed"

sys.path.insert(0, str(PROJECT_ROOT))
from src.feature_extraction import HandLandmarkExtractor

# ── Logging ───────────────────────────────────────────────────────────────────
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("sanketsetu")

# ── App ───────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="SanketSetu API",
    description="Indian Sign Language Translation — ML Backend",
    version="2.0.0",
)

ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:5173,http://127.0.0.1:5173,"
    "http://localhost:5174,http://127.0.0.1:5174,"
    "http://localhost:5175,http://127.0.0.1:5175,"
    "https://sign-language-backend-4uar.onrender.com"
).split(",")
API_KEY_SECRET = os.getenv("API_KEY_SECRET", "dev-secret-key")
api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)

async def verify_api_key(api_key: str = Security(api_key_header)):
    if os.getenv("ENV") == "production" and api_key != API_KEY_SECRET:
        raise HTTPException(status_code=401, detail="Unauthorized API access.")
    return api_key

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "X-API-Key"],
)

# ── Model loading (singleton at startup) ──────────────────────────────────────
model = None
label_encoder = None
extractor = None

@app.on_event("startup")
async def load_models():
    global model, label_encoder, extractor

    model_path = MODELS_DIR / "sign_language_model.pkl"
    encoder_path = PROCESSED_DATA_DIR / "label_encoder.pkl"

    if not model_path.exists():
        raise RuntimeError(f"Model not found at {model_path}")
    if not encoder_path.exists():
        raise RuntimeError(f"Label encoder not found at {encoder_path}")

    model = joblib.load(model_path)
    label_encoder = joblib.load(encoder_path)
    extractor = HandLandmarkExtractor(static_image_mode=True)

    logger.info(f"✅ SanketSetu API ready. Classes: {list(label_encoder.classes_)}")


# ── Schemas ───────────────────────────────────────────────────────────────────
class PredictRequest(BaseModel):
    image: str = Field(..., max_length=1_000_000, description="Base64 encoded frame (<1MB)")

class PredictResponse(BaseModel):
    sign: str
    confidence: float
    all_scores: dict
    hand_detected: bool
    inference_ms: float


# ── Prediction endpoint ───────────────────────────────────────────────────────
@app.post("/predict", response_model=PredictResponse, dependencies=[Depends(verify_api_key)])
async def predict(req: PredictRequest):
    if model is None or label_encoder is None or extractor is None:
        raise HTTPException(status_code=503, detail="Models not loaded yet.")

    try:
        img_bytes = base64.b64decode(req.image)
        np_arr = np.frombuffer(img_bytes, np.uint8)
        frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
    except Exception as e:
        logger.error(f"Image decode failure: {e}", exc_info=True)
        raise HTTPException(status_code=400, detail="Invalid image payload format.")

    if frame is None:
        raise HTTPException(status_code=400, detail="Could not decode image.")

    t0 = time.perf_counter()
    features = extractor.extract_from_frames([frame])  # pass as list
    inference_ms = (time.perf_counter() - t0) * 1000

    if features is None:
        return PredictResponse(
            sign="No hand detected",
            confidence=0.0,
            all_scores={},
            hand_detected=False,
            inference_ms=round(inference_ms, 1),
        )

    features = features.reshape(1, -1)
    probs = model.predict_proba(features)[0]
    predicted_idx = int(np.argmax(probs))
    predicted_label = str(label_encoder.classes_[predicted_idx])
    confidence = float(probs[predicted_idx])

    all_scores = {
        str(label_encoder.classes_[i]): round(float(p), 4)
        for i, p in enumerate(probs)
    }

    return PredictResponse(
        sign=predicted_label,
        confidence=round(confidence, 4),
        all_scores=all_scores,
        hand_detected=True,
        inference_ms=round(inference_ms, 1),
    )


# ── Health endpoints ──────────────────────────────────────────────────────────
@app.get("/health")
async def health():
    return {
        "status": "ok",
        "app": "SanketSetu",
        "model_loaded": model is not None,
        "classes": list(label_encoder.classes_) if label_encoder else [],
    }

@app.get("/classes")
async def get_classes():
    if label_encoder is None:
        raise HTTPException(status_code=503, detail="Models not loaded.")
    return {"classes": list(label_encoder.classes_)}