import mongoose from "mongoose";

// ========== Payment Subschema ==========
const paymentSchema = new mongoose.Schema({
  amount: { type: Number, required: true, min: 0 },
  paymentMethod: {
    type: String,
    enum: ["cash", "bank_transfer", "credit_card", "debit_card", "online"],
    default: "cash"
  },
  date: { type: Date, default: Date.now },
  notes: { type: String, default: "" }
}, { timestamps: true });

// ========== Main Order Schema ==========
const orderSchema = new mongoose.Schema({
  customer: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true },
  items: [{
    itemName: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1, default: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    totalPrice: { type: Number, required: true, min: 0 },
    notes: { type: String, default: '' }
  }],
  finalTotal: { type: Number, required: true, min: 0 },
  advancePayment: { type: Number, default: 0, min: 0 },
  remainingBalance: { type: Number, default: 0, min: 0 },
  paymentStatus: { type: String, enum: ['pending','partial','paid'], default: 'pending' },
  payments: [paymentSchema],
  billNumber: { type: String, required: true, unique: true },
  date: { type: Date, default: Date.now },
  dueDate: { type: Date, default: null },
  status: { type: String, enum: ['pending','in-progress','completed'], default: 'pending' },
  notes: { type: String, default: '' },
  quotationId: { type: mongoose.Schema.Types.ObjectId, ref: "Quotation", required: false }
}, { timestamps: true });

// ========== Methods ==========
orderSchema.methods.calculateTotalPaid = function() {
  const paymentsTotal = this.payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  return (this.advancePayment || 0) + paymentsTotal;
};

orderSchema.methods.updatePaymentStatus = function() {
  const totalPaid = this.calculateTotalPaid();
  const finalTotal = this.finalTotal || 0;

  this.remainingBalance = Math.max(finalTotal - totalPaid, 0);

  if (this.remainingBalance <= 0) this.paymentStatus = 'paid';
  else if (totalPaid > 0) this.paymentStatus = 'partial';
  else this.paymentStatus = 'pending';

  this.updatedAt = new Date();

  return {
    totalPaid,
    remainingBalance: this.remainingBalance,
    paymentStatus: this.paymentStatus
  };
};

// ========== Pre-save Middleware ==========
orderSchema.pre('save', async function() {
  console.log("🔄 Saving order:", this.billNumber);

  if (this.isNew) {
    const roundedAdvance = Math.round((this.advancePayment || 0) * 100) / 100;
    const roundedFinalTotal = Math.round((this.finalTotal || 0) * 100) / 100;

    this.remainingBalance = Math.max(roundedFinalTotal - roundedAdvance, 0);

    if (roundedAdvance >= roundedFinalTotal) this.paymentStatus = 'paid';
    else if (roundedAdvance > 0) this.paymentStatus = 'partial';
    else this.paymentStatus = 'pending';
  }
});

const Order = mongoose.model("Order", orderSchema);
export default Order;