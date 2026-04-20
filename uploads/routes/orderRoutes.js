// backend/routes/orderRoutes.js
import express from "express";
import {
  createOrder,
  getAllOrders,
  getOrderById,
  getOrdersByCustomer,
  updateOrder,
  deleteOrder,
  createOrderFromQuotation,
  updateOrderStatus,
  addPayment,
  getOrderStats,
  getOrdersByPaymentStatus
} from "../controllers/orderController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.post("/", protect, createOrder);
router.post("/from-quotation", protect, createOrderFromQuotation);
router.get("/", protect, getAllOrders);
router.get("/stats", protect, getOrderStats);
router.get("/payment-status/:status", protect, getOrdersByPaymentStatus);
router.get("/customer/:customerId", protect, getOrdersByCustomer);
router.get("/:id", protect, getOrderById);
router.put("/:id", protect, updateOrder);
router.patch("/:id/status", protect, updateOrderStatus);
router.post("/:id/payments", protect, addPayment);
router.delete("/:id", protect, deleteOrder);

export default router;