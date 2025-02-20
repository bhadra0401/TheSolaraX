require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const nodemailer = require("nodemailer");
const Payment = require("./paymentModel");
const authRouter = require("./authRouter");

const app = express();
app.use(express.json());
app.use(cors({ origin: "https://verdant-zabaione-36cfc3.netlify.app" }));

// ✅ Serve static files (Frontend)
app.use(express.static("public"));

// ✅ Serve uploaded files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ✅ MongoDB Connection
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.log("❌ MongoDB connection error:", err));

app.use("/auth", authRouter);

// ✅ Multer Setup for File Uploads
const storage = multer.diskStorage({
    destination: "uploads/",
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

// ✅ Middleware for Token Verification
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

// ✅ Submit Payment Proof
app.post("/submit-payment-proof", verifyToken, upload.single("screenshot"), async (req, res) => {
    try {
        const { paymentId, amount } = req.body;
        if (!paymentId || !amount || !req.file) {
            return res.status(400).json({ msg: "Payment ID, amount, and screenshot are required." });
        }
        const newPayment = new Payment({
            userId: req.userId,
            paymentId,
            screenshotUrl: `/uploads/${req.file.filename}`,
            amount,
            status: "Pending"
        });
        await newPayment.save();
        res.json({ msg: "Payment proof submitted successfully." });
    } catch (error) {
        console.error("❌ Error submitting payment proof:", error);
        res.status(500).json({ msg: "Server error" });
    }
});

// ✅ Fetch Payment Status for Users
app.get("/payment-status", verifyToken, async (req, res) => {
    try {
        const payments = await Payment.find({ userId: req.userId });
        res.json({ payments });
    } catch (error) {
        console.error("❌ Error fetching payment status:", error);
        res.status(500).json({ msg: "Server error" });
    }
});

// ✅ Admin: Get Payment Requests
app.get("/admin/payment-requests", verifyToken, async (req, res) => {
    try {
        const payments = await Payment.find();
        res.json({ payments });
    } catch (error) {
        console.error("❌ Error fetching payments:", error);
        res.status(500).json({ msg: "Server error" });
    }
});

// ✅ Admin: Approve Payment
app.post("/admin/approve-payment/:id", verifyToken, async (req, res) => {
    try {
        const updatedPayment = await Payment.findByIdAndUpdate(req.params.id, { status: "Approved" }, { new: true });
        if (!updatedPayment) return res.status(404).json({ msg: "Payment not found." });
        res.json({ msg: "Payment approved successfully." });
    } catch (error) {
        console.error("❌ Error approving payment:", error);
        res.status(500).json({ msg: "Server error" });
    }
});

// ✅ Admin: Reject Payment
app.post("/admin/reject-payment/:id", verifyToken, async (req, res) => {
    try {
        const updatedPayment = await Payment.findByIdAndUpdate(req.params.id, { status: "Rejected" }, { new: true });
        if (!updatedPayment) return res.status(404).json({ msg: "Payment not found." });
        res.json({ msg: "Payment rejected successfully." });
    } catch (error) {
        console.error("❌ Error rejecting payment:", error);
        res.status(500).json({ msg: "Server error" });
    }
});

// ✅ Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
