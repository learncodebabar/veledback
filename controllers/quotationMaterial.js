import QuotationMaterial from "../models/quotationMaterial.js";

// ✅ Create new quotation material
export const createQuotationMaterial = async (req, res) => {
  try {
    console.log("📦 Creating quotation material:", req.body);

    const { name, unit, price, description, category } = req.body;
    
    // Validation
    if (!name || !unit || !price) {
      return res.status(400).json({
        success: false,
        message: "Name, unit and price are required"
      });
    }

    // Get admin info from auth middleware
    const adminId = req.admin._id;
    const adminName = req.admin.name;
    
    // Check if material already exists for this admin
    const existingMaterial = await QuotationMaterial.findOne({ 
      name: { $regex: new RegExp(`^${name}$`, 'i') },
      createdBy: adminId 
    });
    
    if (existingMaterial) {
      // Update price and increment usage count
      existingMaterial.price = price;
      existingMaterial.unit = unit || existingMaterial.unit;
      existingMaterial.description = description || existingMaterial.description;
      existingMaterial.category = category || existingMaterial.category;
      existingMaterial.usageCount += 1;
      existingMaterial.updatedAt = Date.now();
      
      await existingMaterial.save();
      
      return res.status(200).json({
        success: true,
        message: "Material updated successfully",
        data: existingMaterial
      });
    }
    
    // Create new material
    const material = await QuotationMaterial.create({
      name,
      unit,
      price,
      description: description || '',
      category: category || 'General',
      createdBy: adminId,
      createdByAdmin: adminName,
      usageCount: 1
    });
    
    res.status(201).json({
      success: true,
      message: "Material created successfully",
      data: material
    });
    
  } catch (error) {
    console.error("❌ Error creating quotation material:", error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Material with this name already exists"
      });
    }
    
    // Handle validation errors
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(", ")
      });
    }
    
    res.status(500).json({
      success: false,
      message: error.message || "Error creating material"
    });
  }
};

// ✅ Get all quotation materials
export const getAllQuotationMaterials = async (req, res) => {
  try {
    const adminId = req.admin._id;
    
    const materials = await QuotationMaterial.find({ 
      createdBy: adminId,
      isActive: true 
    })
    .sort({ usageCount: -1, name: 1 });
    
    res.status(200).json({
      success: true,
      count: materials.length,
      data: materials
    });
    
  } catch (error) {
    console.error("❌ Error fetching quotation materials:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ✅ Search quotation materials
export const searchQuotationMaterials = async (req, res) => {
  try {
    const { query } = req.query;
    const adminId = req.admin._id;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        message: "Search query is required"
      });
    }
    
    const materials = await QuotationMaterial.find({
      createdBy: adminId,
      isActive: true,
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { category: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } }
      ]
    })
    .sort({ usageCount: -1 })
    .limit(20);
    
    res.status(200).json({
      success: true,
      data: materials
    });
    
  } catch (error) {
    console.error("❌ Error searching quotation materials:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ✅ Get quotation material by ID
export const getQuotationMaterialById = async (req, res) => {
  try {
    const material = await QuotationMaterial.findById(req.params.id);
    
    if (!material) {
      return res.status(404).json({
        success: false,
        message: "Material not found"
      });
    }
    
    // Check if material belongs to this admin
    if (material.createdBy.toString() !== req.admin._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to access this material"
      });
    }
    
    res.status(200).json({
      success: true,
      data: material
    });
    
  } catch (error) {
    console.error("❌ Error fetching quotation material:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ✅ Update quotation material
export const updateQuotationMaterial = async (req, res) => {
  try {
    const material = await QuotationMaterial.findById(req.params.id);
    
    if (!material) {
      return res.status(404).json({
        success: false,
        message: "Material not found"
      });
    }
    
    // Check if material belongs to this admin
    if (material.createdBy.toString() !== req.admin._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this material"
      });
    }
    
    const { name, unit, price, description, category } = req.body;
    
    // If name is being changed, check for duplicates
    if (name && name !== material.name) {
      const existingMaterial = await QuotationMaterial.findOne({
        name: { $regex: new RegExp(`^${name}$`, 'i') },
        createdBy: req.admin._id,
        _id: { $ne: req.params.id }
      });
      
      if (existingMaterial) {
        return res.status(400).json({
          success: false,
          message: "Material with this name already exists"
        });
      }
    }
    
    material.name = name || material.name;
    material.unit = unit || material.unit;
    material.price = price || material.price;
    material.description = description !== undefined ? description : material.description;
    material.category = category || material.category;
    material.updatedAt = Date.now();
    
    await material.save();
    
    res.status(200).json({
      success: true,
      message: "Material updated successfully",
      data: material
    });
    
  } catch (error) {
    console.error("❌ Error updating quotation material:", error);
    
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(", ")
      });
    }
    
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ✅ Delete quotation material (soft delete)
export const deleteQuotationMaterial = async (req, res) => {
  try {
    const material = await QuotationMaterial.findById(req.params.id);
    
    if (!material) {
      return res.status(404).json({
        success: false,
        message: "Material not found"
      });
    }
    
    // Check if material belongs to this admin
    if (material.createdBy.toString() !== req.admin._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this material"
      });
    }
    
    // Soft delete
    material.isActive = false;
    await material.save();
    
    res.status(200).json({
      success: true,
      message: "Material deleted successfully"
    });
    
  } catch (error) {
    console.error("❌ Error deleting quotation material:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ✅ Get popular quotation materials
export const getPopularQuotationMaterials = async (req, res) => {
  try {
    const adminId = req.admin._id;
    
    const materials = await QuotationMaterial.find({ 
      createdBy: adminId,
      isActive: true 
    })
    .sort({ usageCount: -1 })
    .limit(20);
    
    res.status(200).json({
      success: true,
      data: materials
    });
    
  } catch (error) {
    console.error("❌ Error fetching popular quotation materials:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ✅ Increment material usage count
export const incrementMaterialUsage = async (materialId) => {
  try {
    await QuotationMaterial.findByIdAndUpdate(materialId, {
      $inc: { usageCount: 1 }
    });
  } catch (error) {
    console.error("❌ Error incrementing material usage:", error);
  }
};