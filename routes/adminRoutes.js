// routes/adminRoutes.js
import express from "express";
import {
  registerAdmin,
  loginAdmin,
  checkAdminExists,
  getAdminProfile,
  updateAdminProfile,
  changePassword
} from "../controllers/adminController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// Public routes
router.post("/signup", registerAdmin);  // Changed from /register to /signup
router.post("/login", loginAdmin);
router.get("/check-exists", checkAdminExists);

// Protected routes
router.get("/profile", protect, getAdminProfile);
router.put("/profile", protect, updateAdminProfile);
router.put("/change-password", protect, changePassword);

export default router;