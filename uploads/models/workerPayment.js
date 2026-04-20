import mongoose from 'mongoose';

const workerPaymentSchema = new mongoose.Schema({
  laborId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Labor',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  method: {
    type: String,
    required: true,
    enum: ['Cash', 'Bank Transfer', 'Cheque', 'Online Payment']
  },
  note: {
    type: String,
    default: ''
  },
  month: {
    type: Number,
    required: true
  },
  year: {
    type: Number,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

const WorkerPayment = mongoose.model('WorkerPayment', workerPaymentSchema);
export default WorkerPayment;