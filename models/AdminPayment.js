import mongoose from 'mongoose';

const adminPaymentSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0, 'Amount cannot be negative']
  },
  paymentType: {
    type: String,
    required: [true, 'Payment type is required'],
    enum: ['business', 'investment', 'loan', 'miscellaneous'],
    default: 'business'
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true
  },
  date: {
    type: Date,
    required: [true, 'Date is required'],
    default: Date.now
  },
  paymentMethod: {
    type: String,
    required: [true, 'Payment method is required'],
    enum: ['cash', 'bank_transfer', 'cheque', 'online'],
    default: 'cash'
  },
  reference: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'cancelled'],
    default: 'completed'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Make it optional if user might not be logged in
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Index for better query performance
adminPaymentSchema.index({ date: -1 });
adminPaymentSchema.index({ paymentType: 1 });
adminPaymentSchema.index({ status: 1 });

// ✅ IMPORTANT: Yeh ensure karein ke default export hai
const AdminPayment = mongoose.model('AdminPayment', adminPaymentSchema);
export default AdminPayment;``