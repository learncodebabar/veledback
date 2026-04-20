import mongoose from "mongoose";

const quotationMaterialSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Material name is required"],
    trim: true
  },
  unit: {
    type: String,
    required: [true, "Unit is required"],
    enum: ['piece', 'kg', 'meter', 'feet', 'inch', 'liter', 'dozen', 'box', 'pack'],
    default: 'piece'
  },
  price: {
    type: Number,
    required: [true, "Price is required"],
    min: 0
  },
  description: {
    type: String,
    default: ''
  },
  category: {
    type: String,
    default: 'General'
  },
  // Track usage count for popular materials
  usageCount: {
    type: Number,
    default: 0
  },
  // Who created this material
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Admin",
    required: true
  },
  createdByAdmin: {
    type: String,
    required: true
  },
  // Status
  isActive: {
    type: Boolean,
    default: true
  }
}, { 
  timestamps: true 
});

// Compound index for unique name per admin
quotationMaterialSchema.index({ name: 1, createdBy: 1 }, { unique: true });

// Text index for search
quotationMaterialSchema.index({ name: 'text', description: 'text', category: 'text' });

const QuotationMaterial = mongoose.model("QuotationMaterial", quotationMaterialSchema);
export default QuotationMaterial;