import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  createQuotationCustomer,
  getAllQuotationCustomers,
  getQuotationCustomerById,
  updateQuotationCustomer,
  deleteQuotationCustomer,
  searchQuotationCustomers,
  getQuotationCustomerByPhone  // ✅ YEH FUNCTION ADD KARNA HOGA
} from '../controllers/quotationCustomer.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Special routes (must come before /:id)
router.get('/search', searchQuotationCustomers);
router.get('/phone/:phone', getQuotationCustomerByPhone);  // ✅ YEH ROUTE ADD KARO

// Main routes
router.route('/')
  .post(createQuotationCustomer)
  .get(getAllQuotationCustomers);

// Single customer routes
router.route('/:id')
  .get(getQuotationCustomerById)
  .put(updateQuotationCustomer)
  .delete(deleteQuotationCustomer);

export default router;