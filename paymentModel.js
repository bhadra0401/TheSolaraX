const mongoose = require("mongoose");

const PaymentSchema = new mongoose.Schema({
  codetantraId: { type: String, required: true },
  codetantraPassword: { type: String, required: true }, // ✅ Stored without hashing
  paymentId: { type: String, required: true, unique: true },
  screenshotUrl: { type: String, required: true },
  razorpayOrderId: { type: String, unique: true, sparse: true }, // ✅ Allows `null` values without conflict
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Payment", PaymentSchema);
