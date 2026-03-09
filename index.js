
import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cors from "cors";

dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));

// =============================
// MongoDB Connection
// =============================
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.log("❌ DB Error:", err.message));

// =============================
// Test Route
// =============================
app.get("/", (req, res) => {
  res.send("🔥 Backend running successfully");
});

// =============================
// ADMIN ROUTES
// =============================
app.post("/api/admin/signup", async (req, res) => {
  try {
    res.json({ message: "Admin signup working" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/admin/login", async (req, res) => {
  try {
    res.json({ message: "Admin login working" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =============================
// CUSTOMER ROUTES
// =============================
app.get("/api/customers", async (req, res) => {
  res.json({ message: "All customers route working" });
});

app.post("/api/customers", async (req, res) => {
  res.json({ message: "Customer created" });
});

// =============================
// JOB ROUTES
// =============================
app.get("/api/jobs", (req, res) => {
  res.json({ message: "Jobs route working" });
});

app.post("/api/jobs", (req, res) => {
  res.json({ message: "Job created" });
});

// =============================
// PROFILE ROUTES
// =============================
app.get("/api/profile", (req, res) => {
  res.json({ message: "Profile route working" });
});

// =============================
// ORDER ROUTES
// =============================
app.get("/api/orders", (req, res) => {
  res.json({ message: "Orders route working" });
});

app.post("/api/orders", (req, res) => {
  res.json({ message: "Order created" });
});

// =============================
// EXPENSE ROUTES
// =============================
app.get("/api/expenses", (req, res) => {
  res.json({ message: "Expenses route working" });
});

app.post("/api/expenses", (req, res) => {
  res.json({ message: "Expense added" });
});

// =============================
// PAYMENT ROUTES
// =============================
app.get("/api/payments", (req, res) => {
  res.json({ message: "Payments route working" });
});

app.post("/api/payments", (req, res) => {
  res.json({ message: "Payment added" });
});

// =============================
// ADMIN EXPENSE ROUTES
// =============================
app.get("/api/admin/expenses", (req, res) => {
  res.json({ message: "Admin expenses route working" });
});

// =============================
// ADMIN PAYMENT ROUTES
// =============================
app.get("/api/admin/payments", (req, res) => {
  res.json({ message: "Admin payments route working" });
});

// =============================
// LABOR ROUTES
// =============================
app.get("/api/labor", (req, res) => {
  res.json({ message: "Labor route working" });
});

app.post("/api/labor", (req, res) => {
  res.json({ message: "Labor added" });
});

// =============================
// ATTENDANCE ROUTES
// =============================
app.get("/api/attendance", (req, res) => {
  res.json({ message: "Attendance route working" });
});

app.post("/api/attendance", (req, res) => {
  res.json({ message: "Attendance added" });
});

// =============================
// ROLE ROUTES
// =============================
app.get("/api/roles", (req, res) => {
  res.json({ message: "Roles route working" });
});

// =============================
// WORKER PAYMENT ROUTES
// =============================
app.get("/api/worker-payment", (req, res) => {
  res.json({ message: "Worker payment route working" });
});

app.post("/api/worker-payment", (req, res) => {
  res.json({ message: "Worker payment added" });
});

// =============================
// Export for Vercel
// =============================
export default app;

