"""One weighted sum per species; no pretrained weights."""
import json
import random
from number import Number


class Classifier:
    def __init__(self, classes, n_features, seed=0):
        self.classes = classes
        rng = random.Random(seed)
        self.weights = [[Number(rng.gauss(0, 0.01))
                         for _ in range(n_features + 1)] for _ in classes]

    def forward(self, features):
        return [row[0] + sum(w * float(x) for w, x in zip(row[1:], features))
                for row in self.weights]

    def parameters(self):
        return [w for row in self.weights for w in row]

    def scores(self, features):
        return [row[0].data + sum(w.data * float(x)
                for w, x in zip(row[1:], features)) for row in self.weights]

    def save(self, path):
        with open(path, 'w', encoding='utf-8') as file:
            json.dump({'features': 'rgb_texture_v1', 'classes': self.classes,
                       'weights': [[w.data for w in row] for row in self.weights]}, file)

    @classmethod
    def load(cls, path):
        with open(path, encoding='utf-8') as file:
            saved = json.load(file)
        if saved['features'] != 'rgb_texture_v1':
            raise ValueError('Unsupported image features.')
        model = cls(saved['classes'], len(saved['weights'][0]) - 1)
        model.weights = [[Number(w) for w in row] for row in saved['weights']]
        return model
