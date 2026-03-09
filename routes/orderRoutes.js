import express from "express";
import {
  createOrder,
  getAllOrders,
  getOrderById,
  getOrdersByCustomer,
  updateOrder,
  deleteOrder
} from "../controllers/orderController.js";
import { protect } from "../middleware/auth.js";
 

const router = express.Router();

router.post("/", protect, createOrder);

router.get("/", protect, getAllOrders);

router.get("/customer/:customerId", protect, getOrdersByCustomer);

router.get("/:id", protect, getOrderById);

router.put("/:id", protect, updateOrder);

router.delete("/:id", protect, deleteOrder);

export default router;