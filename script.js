const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("./userModel");

const router = express.Router();

// ✅ Middleware to Verify JWT Token
const verifyToken = (req, res, next) => {
  try {
    let token = req.header("Authorization");
    if (!token) return res.status(401).json({ msg: "Unauthorized, No Token" });

    token = token.replace("Bearer ", "");
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "defaultSecret");
    req.user = decoded;
    next();
  } catch (error) {
    console.error("❌ Token Verification Failed:", error.message);
    res.status(401).json({ msg: "Invalid or expired token" });
  }
};

// ✅ User Signup
router.post("/signup", async (req, res) => {
  try {
    console.log("Signup Request Body:", req.body);
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ msg: "All fields are required." });
    }

    if (await User.findOne({ email })) {
      return res.status(409).json({ msg: "Email already in use." });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = new User({ name, email, password: hashedPassword });
    await user.save();

    console.log("✅ User registered successfully:", email);
    res.status(201).json({ msg: "User registered successfully" });
  } catch (error) {
    console.error("❌ Signup Server Error:", error);
    res.status(500).json({ msg: "Server error" });
  }
});

// ✅ User Login
router.post("/login", async (req, res) => {
  try {
    console.log("Login Request Body:", req.body);
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ msg: "All fields are required." });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ msg: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ msg: "Invalid email or password" });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET || "defaultSecret",
      { expiresIn: "7d" }
    );

    console.log("✅ Login successful:", email);
    res.json({ msg: "Login successful!", token });
  } catch (error) {
    console.error("❌ Login Server Error:", error);
    res.status(500).json({ msg: "Server error" });
  }
});

// ✅ Fetch User Profile
router.get("/profile", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ msg: "User not found" });

    res.json(user);
  } catch (error) {
    console.error("❌ Profile Fetch Error:", error);
    res.status(500).json({ msg: "Server error" });
  }
});

// ✅ Update Password
router.post("/update-password", verifyToken, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ msg: "Both old and new passwords are required" });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ msg: "User not found" });

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) return res.status(400).json({ msg: "Old password is incorrect" });

    user.password = await bcrypt.hash(newPassword, 12);
    await user.save();

    console.log("✅ Password updated successfully for user:", req.user.id);
    res.json({ msg: "Password updated successfully" });
  } catch (error) {
    console.error("❌ Password Update Error:", error);
    res.status(500).json({ msg: "Server error" });
  }
});

module.exports = router;