import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

const customerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  address: { type: String },
  customerId: { type: String, unique: true, default: () => uuidv4() }
}, { timestamps: true });

export default mongoose.model("Customer", customerSchema);
