"""Firebase HTTP function: multipart field ``image`` -> ranked candidates."""
import io
import os
import numpy as np
from PIL import Image, ImageOps
from model import Classifier

MODEL_PATH = os.path.join(os.path.dirname(__file__), 'model.json')
MODEL = Classifier.load(MODEL_PATH)


def _features(upload):
    with Image.open(io.BytesIO(upload)) as source:
        image = ImageOps.exif_transpose(source).convert('RGB')
        image.load()
    pixels = np.asarray(image.resize((64, 64)), dtype=float) / 255
    values = []
    for channel in range(3):
        plane = pixels[:, :, channel]
        histogram, _ = np.histogram(plane, bins=8, range=(0, 1))
        values.extend(histogram / plane.size)
        values.extend((plane.mean(), plane.std()))
    gray = pixels.mean(axis=2)
    values.extend((np.abs(np.diff(gray, axis=0)).mean(),
                   np.abs(np.diff(gray, axis=1)).mean()))
    return np.array(values)


def identify(request):
    if request.method != 'POST' or 'image' not in request.files:
        return {'error': 'Send a POST multipart/form-data request with an image field.'}, 400
    try:
        scores = MODEL.scores(_features(request.files['image'].read()))
        order = sorted(range(len(scores)), key=scores.__getitem__, reverse=True)[:3]
        return {'candidates': [{'class_id': MODEL.classes[i], 'score': scores[i]} for i in order],
                'safety': 'UNKNOWN',
                'warning': 'Image identification is not evidence that a mushroom is safe to eat.'}
    except Exception as error:
        return {'error': f'Invalid image: {error}'}, 400
