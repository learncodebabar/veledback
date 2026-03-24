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
import workerPaymentRoutes from './routes/workerPayment.js';

dotenv.config();
const app = express();

// Log environment for debugging
console.log('🔧 Environment:', process.env.NODE_ENV);
console.log('🔧 CLIENT_URL:', process.env.CLIENT_URL);

// Middleware
app.use(express.json());

// SIMPLE CORS - Allow everything for testing first
app.use((req, res, next) => {
  // Allow any origin for now
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// OR if you want to use cors middleware with logging:
/*
const allowedOrigins = [
  'https://veledfront.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5000',
];

app.use(cors({
  origin: function (origin, callback) {
    console.log('🔍 Origin received:', origin);
    console.log('🔍 Allowed origins:', allowedOrigins);
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      console.log('✅ No origin, allowing');
      return callback(null, true);
    }
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      console.log('✅ Origin allowed:', origin);
      callback(null, true);
    } else {
      console.log('❌ Origin blocked:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
*/

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
app.use('/api/worker-payment', workerPaymentRoutes);

// Test route with CORS info
app.get("/", (req, res) => {
  res.json({ 
    message: "🔥 Backend running",
    cors: "CORS is enabled",
    environment: process.env.NODE_ENV,
    clientUrl: process.env.CLIENT_URL
  });
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
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Test the API at: http://localhost:${PORT}`);
  console.log(`🌐 CORS is configured to accept requests from any origin (for testing)`);
});
