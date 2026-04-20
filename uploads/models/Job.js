// import mongoose from "mongoose";

// const jobSchema = new mongoose.Schema({
//   customer: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: "Customer",
//     required: true
//   },
//   works: [
//     {
//       name: String,
//       qty: Number
//     }
//   ],
//   materials: [
//     {
//       name: String,
//       qty: Number,
//       rate: Number,
//       total: Number
//     }
//   ],
//   total: { type: Number, required: true },
//   billNumber: { type: String, required: true },
//   date: { type: String, required: true }
// }, { timestamps: true });

// export default mongoose.model("Job", jobSchema);

import mongoose from "mongoose";

const materialSchema = new mongoose.Schema({
  name: String,
  qty: Number,
  rate: Number,
  total: Number
});

const workSchema = new mongoose.Schema({
  name: String,
  qty: Number,
  materials: [materialSchema]   // 🔥 materials ab work ke andar
});

const jobSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Customer",
    required: true
  },
  works: [workSchema],
  total: { type: Number, required: true },
  billNumber: { type: String, required: true },
  date: { type: String, required: true },
  estimatedAmounts: {    // 🔥 New field for Low, Medium, High estimates
    low: { type: Number },
    medium: { type: Number },
    high: { type: Number }
  }
}, { timestamps: true });

export default mongoose.model("Job", jobSchema);