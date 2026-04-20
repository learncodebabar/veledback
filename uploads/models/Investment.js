const mongoose = require('mongoose');

const investmentSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0, 'Amount cannot be negative']
  },
  investmentType: {
    type: String,
    required: [true, 'Investment type is required'],
    enum: ['owner', 'partner', 'loan'],
    default: 'owner'
  },
  source: {
    type: String,
    required: [true, 'Source is required'],
    enum: ['personal', 'bank', 'other'],
    default: 'personal'
  },
  description: {
    type: String,
    trim: true,
    default: ''
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
  notes: {
    type: String,
    trim: true,
    default: ''
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'cancelled'],
    default: 'completed'
  },
  isOwnerInvestment: {
    type: Boolean,
    default: true
  },
  addedBy: {
    type: String,
    default: 'admin'
  },
  transactionType: {
    type: String,
    enum: ['credit', 'debit'],
    default: 'credit'
  },
  // Reference to user who added this investment
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // For loan tracking (if investmentType is 'loan')
  loanDetails: {
    interestRate: Number,
    repaymentPeriod: String,
    dueDate: Date,
    remainingAmount: Number
  }
}, {
  timestamps: true
});

// Index for better query performance
investmentSchema.index({ date: -1 });
investmentSchema.index({ investmentType: 1 });
investmentSchema.index({ status: 1 });

const Investment = mongoose.model('Investment', investmentSchema);

module.exports = Investment;