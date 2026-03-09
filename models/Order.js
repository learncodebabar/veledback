import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  // ========== Customer Information ==========
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Customer",
    required: true
  },
  // No need for customerName, customerPhone, customerAddress fields
  // You can get this info from the referenced Customer document

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
// FIXED: Remove 'next' parameter completely when using async/await
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
    
    // DON'T call next() - it's not needed and causes errors
    // Just let the function complete naturally
    
  } catch (error) {
    console.error("❌ Error in order pre-save middleware:", error);
    // If you need to throw the error, just throw it
    throw error;
  }
});

// ========== Post-save Middleware ==========
orderSchema.post('save', function(doc) {
  console.log("📦 Order saved successfully:", doc._id);
  console.log("   Bill Number:", doc.billNumber);
  // No next() needed here either
});

const Order = mongoose.model("Order", orderSchema);
export default Order;