import Customer from "../models/Customer.js";
import Job from "../models/Job.js";


// ✅ 1️⃣ Create Customer
export const createCustomer = async (req, res) => {
  try {
    const { name, phone, address } = req.body;

    if (!name || !phone || !address) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const customer = await Customer.create({
      name,
      phone,
      address
    });

    res.status(201).json(customer);

  } catch (err) {
    console.log("CREATE CUSTOMER ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};



// ✅ 2️⃣ Get All Customers
export const getAllCustomers = async (req, res) => {
  try {
    const customers = await Customer.find()
      .sort({ createdAt: -1 });

    res.json(customers);

  } catch (err) {
    console.log("GET ALL ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};



// ✅ 3️⃣ Get Single Customer + Jobs (CORRECT VERSION)
export const getSingleCustomer = async (req, res) => {
  try {
    const { id } = req.params;

    const customer = await Customer.findById(id);

    if (!customer) {
      return res.status(404).json({ 
        success: false,
        message: "Customer not found" 
      });
    }

    // customer ke jobs nikaal rahe hain
    const jobs = await Job.find({ customer: id })
      .sort({ createdAt: -1 });

    // Send response with proper structure
    res.status(200).json({
      success: true,
      customer: customer,
      jobs: jobs
    });

  } catch (err) {
    console.log("GET SINGLE ERROR:", err);
    res.status(500).json({ 
      success: false, 
      message: err.message 
    });
  }
};



// ✅ 4️⃣ Update Customer
export const updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, address } = req.body;

    const customer = await Customer.findById(id);

    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    customer.name = name || customer.name;
    customer.phone = phone || customer.phone;
    customer.address = address || customer.address;

    await customer.save();

    res.json(customer);

  } catch (err) {
    console.log("UPDATE ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};



// ✅ 5️⃣ Delete Customer (with jobs delete)
export const deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;

    const customer = await Customer.findById(id);

    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    // pehle us customer ke saare jobs delete kar rahe hain
    await Job.deleteMany({ customer: id });

    // phir customer delete
    await customer.deleteOne();

    res.json({ message: "Customer and related jobs deleted successfully" });

  } catch (err) {
    console.log("DELETE ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};