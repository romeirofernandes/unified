const test = require("node:test");
const assert = require("node:assert/strict");
const { transcribeAudio } = require("../services/transcription");
test("Safari, Firefox and Chromium recordings use the same transcription endpoint", async () => {
  const original = global.fetch;
  const previous = process.env.GROQ_API_KEYS;
  process.env.GROQ_API_KEYS = "test-key";
  try {
    for (const [mime, extension] of [
      ["audio/mp4", "m4a"],
      ["audio/ogg;codecs=opus", "ogg"],
      ["audio/webm;codecs=opus", "webm"],
    ]) {
      global.fetch = async (url, options) => {
        assert.ok(url.endsWith("audio/transcriptions"));
        assert.equal(options.body.get("file").name, `recording.${extension}`);
        assert.equal(options.body.get("language"), "hi");
        assert.equal(options.body.get("model"), "whisper-large-v3");
        assert.equal(options.headers["Content-Type"], undefined);
        return {
          ok: true,
          json: async () => ({ text: " A form description. " }),
        };
      };
      assert.equal(
        (await transcribeAudio(Buffer.from("audio"), mime, "hi")).text,
        "A form description.",
      );
    }
  } finally {
    global.fetch = original;
    if (previous === undefined) delete process.env.GROQ_API_KEYS;
    else process.env.GROQ_API_KEYS = previous;
  }
});
test("empty recordings and unknown audio types are rejected before sending data", async () => {
  await assert.rejects(transcribeAudio(Buffer.alloc(0), "audio/webm"));
  await assert.rejects(transcribeAudio(Buffer.from("x"), "text/html"));
  await assert.rejects(
    transcribeAudio(Buffer.from("x"), "audio/webm", "invalid"),
  );
});
