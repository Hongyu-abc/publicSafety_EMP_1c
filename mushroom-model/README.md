# Firebase deployment

Copy the contents of this folder (`model.json`, `firebase_function.py`,
`model.py`, `number.py`, `operations.py`, `features.py`, and
`firebase_requirements.txt`) into a Python Firebase Functions source directory.
Rename `firebase_requirements.txt` to `requirements.txt` there.

The HTTP entry point is `identify`. Send a `POST` request as
`multipart/form-data` with the field name `image`:

```bash
curl -X POST -F "image=@mushroom.jpg" https://REGION-PROJECT.cloudfunctions.net/identify
```

The response contains up to three ranked visual candidates. Scores are model
scores, not probabilities. The function always returns `safety: UNKNOWN` and
must not be used to decide whether a mushroom is safe to eat. A separate
curated safety data layer must provide any health information.

Deploy with the Firebase CLI from the Functions source directory:

```bash
firebase deploy --only functions:identify
```

No dataset or training code is required at runtime. This function uses the
same EXIF orientation, RGB conversion, 64x64 resize, and 32-feature extraction
as the local `predict.py` path.
