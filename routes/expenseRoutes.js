// backend/routes/expenseRoutes.js
import express from "express";
import {
  createExpense,
  getAllExpenses,      // ✅ Add this
  getExpensesByOrder,
  getExpenseById,
  updateExpense,
  deleteExpense
} from "../controllers/expenseController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// All routes are protected
router.use(protect);

// Create new expense
router.post("/", createExpense);

// ✅ Get all expenses (NEW)
router.get("/", getAllExpenses);

// Get expenses by order ID
router.get("/order/:orderId", getExpensesByOrder);

// Get single expense by ID
router.get("/:id", getExpenseById);

// Update expense
router.put("/:id", updateExpense);

// Delete expense
router.delete("/:id", deleteExpense);

export default router;