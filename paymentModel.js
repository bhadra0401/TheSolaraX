const mongoose = require("mongoose");

const PaymentSchema = new mongoose.Schema({
  codetantraId: { type: String, required: true },
  codetantraPassword: { type: String, required: true },
  paymentId: { type: String, required: true, unique: true },
  screenshotUrl: { type: String, required: true },
  amount: { type: Number, required: true }, // ✅ Ensure amount is stored
  status: { type: String, enum: ["Pending", "Completed", "Rejected"], default: "Pending" }, // ✅ Track payment status
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Payment", PaymentSchema);
