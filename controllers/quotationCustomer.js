// backend/controllers/quotationCustomerController.js
import QuotationCustomer from "../models/quotationCustomer.js";
import Quotation from "../models/quotation.js";

// ✅ Create Quotation Customer
export const createQuotationCustomer = async (req, res) => {
  try {
    console.log("📝 Creating quotation customer:", req.body);

    // Validate required fields
    if (!req.body.name || !req.body.name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Customer name is required"
      });
    }

    if (!req.body.phone || !req.body.phone.trim()) {
      return res.status(400).json({
        success: false,
        message: "Phone number is required"
      });
    }

    // Check if customer exists with same phone
    const existingCustomer = await QuotationCustomer.findOne({ 
      phone: req.body.phone 
    });

    if (existingCustomer) {
      return res.status(400).json({
        success: false,
        message: "Customer with this phone number already exists"
      });
    }

    // Get admin info
    const adminId = req.admin._id;
    const adminName = req.admin.name;

    // Create new customer
    const customer = await QuotationCustomer.create({
      name: req.body.name.trim(),
      phone: req.body.phone.trim(),
      address: req.body.address ? req.body.address.trim() : "",
      createdBy: adminId,
      createdByAdmin: adminName,
      isActive: true,
      totalQuotations: 0
    });

    res.status(201).json({
      success: true,
      message: "Quotation customer created successfully",
      data: customer
    });

  } catch (error) {
    console.error("❌ Error creating quotation customer:", error);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Customer with this phone number already exists"
      });
    }

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(", ")
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || "Error creating quotation customer"
    });
  }
};

// ✅ Get All Quotation Customers
export const getAllQuotationCustomers = async (req, res) => {
  try {
    const adminId = req.admin._id;

    const customers = await QuotationCustomer.find({ 
      createdBy: adminId,
      isActive: true 
    })
    .sort({ createdAt: -1 });

    // Get quotation counts for each customer
    const customersWithStats = await Promise.all(
      customers.map(async (customer) => {
        const quotationsCount = await Quotation.countDocuments({ 
          customer: customer._id 
        });
        
        return {
          ...customer.toObject(),
          quotationsCount
        };
      })
    );

    res.status(200).json({
      success: true,
      count: customers.length,
      data: customersWithStats
    });

  } catch (error) {
    console.error("❌ Error fetching quotation customers:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error fetching quotation customers"
    });
  }
};

// ✅ Get Single Quotation Customer
export const getQuotationCustomerById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const customer = await QuotationCustomer.findById(id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Quotation customer not found"
      });
    }

    // Check if customer belongs to this admin
    if (customer.createdBy.toString() !== req.admin._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to access this customer"
      });
    }

    // Get all quotations for this customer
    const quotations = await Quotation.find({ customer: customer._id })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: {
        ...customer.toObject(),
        quotations
      }
    });

  } catch (error) {
    console.error("❌ Error fetching quotation customer:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error fetching quotation customer"
    });
  }
};

// ✅ Update Quotation Customer
export const updateQuotationCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const customer = await QuotationCustomer.findById(id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Quotation customer not found"
      });
    }

    // Check if customer belongs to this admin
    if (customer.createdBy.toString() !== req.admin._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this customer"
      });
    }

    // Check phone uniqueness if changed
    if (req.body.phone && req.body.phone !== customer.phone) {
      const existingCustomer = await QuotationCustomer.findOne({ 
        phone: req.body.phone 
      });
      
      if (existingCustomer) {
        return res.status(400).json({
          success: false,
          message: "Customer with this phone number already exists"
        });
      }
    }

    // Prepare update data
    const updateData = {};
    
    if (req.body.name !== undefined) updateData.name = req.body.name.trim();
    if (req.body.phone !== undefined) updateData.phone = req.body.phone.trim();
    if (req.body.address !== undefined) updateData.address = req.body.address.trim();
    updateData.updatedBy = req.admin._id;
    updateData.updatedAt = new Date();

    // Update customer
    const updatedCustomer = await QuotationCustomer.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: "Quotation customer updated successfully",
      data: updatedCustomer
    });

  } catch (error) {
    console.error("❌ Error updating quotation customer:", error);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Customer with this phone number already exists"
      });
    }

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(", ")
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || "Error updating quotation customer"
    });
  }
};

// ✅ Delete Quotation Customer (Soft Delete)
export const deleteQuotationCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const customer = await QuotationCustomer.findById(id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Quotation customer not found"
      });
    }

    // Check if customer belongs to this admin
    if (customer.createdBy.toString() !== req.admin._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this customer"
      });
    }

    // Check if customer has quotations
    const quotationsCount = await Quotation.countDocuments({ 
      customer: customer._id 
    });

    if (quotationsCount > 0) {
      // Soft delete - just mark as inactive
      customer.isActive = false;
      await customer.save();
      
      return res.status(200).json({
        success: true,
        message: "Quotation customer deactivated successfully"
      });
    } else {
      // Hard delete - no quotations
      await customer.deleteOne();
      
      return res.status(200).json({
        success: true,
        message: "Quotation customer deleted successfully"
      });
    }

  } catch (error) {
    console.error("❌ Error deleting quotation customer:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error deleting quotation customer"
    });
  }
};

// ✅ Search Quotation Customers
export const searchQuotationCustomers = async (req, res) => {
  try {
    const { query } = req.query;
    const adminId = req.admin._id;

    if (!query || query.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Search query is required"
      });
    }

    const customers = await QuotationCustomer.find({
      createdBy: adminId,
      isActive: true,
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { phone: { $regex: query, $options: 'i' } }
      ]
    })
    .sort({ createdAt: -1 })
    .limit(20);

    res.status(200).json({
      success: true,
      data: customers
    });

  } catch (error) {
    console.error("❌ Error searching quotation customers:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error searching quotation customers"
    });
  }
};

// ✅ Update Quotation Stats (when quotation is created)
export const updateQuotationStats = async (customerId) => {
  try {
    const quotationsCount = await Quotation.countDocuments({ 
      customer: customerId 
    });

    const lastQuotation = await Quotation.findOne({ customer: customerId })
      .sort({ createdAt: -1 });

    await QuotationCustomer.findByIdAndUpdate(customerId, {
      totalQuotations: quotationsCount,
      lastQuotationDate: lastQuotation?.createdAt || null
    });

  } catch (error) {
    console.error("❌ Error updating quotation stats:", error);
  }
};

// ✅ Get Quotation Customer by Phone Number
export const getQuotationCustomerByPhone = async (req, res) => {
  try {
    const { phone } = req.params;
    const adminId = req.admin._id;

    console.log(`🔍 Searching for customer with phone: ${phone}`);

    if (!phone || phone.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Phone number is required"
      });
    }

    // Clean phone number (remove special characters)
    const cleanPhone = phone.replace(/\D/g, '');
    
    // Find customer by phone number and admin
    const customer = await QuotationCustomer.findOne({ 
      phone: { $regex: cleanPhone, $options: 'i' },
      createdBy: adminId,
      isActive: true 
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found with this phone number"
      });
    }

    // Get quotations for this customer
    const quotations = await Quotation.find({ 
      customer: customer._id 
    }).sort({ createdAt: -1 }).limit(10);

    res.status(200).json({
      success: true,
      data: {
        ...customer.toObject(),
        quotations
      }
    });

  } catch (error) {
    console.error("❌ Error fetching customer by phone:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error fetching customer by phone"
    });
  }
};