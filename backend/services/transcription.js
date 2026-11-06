const { groqRequest } = require("./groq-client");
const formats = {
  "audio/webm": "webm",
  "video/webm": "webm",
  "audio/ogg": "ogg",
  "audio/mp4": "m4a",
  "video/mp4": "mp4",
  "audio/wav": "wav",
  "audio/mpeg": "mp3",
};
const languages = new Set(["auto", "en", "hi", "es", "fr", "de", "pt", "ja"]);
async function transcribeAudio(buffer, contentType, language = "auto") {
  const mime = contentType?.split(";")[0].trim().toLowerCase();
  if (
    !Buffer.isBuffer(buffer) ||
    buffer.length === 0 ||
    !formats[mime] ||
    !languages.has(language)
  ) {
    const error = new Error(
      "Record a supported audio file and select a valid language.",
    );
    error.status = 400;
    throw error;
  }
  const form = new FormData();
  form.set(
    "file",
    new Blob([buffer], { type: mime }),
    `recording.${formats[mime]}`,
  );
  form.set("model", process.env.GROQ_TRANSCRIPTION_MODEL || "whisper-large-v3");
  form.set("response_format", "json");
  form.set("temperature", "0");
  if (language !== "auto") form.set("language", language);
  const result = await groqRequest("audio/transcriptions", { body: form });
  if (typeof result?.text !== "string" || !result.text.trim())
    throw new Error("No speech was found. Please record again.");
  if (result.text.length > 12000)
    throw new Error(
      "The recording is too long. Please record a shorter description.",
    );
  return { text: result.text.trim() };
}
module.exports = { transcribeAudio };
