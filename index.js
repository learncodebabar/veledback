import dotenv from "dotenv";
dotenv.config();

import express from "express";
import mongoose from "mongoose";
import cors from "cors";
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

const app = express();

// ==================== CORS FIX ====================
// Remove trailing slash from CLIENT_URL if present
const clientUrl = process.env.CLIENT_URL ? process.env.CLIENT_URL.replace(/\/$/, '') : 'https://veledfront.vercel.app';

// CORS options with proper configuration
const corsOptions = {
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      return callback(null, true);
    }
    
    // Normalize the origin by removing trailing slash
    const normalizedOrigin = origin.replace(/\/$/, '');
    
    // Check if the normalized origin matches the allowed client URL
    if (normalizedOrigin === clientUrl) {
      callback(null, true);
    } else {
      console.log(`CORS blocked: ${origin} not allowed. Expected: ${clientUrl}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  optionsSuccessStatus: 200
};

// Apply CORS middleware
app.use(cors(corsOptions));

// Logging middleware to debug CORS issues (remove in production if not needed)
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  if (req.headers.origin) {
    console.log('Origin:', req.headers.origin);
  }
  next();
});
// ==================== END CORS FIX ====================

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
app.use('/api/quotation-materials', quotationMaterialRoutes);
app.use('/api/quotations', quotationRoutes);
app.use("/api/permissions", permissionRoutes);
app.use('/api/admin/materials', adminMaterialRoutes);
app.use('/api/quotation-customers', quotationCustomerRoutes);
app.use('/api/worker-payment', workerPaymentRoutes);

// Start cron jobs
startDueDateCron();

// Environment variables check (remove in production)
console.log("Environment Check:");
console.log("EMAIL_USER:", process.env.EMAIL_USER ? "✅ Set" : "❌ Not Set");
console.log("EMAIL_PASS:", process.env.EMAIL_PASS ? "✅ Set" : "❌ Not Set");
console.log("MONGO_URI:", process.env.MONGO_URI ? "✅ Set" : "❌ Not Set");
console.log("JWT_SECRET:", process.env.JWT_SECRET ? "✅ Set" : "❌ Not Set");
console.log("CLIENT_URL:", clientUrl);
console.log("PORT:", process.env.PORT || 5000);

// Test route
app.get("/", (req, res) => {
  res.json({ 
    message: "🔥 Backend running", 
    status: "active",
    cors: {
      allowedOrigin: clientUrl,
      credentials: true
    }
  });
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ 
    status: "healthy", 
    timestamp: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? "connected" : "disconnected"
  });
});

// MongoDB Connection - FIXED: Removed deprecated options
const connectDB = async () => {
  try {
    // For Mongoose 7+, no need for useNewUrlParser and useUnifiedTopology
    // They are enabled by default
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB Connected");
  } catch (err) {
    console.log("❌ DB Connection Error:", err.message);
    process.exit(1);
  }
};

connectDB();

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Error:", err);
  
  // Handle CORS errors specifically
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ 
      error: "CORS Error", 
      message: "Origin not allowed",
      allowedOrigin: clientUrl
    });
  }
  
  res.status(err.status || 500).json({ 
    error: err.message || "Internal Server Error" 
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 CORS enabled for: ${clientUrl}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
});