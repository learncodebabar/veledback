import mongoose from 'mongoose';

const adminExpenseSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0, 'Amount cannot be negative']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['rent', 'utilities', 'salaries', 'marketing', 'supplies', 'transport', 'maintenance', 'other'],
    default: 'other'
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
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
  status: {
    type: String,
    enum: ['paid', 'pending', 'cancelled'],
    default: 'paid'
  },
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  addedByName: {
    type: String,
    default: 'admin'
  },
  receiptUrl: {
    type: String,
    default: null
  },
  receiptFileName: {
    type: String,
    default: null
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  },
  isTaxDeductible: {
    type: Boolean,
    default: false
  },
  taxPercentage: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurringFrequency: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'yearly', null],
    default: null
  },
  recurringEndDate: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Indexes for better query performance
adminExpenseSchema.index({ date: -1 });
adminExpenseSchema.index({ category: 1 });
adminExpenseSchema.index({ status: 1 });
adminExpenseSchema.index({ amount: -1 });

const AdminExpense = mongoose.model('AdminExpense', adminExpenseSchema);

export default AdminExpense;