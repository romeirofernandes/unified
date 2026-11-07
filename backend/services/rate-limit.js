const { createHash } = require("node:crypto");
const RateBucket = require("../models/RateBucket");
async function consumeLimit(key, maximum, now = Date.now()) {
  const window = Math.floor(now / 60000);
  const _id = createHash("sha256").update(`${key}:${window}`).digest("hex");
  let bucket;
  try {
    bucket = await RateBucket.findOneAndUpdate({ _id }, { $inc: { count: 1 }, $setOnInsert: { expiresAt: new Date((window + 2) * 60000) } }, { upsert: true, new: true });
  } catch (error) {
    if (error.code !== 11000) throw error;
    bucket = await RateBucket.findOneAndUpdate({ _id }, { $inc: { count: 1 } }, { new: true });
  }
  if (bucket.count > maximum) throw Object.assign(new Error("Too many requests. Please try again in a minute."), { status: 429 });
}
module.exports = { consumeLimit };
