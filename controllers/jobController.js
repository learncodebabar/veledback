import Job from "../models/Job.js";
import Customer from "../models/Customer.js";
import mongoose from "mongoose";

// ✅ 1️⃣ Create Job
export const createJob = async (req, res) => {
  try {
    const {
      customer,
      works,
      materials,
      total,
      billNumber,
      date,
      estimatedAmounts
    } = req.body;

    if (!customer || !total || !billNumber || !date) {
      return res.status(400).json({ message: "Required fields missing" });
    }

    const existingCustomer = await Customer.findById(customer);
    if (!existingCustomer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    const jobData = {
      customer,
      works,
      materials,
      total,
      billNumber,
      date
    };

    // Add estimatedAmounts only if valid
    if (estimatedAmounts) {
      const filteredEstimates = {};

      if (estimatedAmounts.low) filteredEstimates.low = estimatedAmounts.low;
      if (estimatedAmounts.medium) filteredEstimates.medium = estimatedAmounts.medium;
      if (estimatedAmounts.high) filteredEstimates.high = estimatedAmounts.high;

      if (Object.keys(filteredEstimates).length > 0) {
        jobData.estimatedAmounts = filteredEstimates;
      }
    }

    const job = await Job.create(jobData);

    res.status(201).json(job);

  } catch (err) {
    console.log("CREATE JOB ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};

// ✅ 2️⃣ Get All Jobs
export const getJobs = async (req, res) => {
  try {
    const jobs = await Job.find()
      .populate("customer", "name phone address")
      .sort({ createdAt: -1 });

    res.json(jobs);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ✅ 3️⃣ Get Jobs By Customer ID
export const getJobsByCustomer = async (req, res) => {
  try {
    const { customerId } = req.params;

    const jobs = await Job.find({ customer: customerId })
      .sort({ createdAt: -1 });

    res.json(jobs);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ✅ 4️⃣ Get Single Job By ID
export const getJobById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid Job ID" });
    }

    const job = await Job.findById(id)
      .populate("customer", "name phone address");

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    res.json(job);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
// backend/controllers/jobController.js

// ✅ 5️⃣ Update Job - FIXED (remove new: true warning)
export const updateJob = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ 
        success: false,
        message: "Invalid Job ID" 
      });
    }

    const {
      works,
      materials,
      total,
      billNumber,
      date,
      estimatedAmounts
    } = req.body;

    // Find existing job
    const job = await Job.findById(id);
    if (!job) {
      return res.status(404).json({ 
        success: false,
        message: "Job not found" 
      });
    }

    // Prepare update data
    const updateData = {
      works,
      materials,
      total,
      billNumber,
      date
    };

    // Add estimatedAmounts only if valid
    if (estimatedAmounts) {
      const filteredEstimates = {};
      if (estimatedAmounts.low) filteredEstimates.low = estimatedAmounts.low;
      if (estimatedAmounts.medium) filteredEstimates.medium = estimatedAmounts.medium;
      if (estimatedAmounts.high) filteredEstimates.high = estimatedAmounts.high;

      if (Object.keys(filteredEstimates).length > 0) {
        updateData.estimatedAmounts = filteredEstimates;
      }
    }

    // ⚠️ FIXED: Use returnDocument: 'after' instead of new: true
    const updatedJob = await Job.findByIdAndUpdate(
      id,
      updateData,
      { 
        returnDocument: 'after',  // ✅ instead of new: true
        runValidators: true 
      }
    ).populate("customer", "name phone address");

    res.status(200).json({
      success: true,
      data: updatedJob,
      message: "Job updated successfully"
    });

  } catch (err) {
    console.log("UPDATE JOB ERROR:", err);
    res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
};

// ✅ 6️⃣ Delete Job
export const deleteJob = async (req, res) => {
  try {
    const { id } = req.params;

    const job = await Job.findById(id);

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    await job.deleteOne();

    res.json({ message: "Job deleted successfully" });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};