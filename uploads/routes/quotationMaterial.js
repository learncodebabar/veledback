import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  createQuotationMaterial,
  getAllQuotationMaterials,
  getQuotationMaterialById,
  updateQuotationMaterial,
  deleteQuotationMaterial,
  searchQuotationMaterials,
  getPopularQuotationMaterials
} from '../controllers/quotationMaterial.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Special routes (must come before /:id)
router.get('/search', searchQuotationMaterials);
router.get('/popular', getPopularQuotationMaterials);

// Main routes
router.route('/')
  .post(createQuotationMaterial)
  .get(getAllQuotationMaterials);

// Single material routes
router.route('/:id')
  .get(getQuotationMaterialById)
  .put(updateQuotationMaterial)
  .delete(deleteQuotationMaterial);

export default router;