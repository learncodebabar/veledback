import express from "express";
import {
  createCustomer,
  getAllCustomers,
  getSingleCustomer,
  updateCustomer,
  deleteCustomer
} from "../controllers/customerController.js";

import { protect } from "../middleware/auth.js";

const router = express.Router();

// ✅ Create Customer
router.post("/", protect, createCustomer);

// ✅ Get All Customers
router.get("/", protect, getAllCustomers);

// ✅ Get Single Customer + Jobs
router.get("/:id", protect, getSingleCustomer);

// ✅ Update Customer
router.put("/:id", protect, updateCustomer);

// ✅ Delete Customer
router.delete("/:id", protect, deleteCustomer);

export default router;