import express from "express";
import { 
  sendRegistrationOTP,
  verifyOTPAndRegister,
  resendRegistrationOTP,
  loginWithOTP,
  verifyLoginOTP,
  resendLoginOTP,
  registerAdmin, 
  loginAdmin, 
  getAdminProfile,
  updateAdminProfile,
  changePassword,
  checkAdminExists  
} from "../controllers/adminController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// ======================
// REGISTRATION OTP ROUTES
// ======================
router.post("/send-otp", sendRegistrationOTP);
router.post("/verify-otp", verifyOTPAndRegister);
router.post("/resend-otp", resendRegistrationOTP);

// ======================
// LOGIN OTP ROUTES
// ======================
router.post("/login-with-otp", loginWithOTP);
router.post("/verify-login-otp", verifyLoginOTP);
router.post("/resend-login-otp", resendLoginOTP);

// ======================
// TRADITIONAL ROUTES (Backward Compatibility)
// ======================
router.post("/signup", registerAdmin);
router.post("/login", loginAdmin);

// ======================
// PROTECTED ROUTES (Require Authentication)
// ======================
router.get("/profile", protect, getAdminProfile);
router.put("/update-profile", protect, updateAdminProfile);
router.put("/change-password", protect, changePassword);
router.get('/check-exists', checkAdminExists);

export default router;