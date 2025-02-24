const mongoose = require("mongoose");

const PaymentSchema = new mongoose.Schema({
  email: { type: String, required: true },  // ✅ Store user's email
  codetantraId: { type: String, required: true },
  codetantraPassword: { type: String, required: true },
  referralCode: { type: String, default: null }, // ✅ Store Referral Code
  paymentId: { type: String, required: true, unique: true },
  amount: { type: Number, required: true },
  planName: { type: String, required: true },  // ✅ Store Plan Name
  completionPercentage: { type: String, required: true },  // ✅ Store Completion %
  screenshotUrl: { type: String, required: true },
  status: { type: String, enum: ["Pending", "Completed", "Rejected"], default: "Pending" },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Payment", PaymentSchema);
