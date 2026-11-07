const { verifyIdToken, assertActiveIdentity } = require("../services/firebase-identity");
const User = require("../models/User");
function createIdentity({ verify = verifyIdToken, active = assertActiveIdentity, users = User, forDeletion = false } = {}) {
  return async (req, res, next) => {
    const token = req.headers.authorization?.match(/^Bearer (\S+)$/)?.[1];
    if (!token) return res.status(401).json({ message: "Sign in to continue." });
    try {
      req.auth = await verify(token);
      // A signed token may finish an already-started deletion after Firebase is gone.
      const resuming = forDeletion && await users.exists({ firebaseUid: req.auth.uid, deleting: true });
      if (!resuming) {
        const account = await active(req.auth, token);
        req.auth.email = account.email;
        req.auth.name = account.displayName;
        req.auth.picture = account.photoUrl;
      }
      req.idToken = token;
      next();
    } catch (error) {
      res.status(error.status === 503 ? 503 : 401).json({ message: error.status === 503 ? error.message : "Your session expired. Sign in again." });
    }
  };
}
module.exports = createIdentity();
module.exports.forDeletion = createIdentity({ forDeletion: true });
module.exports.createIdentity = createIdentity;
