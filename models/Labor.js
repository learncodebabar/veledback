import mongoose from 'mongoose';

const laborSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  fatherName: {
    type: String,
    required: true,
    trim: true
  },
  cnic: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  mobile: {
    type: String,
    required: true,
    trim: true
  },
  paymentType: {
    type: String,
    enum: ['Per Day', 'Monthly'],
    required: true,
    default: 'Monthly'
  },
  perDayRate: {
    type: Number,
    default: 0
  },
  monthlySalary: {
    type: Number,
    default: 0
  },
  dailyWage: {
    type: Number,
    default: 0
  },
  designation: {
    type: String,
    default: 'Labor'
  },
  joiningDate: {
    type: Date,
    default: Date.now
  },
  presentAddress: {
    type: String,
    default: ''
  },
  city: {
    type: String,
    default: 'Lahore'
  },
  employmentStatus: {
    type: String,
    default: 'Active'
  }
}, {
  timestamps: true
});

// ❌ کوئی middleware نہیں
// سارا کام routes میں کریں گے

const Labor = mongoose.model('Labor', laborSchema);
export default Labor;