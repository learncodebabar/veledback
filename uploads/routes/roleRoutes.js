import express from 'express';
import {
  createRole,
  getAllRoles,
  getRoleById,
  updateRole,
  deleteRole,
  sendOtp,
  verifyOtpAndLogin,
  resendOtp,
  roleLogin  // ← یہ شامل کریں
} from '../controllers/roleController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// OTP Authentication Routes
router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtpAndLogin);
router.post('/resend-otp', resendOtp);

// Traditional login (backward compatibility)
router.post('/login', roleLogin);  // ← اب یہ کام کرے گا

// Protected routes (admin only)
router.post('/', protect, createRole);
router.get('/', protect, getAllRoles);
router.get('/:id', protect, getRoleById);
router.put('/:id', protect, updateRole);
router.delete('/:id', protect, deleteRole);

export default router;