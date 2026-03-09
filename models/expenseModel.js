// backend/models/expenseModel.js
import mongoose from "mongoose";

const expenseSchema = new mongoose.Schema({
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order",
    required: true
  },
  description: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  category: {
    type: String,
    enum: ["material", "labor", "transport", "other"],
    default: "material"
  },
  notes: {
    type: String,
    default: ""
  }
}, { timestamps: true });

export default mongoose.model("Expense", expenseSchema);