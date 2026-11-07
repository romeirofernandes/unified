const test = require("node:test");
const assert = require("node:assert/strict");
const { createHmac, createHash } = require("node:crypto");
const { createPaymentHandlers } = require("../controller/paymentController");
const token = "a".repeat(64), secret = "test-secret";
const body = { razorpay_order_id: "order_123", razorpay_payment_id: "pay_123", checkoutToken: token,
  razorpay_signature: createHmac("sha256", secret).update("order_123|pay_123").digest("hex") };
const response = () => ({ code: 200, status(code) { this.code = code; return this; }, json(data) { this.data = data; } });
function fixture(payment = {}) {
  let writes = 0;
  const order = { _id: "order_123", amount: 5000, currency: "INR", status: "created" };
  const handlers = createPaymentHandlers({ secret,
    client: { orders: { create: async (input) => { assert.equal(input.amount, 5000); return { id: order._id, amount: 5000, currency: "INR" }; } },
      payments: { fetch: async () => ({ order_id: order._id, amount: 5000, currency: "INR", status: "captured", ...payment }) } },
    Order: { create: async () => {}, findOne: async filter => filter.tokenHash === createHash("sha256").update(token).digest("hex") ? order : null,
      findOneAndUpdate: async (_, update) => { writes++; Object.assign(order, update.$set); return order; } },
  });
  return { ...handlers, writes: () => writes };
}
test("only the server's INR 50 price can create an order", async () => {
  for (const amount of [-1, 0, 0.1, "50", 500, null]) {
    const res = response(); await fixture().createOrder({ body: { amount } }, res); assert.equal(res.code, 400);
  }
  const res = response(); await fixture().createOrder({ body: { amount: 50 } }, res); assert.equal(res.code, 200); assert.match(res.data.checkoutToken, /^[a-f0-9]{64}$/);
});
test("signatures, checkout binding, captured amount and currency are all enforced", async () => {
  for (const input of [{ ...body, checkoutToken: "b".repeat(64) }, { ...body, razorpay_signature: "b".repeat(64) }]) {
    const res = response(); const api = fixture(); await api.verifyPayment({ body: input }, res); assert.ok(res.code >= 400); assert.equal(api.writes(), 0);
  }
  for (const payment of [{ amount: 1 }, { currency: "USD" }, { order_id: "order_other" }, { status: "authorized" }]) {
    const res = response(); const api = fixture(payment); await api.verifyPayment({ body }, res); assert.ok(res.code >= 400); assert.equal(api.writes(), 0);
  }
});
test("replaying a valid payment is idempotent", async () => {
  const api = fixture();
  for (let i = 0; i < 2; i++) { const res = response(); await api.verifyPayment({ body }, res); assert.equal(res.code, 200); }
  assert.equal(api.writes(), 1);
});
