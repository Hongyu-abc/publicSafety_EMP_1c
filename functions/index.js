const {onCall, HttpsError} = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

/**
 * Decodes and size-checks an image sent as a Base64 data URL.
 * @param {string} base64Image Image data supplied by the callable client.
 * @return {Buffer} The decoded image bytes.
 */
function decodeImage(base64Image) {
  if (typeof base64Image !== "string" || base64Image.length === 0) {
    throw new HttpsError("invalid-argument", "No image provided.");
  }

  const payload = base64Image.includes(",") ?
    base64Image.slice(base64Image.indexOf(",") + 1) : base64Image;

  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(payload) || payload.length % 4 !== 0) {
    throw new HttpsError("invalid-argument", "The image data is invalid.");
  }

  const imageBytes = Buffer.from(payload, "base64");
  if (imageBytes.length === 0 || imageBytes.length > MAX_IMAGE_BYTES) {
    throw new HttpsError(
        "invalid-argument", "The image must be between 1 byte and 5 MB.");
  }

  return imageBytes;
}

exports.identifyMushroom = onCall({maxInstances: 5}, (request) => {
  const data = request.data || {};
  const imageBytes = decodeImage(data.image);

  logger.info("Received mushroom image for identification", {
    imageBytes: imageBytes.length,
  });

  // Add a trained classifier model here. Until then, never guess whether a
  // mushroom is safe to eat from an uploaded photograph.
  return {
    commonNameEn: "Identification unavailable",
    commonNameZh: "暂无法识别",
    scientificName: "",
    toxicity: "unknown",
    toxicityLabel: "Toxicity unknown",
    note: "No trained mushroom classifier is connected yet. Do not eat a " +
      "wild mushroom based on a photo.",
  };
});
