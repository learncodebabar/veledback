import mongoose from "mongoose";

const profileSchema = new mongoose.Schema(
  {
    shopName: { type: String, required: true },
    ownerName: String,
    phone: String,
    whatsapp: String,
    email: String,
    address: String,
    gstNumber: String,
    footerNote: String,
    logo: String,
  },
  { timestamps: true }
);

export default mongoose.model("Profile", profileSchema);