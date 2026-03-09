import express from "express";
import { 
  registerAdmin, 
  loginAdmin, 
  getAdminProfile,
  updateAdminProfile,
  changePassword ,checkAdminExists  

} from "../controllers/adminController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// Public routes
router.post("/signup", registerAdmin);
router.post("/login", loginAdmin);

// Protected routes (require token)
router.get("/profile", protect, getAdminProfile);
router.put("/update-profile", protect, updateAdminProfile);
router.put("/change-password", protect, changePassword);
router.get('/check-exists', checkAdminExists);
export default router;