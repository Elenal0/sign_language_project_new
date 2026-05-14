from pathlib import Path

BASEDIR           = Path(__file__).resolve().parent.parent
DATADIR           = BASEDIR / "data"
RAWDATADIR        = DATADIR / "raw"
PROCESSEDDATADIR  = DATADIR / "processed"
MODELSDIR         = BASEDIR / "models"

CLASSES: list[str] = [
    "Going", "Hello", "How", "I", "Meet",
    "Nice", "School", "Thank you", "You",
]

IMAGE_EXTENSIONS: tuple[str, ...] = (
    ".jpg", ".jpeg", ".JPG", ".JPEG",
    ".png", ".PNG", ".bmp", ".BMP",
)

MAX_SEQUENCE_LENGTH: int  = 40
NUM_LANDMARKS:       int  = 21
NUM_DIMENSIONS:      int  = 3
USE_BOTH_HANDS:      bool = True
FEATURE_DIM:         int  = 252

TEST_SIZE:    float = 0.20
RANDOM_STATE: int   = 42