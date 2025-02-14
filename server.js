require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const authRouter = require("./authRouter");
const path = require("path");

const app = express();
app.use(express.json());
app.use(cors());

// Serve frontend files from /public
app.use(express.static(path.join(__dirname, "public")));

// Connect to MongoDB Atlas
mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.log("❌ MongoDB connection error:", err));

app.use("/auth", authRouter);

// Serve index.html as the default route
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ✅ Serve homepage.html after login
app.get("/homepage.html", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "homepage.html"));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
