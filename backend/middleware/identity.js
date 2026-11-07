const { verifyIdToken } = require("../services/firebase-identity");
async function identity(req, res, next) {
  const token = req.headers.authorization?.match(/^Bearer (\S+)$/)?.[1];
  if (!token) return res.status(401).json({ message: "Sign in to continue." });
  try {
    req.auth = await verifyIdToken(token);
    req.idToken = token;
    next();
  } catch (error) {
    res.status(error.status === 503 ? 503 : 401).json({ message: error.status === 503 ? error.message : "Your session expired. Sign in again." });
  }
}
module.exports = identity;
