const { randomBytes, createHash, createHmac, timingSafeEqual } = require("node:crypto");
const CheckoutOrder = require("../models/CheckoutOrder");
const hash = (value) => createHash("sha256").update(value).digest("hex");
const fail = (status, message) => Object.assign(new Error(message), { status });
function createPaymentHandlers({ client, Order = CheckoutOrder, secret = process.env.RAZORPAY_KEY_SECRET } = {}) {
  const provider = () => {
    if (client) return client;
    if (!process.env.RAZORPAY_KEY_ID || !secret) throw fail(503, "Payments are not configured.");
    return new (require("razorpay"))({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: secret });
  };
  return {
    async createOrder(req, res) {
      try {
        // The coffee price is defined by the server, never by browser input.
        if (req.body?.amount !== undefined && req.body.amount !== 50) throw fail(400, "A coffee costs INR 50.");
        const order = await provider().orders.create({ amount: 5000, currency: "INR", receipt: `coffee_${randomBytes(12).toString("hex")}` });
        if (order.amount !== 5000 || order.currency !== "INR") throw fail(502, "The payment provider returned an invalid order.");
        const checkoutToken = randomBytes(32).toString("hex");
        await Order.create({ _id: order.id, tokenHash: hash(checkoutToken), amount: 5000, currency: "INR" });
        res.json({ orderId: order.id, amount: order.amount, currency: order.currency, checkoutToken });
      } catch (error) { res.status(error.status || 502).json({ message: error.status ? error.message : "Could not create payment order." }); }
    },
    async verifyPayment(req, res) {
      try {
        const { razorpay_order_id: id, razorpay_payment_id: paymentId, razorpay_signature: signature, checkoutToken } = req.body || {};
        if (!/^order_[a-zA-Z0-9]{1,80}$/.test(id || "") || !/^pay_[a-zA-Z0-9]{1,80}$/.test(paymentId || "") || !/^[a-f0-9]{64}$/.test(signature || "") || !/^[a-f0-9]{64}$/.test(checkoutToken || "")) throw fail(400, "Invalid payment verification details.");
        const order = await Order.findOne({ _id: id, tokenHash: hash(checkoutToken) });
        if (!order) throw fail(404, "Payment order not found.");
        if (!secret) throw fail(503, "Payments are not configured.");
        const expected = createHmac("sha256", secret).update(`${order._id}|${paymentId}`).digest();
        if (!timingSafeEqual(expected, Buffer.from(signature, "hex"))) throw fail(400, "Invalid payment signature.");
        if (order.status === "paid") {
          if (order.paymentId !== paymentId) throw fail(409, "This order already has a different payment.");
          return res.json({ status: "success", message: "Payment already verified." });
        }
        const payment = await provider().payments.fetch(paymentId);
        if (payment.order_id !== order._id || payment.amount !== order.amount || payment.currency !== order.currency) throw fail(400, "Payment does not match this order.");
        if (payment.status !== "captured") throw fail(409, "Payment is still processing. Please try verification again shortly.");
        const updated = await Order.findOneAndUpdate({ _id: id, status: "created" }, { $set: { status: "paid", paymentId } }, { new: true });
        if (!updated) {
          const saved = await Order.findById(id);
          if (saved?.paymentId !== paymentId) throw fail(409, "This order already has a different payment.");
        }
        res.json({ status: "success", message: "Payment verified." });
      } catch (error) { res.status(error.status || 502).json({ message: error.status ? error.message : "Could not verify payment." }); }
    },
  };
}
module.exports = { ...createPaymentHandlers(), createPaymentHandlers };
