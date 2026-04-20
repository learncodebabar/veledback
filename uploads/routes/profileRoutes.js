import express from "express";
import {
  getProfile,
  createProfile,
  updateProfile,
  deleteProfile
} from "../controllers/profileController.js";
import { upload } from "../middleware/upload.js";

const router = express.Router();

router.get("/", getProfile);
router.post("/", upload.single("logo"), createProfile);   // Only once
router.put("/", upload.single("logo"), updateProfile);
router.delete("/", deleteProfile);

export default router;