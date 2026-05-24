from pathlib import Path

# ── Paths ──────────────────────────────────────────────────────────────────────
BASE_DIR           = Path(__file__).resolve().parent.parent
DATA_DIR           = BASE_DIR / "data"
RAW_DATA_DIR       = DATA_DIR / "raw"
PROCESSED_DATA_DIR = DATA_DIR / "processed"
MODELS_DIR         = BASE_DIR / "models"

# ── Dataset ────────────────────────────────────────────────────────────────────
CLASSES = [
    "Hello", "Nice", "Meet", "Him", "You", "Thank you", "How", "I", "Going", "School",
]

MAX_SEQUENCE_LENGTH = 40   # frames per video used during training

# ── MediaPipe ──────────────────────────────────────────────────────────────────
NUM_LANDMARKS  = 21
NUM_DIMENSIONS = 3
USE_BOTH_HANDS = True      # 2 × 21 × 3 = 126 raw landmarks per frame

# ── Training ───────────────────────────────────────────────────────────────────
TEST_SIZE    = 0.2
RANDOM_STATE = 42
