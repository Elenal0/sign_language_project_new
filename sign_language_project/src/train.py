from __future__ import annotations
import numpy as np
import joblib
from sklearn.model_selection import train_test_split, StratifiedKFold, cross_val_score
from sklearn.neural_network import MLPClassifier
from sklearn.svm import SVC
from sklearn.decomposition import PCA
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.metrics import accuracy_score, classification_report
from src.config import PROCESSEDDATADIR, MODELSDIR, TEST_SIZE, RANDOM_STATE


def load_dataset():
    X = np.load(PROCESSEDDATADIR / "X.npy", allow_pickle=False)
    y = np.load(PROCESSEDDATADIR / "y.npy", allow_pickle=True)
    return X, y


def build_mlp_pipeline(n_components: int) -> Pipeline:
    return Pipeline([
        ("pca",    PCA(n_components=n_components, random_state=RANDOM_STATE)),
        ("scaler", StandardScaler()),
        ("mlp",    MLPClassifier(
            hidden_layer_sizes=(512, 256, 128, 64),
            activation="relu", solver="adam", alpha=1e-3,
            learning_rate="adaptive", learning_rate_init=1e-3,
            max_iter=600, early_stopping=True,
            validation_fraction=0.10, n_iter_no_change=25,
            random_state=RANDOM_STATE, verbose=False,
        )),
    ])


def build_svm_pipeline(n_components: int) -> Pipeline:
    return Pipeline([
        ("pca",    PCA(n_components=n_components, random_state=RANDOM_STATE)),
        ("scaler", StandardScaler()),
        ("svm",    SVC(kernel="rbf", C=10, gamma="scale",
                       probability=True, random_state=RANDOM_STATE)),
    ])


def train_model() -> None:
    print("=" * 64)
    print("  Sign Language Classifier — Training")
    print("=" * 64)

    X, y = load_dataset()
    n_samples, n_features = X.shape
    print(f"  Samples: {n_samples}  |  Features: {n_features}")
    print(f"  Classes: {sorted(set(y.tolist()))}")

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=TEST_SIZE, random_state=RANDOM_STATE, stratify=y
    )

    n_components = min(120, len(X_train) - 1, n_features)
    print(f"  PCA components: {n_components}")

    # Train both
    mlp_pipe = build_mlp_pipeline(n_components)
    mlp_pipe.fit(X_train, y_train)
    mlp_acc = accuracy_score(y_test, mlp_pipe.predict(X_test))

    svm_pipe = build_svm_pipeline(n_components)
    svm_pipe.fit(X_train, y_train)
    svm_acc = accuracy_score(y_test, svm_pipe.predict(X_test))

    print(f"\n  MLP accuracy: {mlp_acc:.4f}  ({mlp_acc*100:.1f}%)")
    print(f"  SVM accuracy: {svm_acc:.4f}  ({svm_acc*100:.1f}%)")

    best_name = "MLP" if mlp_acc >= svm_acc else "SVM"
    best_pipe = mlp_pipe if mlp_acc >= svm_acc else svm_pipe
    print(f"\n  Best model: {best_name}")
    print(classification_report(y_test, best_pipe.predict(X_test), zero_division=0))

    # Retrain on full dataset
    final_pipe = build_mlp_pipeline(n_components) if best_name == "MLP" else build_svm_pipeline(n_components)
    final_pipe.fit(X, y)

    MODELSDIR.mkdir(parents=True, exist_ok=True)
    model_path = MODELSDIR / "sign_language_model.pkl"
    joblib.dump(final_pipe, model_path)
    print(f"\n  Model saved → {model_path.resolve()}")


if __name__ == "__main__":
    train_model()