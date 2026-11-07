const { createHash } = require("node:crypto");
const DigestDelivery = require("../models/DigestDelivery");
const uncertain = () => Object.assign(new Error("Delivery outcome is unknown. Automatic resend is paused to avoid duplicates. Check the destination before changing this schedule."), { deliveryUncertain: true });

async function deliverOnce(input, send, Delivery = DigestDelivery) {
  const _id = createHash("sha256").update(input.batchId).digest("hex");
  try { await Delivery.create({ _id, status: "sending" }); }
  catch (error) {
    if (error.code !== 11000) throw error;
    const saved = await Delivery.findById(_id);
    if (saved?.status === "sent") return;
    if (saved?.status !== "rejected" || !await Delivery.findOneAndUpdate({ _id, status: "rejected" }, { $set: { status: "sending" } })) throw uncertain();
  }
  try {
    await send(input);
  } catch (error) {
    if (error.deliveryRejected) {
      await Delivery.updateOne({ _id, status: "sending" }, { $set: { status: "rejected" } });
      throw error;
    }
    await Delivery.updateOne({ _id, status: "sending" }, { $set: { status: "unknown" } });
    throw uncertain();
  }
  // A failed commit leaves "sending", so a retry never blindly sends a second copy.
  await Delivery.updateOne({ _id, status: "sending" }, { $set: { status: "sent" } });
}
module.exports = { deliverOnce };
