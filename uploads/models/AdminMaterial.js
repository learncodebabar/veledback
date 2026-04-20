import mongoose from "mongoose";

const adminMaterialSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: [true, "Material name is required"],
    trim: true,
    unique: true
  },
  price: {
    type: Number,
    required: [true, "Price is required"],
    min: [0, "Price cannot be negative"]
  },
  unit: {
    type: String,
    required: [true, "Unit is required"],
    enum: ['piece', 'kg', 'meter', 'feet', 'inch', 'liter', 'dozen', 'box', 'pack'],
    default: 'piece'
  },
  description: {
    type: String,
    default: ""
  },
  category: {
    type: String,
    default: "General",
    trim: true
  },
  
  // Stock Information
  stock: {
    type: Number,
    default: 0,
    min: 0
  },
  minStock: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Additional Info
  hsnCode: {
    type: String,
    default: ""
  },
  taxRate: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  
  // Images
  images: [{
    url: String,
    description: String
  }],
  
  // Usage tracking
  usageCount: {
    type: Number,
    default: 0
  },
  
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Metadata
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Admin",
    required: true
  },
  createdByAdmin: {
    type: String,
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Admin"
  }
}, {
  timestamps: true
});

// Indexes for search
adminMaterialSchema.index({ name: 'text', description: 'text', category: 'text', hsnCode: 'text' });
adminMaterialSchema.index({ price: 1 });
adminMaterialSchema.index({ usageCount: -1 });

const AdminMaterial = mongoose.model("AdminMaterial", adminMaterialSchema);
export default AdminMaterial;