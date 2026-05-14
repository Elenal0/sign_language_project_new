import numpy as np


def pad_or_truncate(sequence: np.ndarray, max_length: int) -> np.ndarray:
    current_length = sequence.shape[0]

    if current_length == max_length:
        return sequence

    if current_length > max_length:
        return sequence[:max_length]

    padding = np.zeros((max_length - current_length, sequence.shape[1]))
    return np.vstack((sequence, padding))