import mongoose from "mongoose";

// Schema for individual material within a quotation item
const quotationMaterialSchema = new mongoose.Schema({
  materialId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "QuotationMaterial",
    default: null
  },
  name: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  unit: {
    type: String,
    enum: ['piece', 'kg', 'meter', 'feet', 'inch', 'liter', 'dozen', 'box', 'pack'],
    default: 'piece'
  },
  pricePerUnit: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  totalPrice: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  }
});

// Schema for quotation item
const quotationItemSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    default: 'Quotation Item'
  },
  notes: {
    type: String,
    default: ''
  },
  materials: [quotationMaterialSchema],
  subtotal: {
    type: Number,
    required: true,
    default: 0
  }
});

const quotationSchema = new mongoose.Schema({
  // Quotation Number
  quotationNumber: {
    type: String,
    unique: true,
    sparse: true
  },
  
  // Customer Information
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "QuotationCustomer",
    required: true
  },
  customerName: {
    type: String,
    required: true
  },
  customerPhone: {
    type: String,
    required: true
  },
  customerAddress: {
    type: String,
    default: ''
  },
  
  // Images
  images: [{
    url: String,
    filename: String,
    description: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Quotation Items
  items: [quotationItemSchema],
  
  // Totals
  grandTotal: {
    type: Number,
    required: true,
    default: 0
  },
  
  // ✅ NEW: Estimate Fields
  estimate: {
    low: {
      type: Number,
      default: 0
    },
    medium: {
      type: Number,
      default: 0
    },
    high: {
      type: Number,
      default: 0
    }
  },
  
  // Status
  status: {
    type: String,
    enum: ['draft', 'sent', 'accepted', 'rejected', 'expired'],
    default: 'draft'
  },
  
  // Validity
  validUntil: {
    type: Date,
    default: () => new Date(+new Date() + 30*24*60*60*1000)
  },
  
  // Notes
  notes: {
    type: String,
    default: ''
  },
  termsAndConditions: {
    type: String,
    default: '1. All prices are subject to change without notice.\n2. Delivery charges extra.\n3. Payment terms: 50% advance, 50% before delivery.'
  },
  
  // Created by
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  },
  createdByAdmin: {
    type: String,
    required: true
  }
}, { 
  timestamps: true 
});

const Quotation = mongoose.model('Quotation', quotationSchema);
export default Quotation;