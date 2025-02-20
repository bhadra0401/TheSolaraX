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
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ msg: "Invalid or expired token" });
  }
};

// ✅ User Signup
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ msg: "All fields are required." });
    }

    if (await User.findOne({ email })) {
      return res.status(409).json({ msg: "Email already in use." });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = new User({ name, email, password: hashedPassword, role: role || "user" });
    await user.save();

    res.status(201).json({ msg: "User registered successfully" });
  } catch (error) {
    res.status(500).json({ msg: "Server error" });
  }
});

// ✅ User Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ msg: "All fields are required." });
    }

    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ msg: "Invalid email or password" });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ msg: "Login successful!", token, role: user.role });
  } catch (error) {
    res.status(500).json({ msg: "Server error" });
  }
});

// ✅ Admin Login
router.post("/admin/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email, role: "admin" });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ msg: "Invalid admin credentials" });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, role: "admin" },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ msg: "Admin login successful!", token });
  } catch (error) {
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
    res.status(500).json({ msg: "Server error" });
  }
});

module.exports = router;