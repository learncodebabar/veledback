import express from "express";
import {
  createPayment,
  getAllPayments,        // ✅ Added
  getPaymentsByOrder,
  getPaymentById,
  updatePayment,
  deletePayment
} from "../controllers/paymentController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// 🔐 All routes protected
router.use(protect);

/* =========================
   PAYMENT ROUTES
========================= */

// ✅ Create new payment
// POST /api/payments
router.post("/", createPayment);

// ✅ Get all payments
// GET /api/payments
router.get("/", getAllPayments);

// ✅ Get payments by order ID
// GET /api/payments/order/:orderId
router.get("/order/:orderId", getPaymentsByOrder);

// ✅ Get single payment by ID
// GET /api/payments/:id
router.get("/:id", getPaymentById);

// ✅ Update payment
// PUT /api/payments/:id
router.put("/:id", updatePayment);

// ✅ Delete payment
// DELETE /api/payments/:id
router.delete("/:id", deletePayment);

export default router;