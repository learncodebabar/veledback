import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  createMaterial,
  getAllMaterials,
  getMaterialById,
  updateMaterial,
  deleteMaterial,
  searchMaterials,
  getLowStockMaterials,
  bulkDeleteMaterials
} from '../controllers/AdminMaterial.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Search route (must come before /:id)
router.get('/search', searchMaterials);

// Low stock route
router.get('/low-stock', getLowStockMaterials);

// Bulk operations
router.delete('/bulk', bulkDeleteMaterials);

// Main routes
router.route('/')
  .post(createMaterial)
  .get(getAllMaterials);

// Single material routes
router.route('/:id')
  .get(getMaterialById)
  .put(updateMaterial)
  .delete(deleteMaterial);

export default router; // Make sure this line exists