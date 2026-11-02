"""
SanketSetu / Drishya Vaani — FastAPI Backend Server

Run (local and Render — single worker, rooms live in memory):
    uvicorn api.server:app --host 0.0.0.0 --port $PORT --ws websockets \
        --proxy-headers --forwarded-allow-ips="*" --workers 1
"""

import sys
import os
import base64
import binascii
import time
import logging
import threading
from contextlib import asynccontextmanager
from pathlib import Path

import cv2
import numpy as np
import joblib
from fastapi import FastAPI, HTTPException, Security, Depends, Response
from fastapi.security import APIKeyHeader
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# Resolve paths directly — no dependency on config variable names
PROJECT_ROOT = Path(__file__).resolve().parent.parent
MODELS_DIR = PROJECT_ROOT / "models"
PROCESSED_DATA_DIR = PROJECT_ROOT / "data" / "processed"

sys.path.insert(0, str(PROJECT_ROOT))
from src.feature_extraction import HandLandmarkExtractor  # noqa: E402

# ── Logging ───────────────────────────────────────────────────────────────────
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("sanketsetu")


def _websocket_library() -> str | None:
    """Uvicorn silently 404s every WebSocket upgrade if neither library is installed."""
    for name in ("websockets", "wsproto"):
        try:
            __import__(name)
            return name
        except ImportError:
            continue
    return None


# ── App ───────────────────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    ws_lib = _websocket_library()
    if ws_lib is None:
        logger.error(
            "❌ No WebSocket library installed — /ws/signal and /ws/chat will return 404. "
            "Install 'uvicorn[standard]' or 'websockets'."
        )
    else:
        logger.info("✅ WebSocket support via '%s'", ws_lib)
    load_models()
    yield


app = FastAPI(
    title="SanketSetu API",
    description="Indian Sign Language Translation — ML Backend + WebRTC signaling",
    version="2.2.0",
    lifespan=lifespan,
)

ALLOWED_ORIGINS = [
    o.strip()
    for o in os.getenv(
        "ALLOWED_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173,"
        "http://localhost:5174,http://127.0.0.1:5174,"
        "http://localhost:5175,http://127.0.0.1:5175,"
        "https://drishya-vaani.vercel.app",
    ).split(",")
    if o.strip()
]
# Vercel preview deployments (drishya-vaani-git-<branch>-<team>.vercel.app) and ngrok tunnels
ALLOWED_ORIGIN_REGEX = os.getenv(
    "ALLOWED_ORIGIN_REGEX",
    r"https://drishya-vaani[a-z0-9-]*\.vercel\.app|https://[a-z0-9-]+\.ngrok(-free)?\.(app|dev|io)",
)

API_KEY_SECRET = os.getenv("API_KEY_SECRET", "dev-secret-key")
api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)


async def verify_api_key(api_key: str = Security(api_key_header)):
    if os.getenv("ENV") == "production" and api_key != API_KEY_SECRET:
        raise HTTPException(status_code=401, detail="Unauthorized API access.")
    return api_key


app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_origin_regex=ALLOWED_ORIGIN_REGEX,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── WebSocket signaling routes (/ws/signal, /ws/chat, /turn-credentials) ──────
from api.signaling import router as signaling_router, signal_rooms  # noqa: E402

app.include_router(signaling_router)

# ── Model loading (singleton at startup) ──────────────────────────────────────
model = None
label_encoder = None
extractor = None
# MediaPipe's HandLandmarker is not thread-safe; /predict runs in a threadpool
_extractor_lock = threading.Lock()


def load_models():
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
# Plain `def` (not `async def`): FastAPI runs it in a worker thread. MediaPipe +
# SVM inference is CPU-bound; inside `async def` it blocked the event loop and
# stalled every WebSocket (SDP / ICE relay, chat) while frames were processed.
@app.post("/predict", response_model=PredictResponse, dependencies=[Depends(verify_api_key)])
def predict(req: PredictRequest):
    if model is None or label_encoder is None or extractor is None:
        raise HTTPException(status_code=503, detail="Models not loaded yet.")

    payload = req.image
    if payload.startswith("data:") and "," in payload:   # tolerate full data-URLs
        payload = payload.split(",", 1)[1]

    try:
        img_bytes = base64.b64decode(payload, validate=False)
        np_arr = np.frombuffer(img_bytes, np.uint8)
        frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
    except (binascii.Error, ValueError) as e:
        logger.warning(f"Image decode failure: {e}")
        raise HTTPException(status_code=400, detail="Invalid image payload format.")

    if frame is None:
        raise HTTPException(status_code=400, detail="Could not decode image.")

    t0 = time.perf_counter()
    with _extractor_lock:
        features = extractor.extract_from_frames([frame])
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
@app.api_route("/", methods=["GET", "HEAD"])
async def root():
    # Render's port scanner / health check probes `HEAD /` — answer it with 200
    return {"app": "SanketSetu", "status": "ok", "docs": "/docs", "health": "/health"}


@app.get("/health")
async def health(response: Response):
    response.headers["Cache-Control"] = "no-store"
    return {
        "status": "ok",
        "app": "SanketSetu",
        "model_loaded": model is not None,
        "classes": list(label_encoder.classes_) if label_encoder is not None else [],
        "websocket_support": _websocket_library() is not None,
        "signaling": True,
        "active_rooms": len(signal_rooms),
    }


@app.get("/classes")
async def get_classes():
    if label_encoder is None:
        raise HTTPException(status_code=503, detail="Models not loaded.")
    return {"classes": list(label_encoder.classes_)}
