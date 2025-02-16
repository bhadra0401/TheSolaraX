const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { 
    type: String, 
    required: true, 
    unique: true, 
    lowercase: true, // ✅ Ensures emails are stored in lowercase
    match: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/ // ✅ Ensures valid email format
  },
  password: { type: String, required: true }, // ✅ Store plain password
  role: { type: String, default: "user", enum: ["user", "admin"] } // ✅ Role-based access
}, { timestamps: true });

// ✅ Hide Password from API Responses
UserSchema.set("toJSON", {
  transform: function (doc, ret) {
    delete ret.password;
    return ret;
  }
});

module.exports = mongoose.model("User", UserSchema);
