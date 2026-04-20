import express from "express";
import {
  createPayment,
  getPaymentsByOrder,
  deletePayment
} from "../controllers/paymentController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.use(protect);

// پیمنٹ بنائیں
router.post("/", createPayment);

// آرڈر کی ساری پیمنٹس دیکھیں
router.get("/order/:orderId", getPaymentsByOrder);

// پیمنٹ ڈیلیٹ کریں
router.delete("/:orderId/:paymentIndex", deletePayment);

export default router;