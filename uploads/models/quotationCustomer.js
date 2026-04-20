import mongoose from "mongoose";

const quotationCustomerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Customer name is required"],
    trim: true
  },
  phone: {
    type: String,
    required: [true, "Phone number is required"],
    trim: true,
    validate: {
      validator: function(v) {
        return /^\d{11}$/.test(v.replace(/\D/g, ''));
      },
      message: props => `${props.value} is not a valid phone number!`
    }
  },
  address: {
    type: String,
   
  },
  totalQuotations: {
    type: Number,
    default: 0
  },
  lastQuotationDate: {
    type: Date,
    default: null
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  }
}, {
  timestamps: true
});

const QuotationCustomer = mongoose.model('QuotationCustomer', quotationCustomerSchema);
export default QuotationCustomer;