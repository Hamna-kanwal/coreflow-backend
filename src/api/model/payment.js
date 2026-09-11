const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  sessionId: { type: String, required: true },
  amount: { type: Number, required: true },
  status: { type: String, default: "pending" },
  paymentDate: { type: Date, default: Date.now },

  // ---- NAYE FIELDS ----
  plan: { type: String, enum: ["monthly", "six_months", "twelve_months"], required: true },
  discountPercent: { type: Number, default: 0 },
  durationDays: { type: Number, required: true },
}, { timestamps: true });

module.exports = mongoose.model("Payment", paymentSchema);