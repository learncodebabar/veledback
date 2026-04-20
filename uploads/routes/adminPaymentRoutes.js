import express from 'express';
const router = express.Router();
import { protect } from "../middleware/auth.js"; // ✅ Sirf protect import kiya
import {
  getAdminPayments,
  createAdminPayment,
  getAdminPaymentById,
  updateAdminPayment,
  deleteAdminPayment,
  getPaymentStats
} from '../controllers/adminPaymentController.js';

// All routes are protected (sirf authenticate user chahiye, admin role nahi)
router.route('/')
  .get(protect, getAdminPayments)
  .post(protect, createAdminPayment);

router.route('/stats/summary')
  .get(protect, getPaymentStats);

router.route('/:id')
  .get(protect, getAdminPaymentById)
  .put(protect, updateAdminPayment)
  .delete(protect, deleteAdminPayment);

export default router;