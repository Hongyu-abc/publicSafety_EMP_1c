"""Print ranked candidates. Scores are not probabilities or food-safety advice."""
import argparse
from features import extract_features
from model import Classifier


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('image')
    parser.add_argument('--model', default='model.json')
    args = parser.parse_args()
    model = Classifier.load(args.model)
    scores = model.scores(extract_features(args.image))
    for index in sorted(range(len(scores)), key=scores.__getitem__, reverse=True)[:3]:
        print(f'{model.classes[index]}: score {scores[index]:.3f}')
    print('Possible matches only. Unknown species can also receive high scores.')
    print('Do not use these results to decide whether a mushroom is safe to eat.')


if __name__ == '__main__':
    main()
