const express = require("express");
const cors = require("cors");
require("dotenv").config();
const connectDB = require("./config/db");
const authRoutes = require("./routes/auth");
const projectRoutes = require("./routes/projects");
const feedbackRoutes = require("./routes/feedback");
const paymentRoutes = require("./routes/payments");
const authMiddleware = require("./middleware/auth");

const app = express();
const proxyHops = Number(process.env.TRUST_PROXY_HOPS || 0);
if (!Number.isInteger(proxyHops) || proxyHops < 0 || proxyHops > 3) throw new Error("TRUST_PROXY_HOPS must be 0 through 3.");
app.set("trust proxy", proxyHops);
const PORT = process.env.PORT || 8000;

connectDB().then(() => {
  require("./services/digest-worker").startDigestWorker();
  require("./services/feedback-subscriptions").startShippingWorker();
  require("./services/pr-workflow").startPullRequestWorker();
});

app.use(cors(require("./config/cors")));
app.post("/api/payment/webhook", express.raw({ type: "application/json", limit: "64kb" }), require("./controller/paymentController").paymentWebhook);
app.use(express.json());

// Routes

app.use("/api/widget", require("./routes/widget"));
app.use("/api/submissions", require("./routes/submissions"));
app.use("/api/auth", authRoutes);
app.use("/api/slack", require("./routes/slack"));
app.use("/api/github", require("./routes/github"));
app.use("/api/pull-requests", authMiddleware, require("./routes/pull-requests"));
app.use("/api/integrations", authMiddleware, require("./routes/integrations"));
app.use("/api/workbench", authMiddleware, require("./routes/workbench"));
app.use("/api/projects", authMiddleware, projectRoutes);
app.use("/api/feedback", authMiddleware, feedbackRoutes);
app.use("/api/payment", paymentRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
