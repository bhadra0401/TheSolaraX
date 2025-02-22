const mongoose = require("mongoose");

const PaymentSchema = new mongoose.Schema({
  email: { type: String, required: true },  // ✅ Store user's email
  codetantraId: { type: String, required: true },
  codetantraPassword: { type: String, required: true },
  paymentId: { type: String, required: true, unique: true },
  amount: { type: Number, required: true },
  screenshotUrl: { type: String, required: true },
  status: { type: String, enum: ["Pending", "Completed", "Rejected"], default: "Pending" },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Payment", PaymentSchema);
