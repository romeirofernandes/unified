const express = require('express');
const { createOrder, verifyPayment } = require('../controller/paymentController');

const router = express.Router();
router.use(async (req, res, next) => {
  res.set("Cache-Control", "no-store");
  try { await require("../services/rate-limit").consumeLimit(`payment:${req.ip}`, 20); next(); }
  catch (error) { res.status(error.status || 503).json({ message: error.status ? error.message : "Payments are temporarily unavailable." }); }
});

router.post('/create-order', createOrder);
router.post('/verify', verifyPayment);

module.exports = router;