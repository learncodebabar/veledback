import express from 'express';
import {
  createRole,
  getAllRoles,
  getRoleById,
  updateRole,
  deleteRole,
  roleLogin
} from '../controllers/roleController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Public route for role login
router.post('/login', roleLogin);

// Protected routes (require admin authentication)
router.post('/', protect, createRole);
router.get('/', protect, getAllRoles);
router.get('/:id', protect, getRoleById);
router.put('/:id', protect, updateRole);
router.delete('/:id', protect, deleteRole);

export default router;