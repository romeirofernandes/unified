const { randomBytes, createCipheriv, createDecipheriv } = require("node:crypto");
const { mkdirSync, readFileSync, writeFileSync } = require("node:fs");
const path = require("node:path");
let cached;
function encryptionKey() {
  if (cached) return cached;
  if (process.env.INTEGRATION_ENCRYPTION_KEY) {
    if (!/^[a-f0-9]{64}$/i.test(process.env.INTEGRATION_ENCRYPTION_KEY)) throw new Error("INTEGRATION_ENCRYPTION_KEY must be 32 bytes in hex.");
    return cached = Buffer.from(process.env.INTEGRATION_ENCRYPTION_KEY, "hex");
  }
  // Persistent local fallback. Production replicas must share the environment key.
  const directory = path.join(__dirname, "../.data");
  mkdirSync(directory, { recursive: true, mode: 0o700 });
  const file = path.join(directory, "integration-key");
  try { writeFileSync(file, randomBytes(32), { mode: 0o600, flag: "wx" }); }
  catch (error) { if (error.code !== "EEXIST") throw error; }
  cached = readFileSync(file);
  if (cached.length !== 32) throw new Error("Invalid integration encryption key.");
  return cached;
}
function encrypt(value) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
    const ciphertext = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
    return [iv, cipher.getAuthTag(), ciphertext].map((part) => part.toString("base64")).join(".");
}
function decrypt(value) {
  const [iv, tag, ciphertext] = value.split(".").map((part) => Buffer.from(part, "base64"));
  const cipher = createDecipheriv("aes-256-gcm", encryptionKey(), iv);
  cipher.setAuthTag(tag);
  return Buffer.concat([cipher.update(ciphertext), cipher.final()]).toString("utf8");
}
module.exports = { encrypt, decrypt };
