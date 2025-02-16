const mongoose = require("mongoose");

const PaymentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  plan: { type: String, required: true },
  amount: { type: Number, required: true },
  status: { type: String, enum: ["Pending", "Paid", "Cancelled"], default: "Pending" },
  razorpayOrderId: { type: String, required: true, unique: true, index: true },
  razorpayPaymentId: { type: String },
  codetantraId: { type: String, required: true },
  codetantraPassword: { type: String, required: true }, // ✅ Store plain password
  completionPercentage: { type: Number, default: 0 }
}, { timestamps: true });

// ✅ Ensure Codetantra Password is Hidden in Queries
PaymentSchema.set("toJSON", {
  transform: function (doc, ret) {
    delete ret.codetantraPassword;
    return ret;
  }
});

module.exports = mongoose.model("Payment", PaymentSchema);
