import express from 'express';
import {
  getAllExpenses,
  createExpense,
  getExpenseById,
  updateExpense,
  deleteExpense,
  getExpenseStats,
  getExpensesByCategory,
  bulkDeleteExpenses,
  exportExpensesToCSV
} from '../controllers/AdminExpense.js';
import { protect } from "../middleware/auth.js";   // ✅ Aapka exact path - NO CHANGE

const router = express.Router();

// All routes are protected
router.use(protect);  // ✅ Sirf protect use kiya (admin nahi)

// Main routes
router.route('/')
  .get(getAllExpenses)
  .post(createExpense);

// Export routes
router.get('/export/csv', exportExpensesToCSV);

// Stats route
router.get('/stats/dashboard', getExpenseStats);

// Bulk operations
router.delete('/bulk', bulkDeleteExpenses);

// Category specific route
router.get('/categories/:category', getExpensesByCategory);

// Single expense routes
router.route('/:id')
  .get(getExpenseById)
  .put(updateExpense)
  .delete(deleteExpense);

export default router;