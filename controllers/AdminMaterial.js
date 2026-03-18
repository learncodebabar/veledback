import AdminMaterial from "../models/AdminMaterial.js";

// ✅ Create Material
export const createMaterial = async (req, res) => {
  try {
    console.log("📝 Creating material:", req.body);

    // Validation
    if (!req.body.name || !req.body.name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Material name is required"
      });
    }

    if (!req.body.price || req.body.price <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid price is required"
      });
    }

    // Check if material exists with same name
    const existingMaterial = await AdminMaterial.findOne({ 
      name: req.body.name.trim()
    });

    if (existingMaterial) {
      return res.status(400).json({
        success: false,
        message: "Material with this name already exists"
      });
    }

    // Get admin info
    const adminId = req.admin._id;
    const adminName = req.admin.name;

    // Create new material
    const material = await AdminMaterial.create({
      name: req.body.name.trim(),
      price: parseFloat(req.body.price),
      unit: req.body.unit || 'piece',
      description: req.body.description || '',
      category: req.body.category || 'General',
      stock: req.body.stock ? parseInt(req.body.stock) : 0,
      minStock: req.body.minStock ? parseInt(req.body.minStock) : 0,
      hsnCode: req.body.hsnCode || '',
      taxRate: req.body.taxRate ? parseFloat(req.body.taxRate) : 0,
      createdBy: adminId,
      createdByAdmin: adminName
    });

    res.status(201).json({
      success: true,
      message: "Material created successfully",
      data: material
    });

  } catch (error) {
    console.error("❌ Error creating material:", error);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Material with this name already exists"
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
      message: error.message
    });
  }
};

// ✅ Get All Materials
export const getAllMaterials = async (req, res) => {
  try {
    const adminId = req.admin._id;
    const { 
      page = 1, 
      limit = 20, 
      search = '',
      category = '',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter
    const filter = { 
      createdBy: adminId,
      isActive: true 
    };

    // Search filter
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
        { hsnCode: { $regex: search, $options: 'i' } }
      ];
    }

    // Category filter
    if (category) {
      filter.category = category;
    }

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Sort
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Get materials
    const materials = await AdminMaterial.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limitNum);

    // Get total count
    const total = await AdminMaterial.countDocuments(filter);

    // Get unique categories for filter
    const categories = await AdminMaterial.distinct('category', { 
      createdBy: adminId,
      isActive: true 
    });

    res.status(200).json({
      success: true,
      data: materials,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalItems: total,
        itemsPerPage: limitNum
      },
      categories: categories
    });

  } catch (error) {
    console.error("❌ Error fetching materials:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ✅ Get Single Material
export const getMaterialById = async (req, res) => {
  try {
    const material = await AdminMaterial.findById(req.params.id);

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
    console.error("❌ Error fetching material:", error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: "Invalid material ID format"
      });
    }

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ✅ Update Material
export const updateMaterial = async (req, res) => {
  try {
    const material = await AdminMaterial.findById(req.params.id);

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

    // Check name uniqueness if changed
    if (req.body.name && req.body.name !== material.name) {
      const existingMaterial = await AdminMaterial.findOne({ 
        name: req.body.name 
      });
      
      if (existingMaterial) {
        return res.status(400).json({
          success: false,
          message: "Material with this name already exists"
        });
      }
    }

    // Prepare update data
    const updateData = {};
    
    if (req.body.name !== undefined) updateData.name = req.body.name.trim();
    if (req.body.price !== undefined) updateData.price = parseFloat(req.body.price);
    if (req.body.unit !== undefined) updateData.unit = req.body.unit;
    if (req.body.description !== undefined) updateData.description = req.body.description;
    if (req.body.category !== undefined) updateData.category = req.body.category;
    if (req.body.stock !== undefined) updateData.stock = parseInt(req.body.stock);
    if (req.body.minStock !== undefined) updateData.minStock = parseInt(req.body.minStock);
    if (req.body.hsnCode !== undefined) updateData.hsnCode = req.body.hsnCode;
    if (req.body.taxRate !== undefined) updateData.taxRate = parseFloat(req.body.taxRate);
    
    updateData.updatedBy = req.admin._id;

    // Update material
    const updatedMaterial = await AdminMaterial.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: "Material updated successfully",
      data: updatedMaterial
    });

  } catch (error) {
    console.error("❌ Error updating material:", error);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Material with this name already exists"
      });
    }

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(", ")
      });
    }

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: "Invalid material ID format"
      });
    }

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ✅ Delete Material (Soft Delete)
export const deleteMaterial = async (req, res) => {
  try {
    const material = await AdminMaterial.findById(req.params.id);

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
    console.error("❌ Error deleting material:", error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: "Invalid material ID format"
      });
    }

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ✅ Search Materials (for dropdown/autocomplete)
export const searchMaterials = async (req, res) => {
  try {
    const { query } = req.query;
    const adminId = req.admin._id;

    if (!query || query.length < 2) {
      return res.status(400).json({
        success: false,
        message: "Search query must be at least 2 characters"
      });
    }

    const materials = await AdminMaterial.find({
      createdBy: adminId,
      isActive: true,
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { category: { $regex: query, $options: 'i' } }
      ]
    })
    .sort({ usageCount: -1, name: 1 })
    .limit(10);

    res.status(200).json({
      success: true,
      data: materials
    });

  } catch (error) {
    console.error("❌ Error searching materials:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ✅ Update Usage Count (when material is used in quotation)
export const updateUsageCount = async (materialId) => {
  try {
    await AdminMaterial.findByIdAndUpdate(materialId, {
      $inc: { usageCount: 1 }
    });
  } catch (error) {
    console.error("❌ Error updating usage count:", error);
  }
};

// ✅ Get Low Stock Materials
export const getLowStockMaterials = async (req, res) => {
  try {
    const adminId = req.admin._id;

    const materials = await AdminMaterial.find({
      createdBy: adminId,
      isActive: true,
      $expr: { $lte: [ "$stock", "$minStock" ] }
    })
    .sort({ stock: 1 });

    res.status(200).json({
      success: true,
      data: materials
    });

  } catch (error) {
    console.error("❌ Error fetching low stock materials:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ✅ Bulk Delete Materials
export const bulkDeleteMaterials = async (req, res) => {
  try {
    const { materialIds } = req.body;
    const adminId = req.admin._id;

    if (!materialIds || !Array.isArray(materialIds) || materialIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide an array of material IDs"
      });
    }

    // Soft delete all materials
    const result = await AdminMaterial.updateMany(
      { 
        _id: { $in: materialIds },
        createdBy: adminId 
      },
      { 
        isActive: false,
        updatedBy: adminId
      }
    );

    res.status(200).json({
      success: true,
      message: `Successfully deleted ${result.modifiedCount} materials`,
      deletedCount: result.modifiedCount
    });

  } catch (error) {
    console.error("❌ Error bulk deleting materials:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};