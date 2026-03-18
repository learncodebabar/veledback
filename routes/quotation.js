import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  createQuotation,
  getAllQuotations,
  getQuotationById,
  updateQuotation,
  deleteQuotation,
  updateQuotationStatus,
  getQuotationsByCustomer,
  deleteQuotationImage,
  uploadImages,
  printQuotationWithoutCost,  // ✅ New
  printQuotationWithCost,     // ✅ New
  getQuotationPdfData         // ✅ New
} from '../controllers/quotation.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// ✅ Print Routes
router.get('/print/:id/without-cost', printQuotationWithoutCost);
router.get('/print/:id/with-cost', printQuotationWithCost);
router.get('/print/:id/data', getQuotationPdfData);

// Get quotations by customer
router.get('/customer/:customerId', getQuotationsByCustomer);

// Create and get all quotations
router.route('/')
  .post(uploadImages, createQuotation)
  .get(getAllQuotations);

// Update status
router.patch('/:id/status', updateQuotationStatus);

// Delete image
router.delete('/:quotationId/images/:imageId', deleteQuotationImage);

// Get, update, delete single quotation
router.route('/:id')
  .get(getQuotationById)
  .put(uploadImages, updateQuotation)
  .delete(deleteQuotation);

export default router;