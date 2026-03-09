import express from "express";
import {
  createJob,
  getJobs,
  getJobsByCustomer,
  getJobById,
  updateJob,    // 🔥 ADD THIS IMPORT
  deleteJob
} from "../controllers/jobController.js";

import { protect } from "../middleware/auth.js";

const router = express.Router();

router.post("/", protect, createJob);
router.get("/", protect, getJobs);
router.get("/customer/:customerId", protect, getJobsByCustomer);
router.get("/:id", protect, getJobById);
router.put("/:id", protect, updateJob);  // 🔥 ADD THIS ROUTE
router.delete("/:id", protect, deleteJob);

export default router;