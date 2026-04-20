import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema({
  laborId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Labor',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['Present', 'Absent', 'Leave', 'Half Day', 'Overtime'],
    required: true
  },
  month: {
    type: Number,
    required: true
  },
  year: {
    type: Number,
    required: true
  },
}, {
  timestamps: true
});

// Compound index for unique attendance per day
attendanceSchema.index({ laborId: 1, date: 1 }, { unique: true });

const Attendance = mongoose.model('Attendance', attendanceSchema);
export default Attendance;