import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  // ========== Customer Information ==========
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Customer",
    required: true
  },

  // ========== Payment Details ==========
  finalTotal: {
    type: Number,
    required: true,
    min: 0
  },
  advancePayment: {
    type: Number,
    default: 0,
    min: 0
  },
  remainingBalance: {
    type: Number,
    default: 0,
    min: 0
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'partial', 'paid'],
    default: 'pending'
  },
  payments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Payment"
  }],

  // ========== Order Details ==========
  billNumber: {
    type: String,
    required: true,
    unique: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  // ✅ NEW: Due Date field
  dueDate: {
    type: Date,
    required: false, // Optional field
    default: null
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed'],
    default: 'pending'
  },

  // ========== Notes ==========
  notes: {
    type: String,
    default: ''
  },

  // ========== Timestamps ==========
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { 
  timestamps: true 
});

// ========== Pre-save Middleware ==========
orderSchema.pre('save', async function() {
  try {
    console.log("🔄 Order pre-save middleware running for:", this._id || 'new order');
    
    // Calculate remaining balance
    this.remainingBalance = (this.finalTotal || 0) - (this.advancePayment || 0);
    
    // Update payment status
    if (this.advancePayment >= this.finalTotal) {
      this.paymentStatus = 'paid';
    } else if (this.advancePayment > 0) {
      this.paymentStatus = 'partial';
    } else {
      this.paymentStatus = 'pending';
    }
    
    // Update updatedAt
    this.updatedAt = new Date();
    
    console.log("✅ Order pre-save completed");
    console.log("   Final Total:", this.finalTotal);
    console.log("   Advance:", this.advancePayment);
    console.log("   Remaining:", this.remainingBalance);
    console.log("   Payment Status:", this.paymentStatus);
    console.log("   Due Date:", this.dueDate);
    
  } catch (error) {
    console.error("❌ Error in order pre-save middleware:", error);
    throw error;
  }
});

// ========== Post-save Middleware ==========
orderSchema.post('save', function(doc) {
  console.log("📦 Order saved successfully:", doc._id);
  console.log("   Bill Number:", doc.billNumber);
  console.log("   Due Date:", doc.dueDate);
});

const Order = mongoose.model("Order", orderSchema);
export default Order;