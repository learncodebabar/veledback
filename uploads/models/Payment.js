// backend/models/Payment.js
import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order",
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  paymentMethod: {
    type: String,
    enum: ["cash", "card", "bank", "cheque"],
    default: "cash"
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  notes: {
    type: String,
    default: ""
  },
  status: {
    type: String,
    enum: ["completed", "pending", "failed"],
    default: "completed"
  }
}, { timestamps: true });

// Safe way to define model (prevents OverwriteModelError)
const Payment = mongoose.models.Payment || mongoose.model("Payment", paymentSchema);

export default Payment;