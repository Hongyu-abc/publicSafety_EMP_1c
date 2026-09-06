"""32 simple color/texture features, computed without a neural network."""
import numpy as np
from PIL import Image, ImageOps


def extract_features(path):
    with Image.open(path) as image:
        image = ImageOps.exif_transpose(image).convert('RGB').resize((64, 64))
        pixels = np.asarray(image, dtype=float) / 255
    features = []
    for channel in range(3):
        values = pixels[:, :, channel]
        histogram, _ = np.histogram(values, bins=8, range=(0, 1))
        features.extend(histogram / values.size)
        features.extend([values.mean(), values.std()])
    gray = pixels.mean(axis=2)
    features.extend([np.abs(np.diff(gray, axis=0)).mean(),
                     np.abs(np.diff(gray, axis=1)).mean()])
    return np.array(features)
