require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require("multer");
const nodemailer = require("nodemailer");
const path = require("path");
const Payment = require("./paymentModel");
const User = require("./userModel");
const authRouter = require("./authRouter");
const jwt = require("jsonwebtoken"); // ✅ Add this line
// ✅ Ensure `validReferralCodes` is always an array
const validReferralCodes = process.env.VALID_REFERRAL_CODES 
    ? process.env.VALID_REFERRAL_CODES.split(",").map(code => code.trim().toUpperCase()) 
    : [];


const app = express();
app.use(express.json());
app.use(cors({
    origin: "https://verdant-zabaione-36cfc3.netlify.app",
    methods: "GET,POST,PUT,DELETE",
    allowedHeaders: "Content-Type,Authorization",
    credentials: true
}));

// ✅ Serve static files (Frontend)
app.use(express.static("public"));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ✅ Use Authentication Routes
app.use("/auth", authRouter);

// ✅ MongoDB Connection
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.log("❌ MongoDB connection error:", err));

mongoose.connection.on("error", (err) => {
    console.error("❌ MongoDB Disconnected:", err);
});

// ✅ Multer Setup for File Uploads
const storage = multer.diskStorage({
    destination: "uploads/",
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

// ✅ Referral Code Validation Endpoint

app.post("/validate-referral", async (req, res) => {
    try {
        const { code } = req.body;
        console.log("📌 Received Referral Code:", code);

        if (!code) {
            return res.status(400).json({ msg: "No referral code provided." });
        }

        // ✅ Convert input code to uppercase & compare
        if (validReferralCodes.includes(code.trim().toUpperCase())) {
            res.json({ valid: true });
        } else {
            res.json({ valid: false });
        }
    } catch (error) {
        console.error("❌ Error in /validate-referral:", error);
        res.status(500).json({ msg: "Server error validating referral code." });
    }
});

// ✅ Submit Payment Proof & Send Email
app.post("/submit-payment", upload.single("screenshot"), async (req, res) => {
    try {
        console.log("📌 Payment Submission Attempt:", req.body);
        console.log("📌 Uploaded File Details:", req.file);

        // ✅ Extract Token & Verify User
        const token = req.header("Authorization").replace("Bearer ", "");
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "defaultSecret");

        // ✅ Extract Required Data
        const { codetantraId, codetantraPassword, paymentId, amount, planName, completionPercentage, referralCode } = req.body;

        // ✅ Validate Required Fields
        if (!codetantraId || !codetantraPassword || !paymentId || !amount || !req.file || !planName || !completionPercentage) {
            return res.status(400).json({ msg: "All fields are required." });
        }

        // ✅ Find the User
        const user = await User.findById(decoded.id);
        if (!user) {
            return res.status(404).json({ msg: "User not found" });
        }

        // ✅ Validate Referral Code (If Provided)
        let finalReferralCode = null;
        if (referralCode) {
            if (!validReferralCodes || !Array.isArray(validReferralCodes)) {
                console.error("❌ ERROR: validReferralCodes is not defined correctly!");
                return res.status(500).json({ msg: "Server error: Referral codes are not set up properly." });
            }

            if (!validReferralCodes.includes(referralCode)) {
                return res.status(400).json({ msg: "Invalid referral code." });
            }

            finalReferralCode = referralCode; // ✅ Save valid referral code
        }

        // ✅ Save Payment Details to Database
        const newPayment = new Payment({
            email: user.email,
            codetantraId,
            codetantraPassword,
            paymentId,
            amount: parseInt(amount, 10),
            planName,
            completionPercentage,
            referralCode: finalReferralCode, // ✅ Save only valid referral codes
            screenshotUrl: `/uploads/${req.file.filename}`,
            status: "Pending"
        });

        await newPayment.save();
        console.log("✅ Payment saved successfully:", newPayment);

        // ✅ Send Email Notification
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL,
                pass: process.env.EMAIL_PASS
            }
        });

        const mailOptions = {
            from: process.env.EMAIL,
            to: process.env.OWNER_EMAIL,
            subject: "New Payment Submission",
            html: `<p><strong>User Email:</strong> ${user.email}</p>
                   <p><strong>Plan Name:</strong> ${planName}</p>
                   <p><strong>Completion Percentage:</strong> ${completionPercentage}</p>
                   <p><strong>Codetantra ID:</strong> ${codetantraId}</p>
                   <p><strong>Codetantra Password:</strong> ${codetantraPassword}</p>
                   <p><strong>Payment ID:</strong> ${paymentId}</p>
                   <p><strong>Amount:</strong> ₹${amount}</p>
                   <p><strong>Referral Code:</strong> ${finalReferralCode || 'None'}</p>
                   <p><strong>Screenshot:</strong> <a href="${req.protocol}://${req.get("host")}/uploads/${req.file.filename}" target="_blank">View Screenshot</a></p>`
        };

        await transporter.sendMail(mailOptions);
        res.json({ msg: "Payment submitted and email sent successfully." });

    } catch (error) {
        console.error("❌ ERROR in /submit-payment:", error);
        res.status(500).json({ msg: "Server error", error: error.message });
    }
});

// ✅ Fetch Payment Status
app.get("/payment-status", async (req, res) => {
    try {
        const token = req.header("Authorization").replace("Bearer ", "");
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "defaultSecret");

        console.log("📌 Decoded Token:", decoded); // ✅ Debugging log

        const user = await User.findById(decoded.id); // ✅ Get the user from DB
        if (!user) {
            return res.status(404).json({ msg: "User not found" });
        }

        console.log("📌 Fetching payments for:", user.email); // ✅ Log correct email
        const userPayments = await Payment.find({ email: user.email }); // ✅ Use email instead of codetantraId

        console.log("📌 User Payments Found:", userPayments); // ✅ Log the fetched payments
        res.json({ payments: userPayments });

    } catch (error) {
        console.error("❌ Error fetching payments:", error);
        res.status(500).json({ msg: "Server error", error: error.message });
    }
});


// ✅ Root Route (For Testing)
app.get("/", (req, res) => {
    res.send("Server is running 🚀");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
