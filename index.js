import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cors from "cors";
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
// ✅ Fix 1: Sahi path se import karein
import workerPaymentRoutes from './routes/workerPayment.js';  // routes folder se import

dotenv.config();
const app = express();

// Middleware
app.use(express.json());
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));

// Serve uploads folder
app.use("/uploads", express.static("uploads"));

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
// ✅ Fix 2: app.use() use karein, router.use() nahi
app.use('/api/worker-payment', workerPaymentRoutes);  // Worker payment routes

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