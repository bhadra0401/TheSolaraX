require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const path = require("path");
const jwt = require("jsonwebtoken");
const Payment = require("./paymentModel");
const nodemailer = require("nodemailer");
const authRouter = require("./authRouter");

const app = express();
app.use(express.json());
app.use(cors({ origin: "https://verdant-zabaione-36cfc3.netlify.app" }));


// Serve frontend files from /public
app.use(express.static(path.join(__dirname, "public")));

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.log("❌ MongoDB connection error:", err));

app.use("/auth", authRouter);

// ✅ Razorpay Instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY,
  key_secret: process.env.RAZORPAY_SECRET
});

// ✅ Email Transporter Setup
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.OWNER_EMAIL,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false // ✅ Fix self-signed certificate issue
  }
});

// ✅ Middleware to Verify JWT
const verifyToken = (req, res, next) => {
  const token = req.header("Authorization");
  if (!token) return res.status(401).json({ msg: "Unauthorized" });

  try {
    const decoded = jwt.verify(token.replace("Bearer ", ""), process.env.JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch (error) {
    res.status(401).json({ msg: "Invalid token" });
  }
};
// ✅ Create Razorpay Order
app.post("/create-order", verifyToken, async (req, res) => {
  try {
    let { amount, codetantraId, codetantraPassword } = req.body;

    if (!amount || !codetantraId || !codetantraPassword) {
      return res.status(400).json({ msg: "All fields are required." });
    }

    amount = amount * 100; // Convert to paise

    console.log("✅ Creating Razorpay order with amount:", amount);

    const order = await razorpay.orders.create({
      amount: amount,
      currency: "INR",
      receipt: `order_${Date.now()}`
    });

    console.log("✅ Razorpay Order Created:", order);

    const newPayment = new Payment({
      userId: req.userId,
      codetantraId,
      codetantraPassword,  // ✅ Store original password
      plan: amount === 25000 ? "Basic" : amount === 50000 ? "Standard" : "Premium",
      amount,
      status: "Pending",
      razorpayOrderId: order.id
    });

    await newPayment.save();
    res.json(order);
  } catch (error) {
    console.error("❌ Error Creating Order:", error);
    res.status(500).json({ msg: "Server error", error: error.message });
  }
});

// ✅ Verify Payment & Send Email
app.post("/verify-payment", verifyToken, async (req, res) => {
  try {
    const { order_id, payment_id, signature } = req.body;

    if (!order_id || !payment_id || !signature) {
      return res.status(400).json({ msg: "Missing payment details" });
    }

    // ✅ Verify Payment Signature
    const generatedSignature = crypto.createHmac("sha256", process.env.RAZORPAY_SECRET)
      .update(order_id + "|" + payment_id)
      .digest("hex");

    if (generatedSignature !== signature) {
      return res.status(400).json({ msg: "Invalid payment signature" });
    }

    // ✅ Mark payment as "Paid"
    const updatedPayment = await Payment.findOneAndUpdate(
      { razorpayOrderId: order_id },
      { status: "Paid", razorpayPaymentId: payment_id },
      { new: true }
    ).lean();

    if (!updatedPayment) {
      return res.status(404).json({ msg: "Payment not found in database." });
    }

    // ✅ Fetch original (unhashed) password
    const originalPayment = await Payment.findOne({ razorpayOrderId: order_id }).select("codetantraPassword");

    // ✅ Send email to website owner with **original password**
    const mailOptions = {
      from: process.env.OWNER_EMAIL,
      to: process.env.OWNER_EMAIL,
      subject: "New Codetantra Payment Received",
      html: `
        <h3>New Payment Confirmation</h3>
        <p><strong>Plan:</strong> ${updatedPayment.plan}</p>
        <p><strong>Amount:</strong> ₹${updatedPayment.amount / 100}</p>
        <p><strong>Status:</strong> Paid</p>
        <p><strong>Codetantra ID:</strong> ${updatedPayment.codetantraId}</p>
        <p><strong>Codetantra Password:</strong> ${originalPayment.codetantraPassword}</p> <!-- ✅ Sending Original Password -->
      `
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log("❌ Email Error:", error);
      } else {
        console.log("✅ Email sent:", info.response);
      }
    });

    res.json({ success: true, msg: "Payment verified and email sent" });
  } catch (error) {
    console.error("❌ Payment Verification Error:", error);
    res.status(500).json({ msg: "Payment verification failed", error: error.message });
  }
});

// ✅ Fetch Payment Status
app.get("/payment-status", verifyToken, async (req, res) => {
  try {
    const userPayments = await Payment.find({ userId: req.userId }).select("-codetantraPassword");
    res.json({ payments: userPayments });
  } catch (error) {
    console.error("❌ Error Fetching Payment Status:", error);
    res.status(500).json({ msg: "Error fetching payment details", error: error.message });
  }
});

// ✅ Update Completion Percentage
app.post("/update-progress/:paymentId", async (req, res) => {
  try {
    const { completionPercentage } = req.body;
    const { paymentId } = req.params;

    if (completionPercentage < 0 || completionPercentage > 100) {
      return res.status(400).json({ msg: "Invalid completion percentage" });
    }

    const updatedPayment = await Payment.findByIdAndUpdate(
      paymentId,
      { completionPercentage },
      { new: true }
    );

    if (!updatedPayment) {
      return res.status(404).json({ msg: "Payment record not found" });
    }

    // ✅ Notify user when course is completed
    if (completionPercentage === 100) {
      const mailOptions = {
        from: process.env.OWNER_EMAIL,
        to: updatedPayment.userEmail,
        subject: "Codetantra Course Completion",
        html: `<p>Your Codetantra course has been successfully completed. Thank you for using zeBRO services.</p>`
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.log("❌ Email Error:", error);
        } else {
          console.log("✅ Completion Email Sent:", info.response);
        }
      });
    }

    res.json({ msg: "Progress updated", updatedPayment });
  } catch (error) {
    console.error("❌ Error Updating Progress:", error);
    res.status(500).json({ msg: "Server error", error: error.message });
  }
});

// ✅ Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
