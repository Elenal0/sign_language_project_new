"""
build_dataset.py – Entry point to build the feature dataset from raw images.

Run from the PROJECT ROOT:
    python -m src.build_dataset

What it does:
  1. Scans  data/raw/<ClassName>/<ClassNameN>/*.jpg  for every class in CLASSES.
  2. Runs MediaPipe Hands on each image to extract hand landmarks (252 features).
  3. Applies data augmentation (mirror + Gaussian noise) to triple the dataset.
  4. Saves  data/processed/X.npy,  y.npy,  label_encoder.pkl.

After this completes successfully, run:
    python -m src.train
"""

from src.dataset import DatasetBuilder


if __name__ == "__main__":
    builder = DatasetBuilder()
    builder.build(augment=True)
