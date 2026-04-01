import dotenv from "dotenv";
dotenv.config();

import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import path from "path";  // ✅ یہ import کریں
import { fileURLToPath } from 'url';  // ✅ یہ بھی import کریں
import { startDueDateCron } from './utils/cronJobs.js';
import adminRoutes from "./routes/adminRoutes.js";
import customerRoutes from "./routes/customerRoutes.js";
import jobRoutes from "./routes/jobRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";
import orderRoutes from './routes/orderRoutes.js';
import expenseRoutes from "./routes/expenseRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import adminExpenseRoutes from "./routes/adminExpenseRoutes.js";
import adminPaymentRoutes from "./routes/adminPaymentRoutes.js";
import laborRoutes from "./routes/laborRoutes.js"; 
import attendanceRoutes from "./routes/attendanceRoutes.js";
import roleRoutes from './routes/roleRoutes.js';
import adminMaterialRoutes from './routes/adminMaterial.js';
import permissionRoutes from "./routes/permissionRoutes.js";
import quotationCustomerRoutes from './routes/quotationCustomer.js';
import workerPaymentRoutes from './routes/workerPayment.js';
import quotationMaterialRoutes from './routes/quotationMaterial.js';
import quotationRoutes from './routes/quotation.js';

// ✅ یہ دو لائنیں ضروری ہیں
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// ✅ یہ پہلے لگائیں (static files serve کرنے سے پہلے)
app.use(express.json());
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));

// ✅ Serve uploads folder - یہ صحیح طریقہ ہے
app.use("/uploads", express.static(path.join(__dirname, 'uploads')));
console.log('📁 Uploads folder path:', path.join(__dirname, 'uploads'));

// Optional: یہ middleware لگا دیں کہ دیکھیں کون سی فائلیں مانگی جا رہی ہیں
app.use('/uploads', (req, res, next) => {
  console.log('🖼️ Requested file:', req.url);
  next();
});

// Routes
app.use("/api/admin", adminRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/profile", profileRoutes);
app.use('/api/orders', orderRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/admin/expenses", adminExpenseRoutes);
app.use("/api/admin/payments", adminPaymentRoutes);
app.use('/api/labor', laborRoutes);  
app.use("/api/attendance", attendanceRoutes);  
app.use('/api/roles', roleRoutes);
app.use('/api/quotation-materials', quotationMaterialRoutes);
app.use('/api/quotations', quotationRoutes);
app.use("/api/permissions", permissionRoutes);
app.use('/api/admin/materials', adminMaterialRoutes);
app.use('/api/quotation-customers', quotationCustomerRoutes);
app.use('/api/worker-payment', workerPaymentRoutes);

startDueDateCron();

console.log("EMAIL:", process.env.EMAIL_USER);
console.log("PASS:", process.env.EMAIL_PASS ? "✅ Set" : "❌ Not set");

// Test route
app.get("/", (req, res) => {
  res.send("🔥 Backend running");
});

// MongoDB Connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB Connected");
  } catch (err) {
    console.log("❌ DB Connection Error:", err.message);
    process.exit(1);
  }
};

connectDB();

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));