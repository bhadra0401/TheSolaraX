const express = require("express");
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

// ✅ User Signup (Without Hashing)
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ msg: "All fields are required." });
    }

    if (await User.findOne({ email })) {
      return res.status(409).json({ msg: "Email already in use." });
    }

    const user = new User({ name, email, password, role: role || "user" });
    await user.save();

    console.log("✅ User registered successfully:", email);
    res.status(201).json({ msg: "User registered successfully" });
  } catch (error) {
    console.error("❌ Signup Server Error:", error);
    res.status(500).json({ msg: "Server error" });
  }
});

// ✅ User Login (Without Hashing)
router.post("/login", async (req, res) => {
  try {
    console.log("📌 Login Attempt:", req.body.email);

    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ msg: "All fields are required." });
    }

    const user = await User.findOne({ email });
    if (!user || user.password !== password) {
      console.log("❌ Invalid email or password for:", email);
      return res.status(401).json({ msg: "Invalid email or password" });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET || "defaultSecret",
      { expiresIn: "7d" }
    );

    console.log("✅ Login successful:", email);
    res.json({ msg: "Login successful!", token, role: user.role });
  } catch (error) {
    console.error("❌ Login Server Error:", error);
    res.status(500).json({ msg: "Server error" });
  }
});

// ✅ Admin Login (Without Hashing)
router.post("/admin/login", async (req, res) => {
  try {
    console.log("📌 Admin Login Attempt:", req.body.email);

    const { email, password } = req.body;
    const user = await User.findOne({ email, role: "admin" });
    if (!user || user.password !== password) {
      console.log("❌ Invalid admin credentials for:", email);
      return res.status(401).json({ msg: "Invalid admin credentials" });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, role: "admin" },
      process.env.JWT_SECRET || "defaultSecret",
      { expiresIn: "7d" }
    );

    console.log("✅ Admin login successful:", email);
    res.json({ msg: "Admin login successful!", token });
  } catch (error) {
    console.error("❌ Admin Login Server Error:", error);
    res.status(500).json({ msg: "Server error" });
  }
});

// ✅ Fetch User Profile
router.get("/profile", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      console.log("❌ User not found:", req.user.id);
      return res.status(404).json({ msg: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error("❌ Profile Fetch Error:", error);
    res.status(500).json({ msg: "Server error" });
  }
});

module.exports = router;
