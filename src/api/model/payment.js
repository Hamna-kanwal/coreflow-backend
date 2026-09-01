const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // Yeh User table se link karega
    required: true,
  },
  sessionId: { type: String, required: true },
  amount: { type: Number, required: true },
  status: { type: String, default: "pending" },
  paymentDate: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model("Payment", paymentSchema);