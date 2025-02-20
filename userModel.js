const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { 
    type: String, 
    required: true, 
    unique: true, 
    lowercase: true, 
    match: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/ 
  },
  password: { type: String, required: true }, // ✅ Store original password without hashing
  role: { type: String, default: "user", enum: ["user", "admin"] }
}, { timestamps: true });

module.exports = mongoose.model("User", UserSchema);