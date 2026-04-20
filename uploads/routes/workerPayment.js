import express from 'express';
import Labor from '../models/Labor.js';
import Attendance from '../models/Attendance.js';
import WorkerPayment from '../models/workerPayment.js';

const router = express.Router();

// ==================== Utility Functions ====================

// Calculate remaining balance for a worker in a specific month
// ✅ FIXED: Half Day کو 0.5 day کے طور پر گنیں
const calculateRemainingBalance = async (laborId, month, year) => {
  try {
    // Get labor details
    const labor = await Labor.findById(laborId);
    if (!labor) {
      throw new Error('Worker not found');
    }
    
    // Get Present days
    const presentRecords = await Attendance.find({
      laborId: laborId,
      month: parseInt(month),
      year: parseInt(year),
      status: 'Present'
    });
    
    // Get Half Day records
    const halfDayRecords = await Attendance.find({
      laborId: laborId,
      month: parseInt(month),
      year: parseInt(year),
      status: 'Half Day'
    });
    
    const presentDays = presentRecords.length;
    const halfDays = halfDayRecords.length;
    
    // ✅ Half Day counts as 0.5 day
    const totalEffectiveDays = presentDays + (halfDays * 0.5);
    const totalEarnings = totalEffectiveDays * labor.perDayRate;
    
    // Get all payments for this month
    const payments = await WorkerPayment.find({
      laborId: laborId,
      month: parseInt(month),
      year: parseInt(year)
    });
    
    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
    const remainingAmount = totalEarnings - totalPaid;
    
    return {
      presentDays,
      halfDays,
      totalEffectiveDays,
      totalEarnings,
      totalPaid,
      remainingAmount,
      laborName: labor.name,
      perDayRate: labor.perDayRate
    };
  } catch (error) {
    throw error;
  }
};

// Get complete summary for a worker (all months)
// ✅ FIXED: Half Day کو بھی شامل کریں
const getWorkerSummary = async (laborId) => {
  try {
    const labor = await Labor.findById(laborId);
    if (!labor) {
      throw new Error('Worker not found');
    }
    
    // Get all payments
    const payments = await WorkerPayment.find({ laborId }).sort({ date: -1 });
    
    // Get all attendance (Present and Half Day)
    const presentRecords = await Attendance.find({ 
      laborId, 
      status: 'Present' 
    });
    
    const halfDayRecords = await Attendance.find({ 
      laborId, 
      status: 'Half Day' 
    });
    
    // Calculate totals with Half Day as 0.5
    const totalPresentDays = presentRecords.length;
    const totalHalfDays = halfDayRecords.length;
    const totalEffectiveDays = totalPresentDays + (totalHalfDays * 0.5);
    
    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
    const totalEarnings = totalEffectiveDays * labor.perDayRate;
    
    // Group by month/year
    const monthlyStats = {};
    
    // Process Present attendance by month
    presentRecords.forEach(record => {
      const key = `${record.month}-${record.year}`;
      if (!monthlyStats[key]) {
        monthlyStats[key] = {
          month: record.month,
          year: record.year,
          monthName: new Date(record.year, record.month - 1).toLocaleString('default', { month: 'long' }),
          presentDays: 0,
          halfDays: 0,
          effectiveDays: 0,
          earnings: 0,
          paid: 0
        };
      }
      monthlyStats[key].presentDays += 1;
      monthlyStats[key].effectiveDays += 1;
      monthlyStats[key].earnings += labor.perDayRate;
    });
    
    // Process Half Day attendance by month
    halfDayRecords.forEach(record => {
      const key = `${record.month}-${record.year}`;
      if (!monthlyStats[key]) {
        monthlyStats[key] = {
          month: record.month,
          year: record.year,
          monthName: new Date(record.year, record.month - 1).toLocaleString('default', { month: 'long' }),
          presentDays: 0,
          halfDays: 0,
          effectiveDays: 0,
          earnings: 0,
          paid: 0
        };
      }
      monthlyStats[key].halfDays += 1;
      monthlyStats[key].effectiveDays += 0.5;
      monthlyStats[key].earnings += labor.perDayRate * 0.5;
    });
    
    // Process payments by month
    payments.forEach(payment => {
      const key = `${payment.month}-${payment.year}`;
      if (monthlyStats[key]) {
        monthlyStats[key].paid += payment.amount;
      }
    });
    
    // Calculate remaining for each month
    Object.keys(monthlyStats).forEach(key => {
      monthlyStats[key].remaining = monthlyStats[key].earnings - monthlyStats[key].paid;
      monthlyStats[key].paymentPercentage = monthlyStats[key].earnings > 0 
        ? (monthlyStats[key].paid / monthlyStats[key].earnings * 100).toFixed(2)
        : 0;
    });
    
    return {
      labor: {
        id: labor._id,
        name: labor.name,
        perDayRate: labor.perDayRate
      },
      overall: {
        totalPresentDays,
        totalHalfDays,
        totalEffectiveDays: totalEffectiveDays.toFixed(1),
        totalEarnings,
        totalPaid,
        totalRemaining: totalEarnings - totalPaid,
        paymentPercentage: totalEarnings > 0 ? ((totalPaid / totalEarnings) * 100).toFixed(2) : 0
      },
      monthlyStats: Object.values(monthlyStats).sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        return b.month - a.month;
      })
    };
  } catch (error) {
    throw error;
  }
};

// ==================== Payment Routes ====================

// Route 1: Add Payment
router.post('/add', async (req, res) => {
  try {
    const { laborId, amount, method, note, month, year } = req.body;
    
    console.log('📥 Payment request received:', req.body);
    
    // Basic validation
    if (!laborId || !amount || !method || !month || !year) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }
    
    // Check if worker exists
    const labor = await Labor.findById(laborId);
    if (!labor) {
      return res.status(404).json({
        success: false,
        message: 'Worker not found'
      });
    }
    
    // Calculate remaining balance before adding payment (includes Half Day)
    const balanceInfo = await calculateRemainingBalance(laborId, month, year);
    
    console.log('💰 Balance info:', {
      totalEarnings: balanceInfo.totalEarnings,
      totalPaid: balanceInfo.totalPaid,
      remainingAmount: balanceInfo.remainingAmount,
      presentDays: balanceInfo.presentDays,
      halfDays: balanceInfo.halfDays,
      totalEffectiveDays: balanceInfo.totalEffectiveDays
    });
    
    // Check if payment amount exceeds remaining balance
    if (parseFloat(amount) > balanceInfo.remainingAmount) {
      return res.status(400).json({
        success: false,
        message: 'Payment amount exceeds remaining balance',
        data: {
          totalEarnings: balanceInfo.totalEarnings,
          totalPaid: balanceInfo.totalPaid,
          remainingAmount: balanceInfo.remainingAmount,
          requestedAmount: amount,
          presentDays: balanceInfo.presentDays,
          halfDays: balanceInfo.halfDays,
          totalEffectiveDays: balanceInfo.totalEffectiveDays
        }
      });
    }
    
    // Create payment
    const newPayment = new WorkerPayment({
      laborId,
      amount: parseFloat(amount),
      method,
      note: note || '',
      month: parseInt(month),
      year: parseInt(year),
      date: new Date()
    });
    
    // Save to database
    const savedPayment = await newPayment.save();
    
    // Get updated balance after payment
    const updatedBalance = await calculateRemainingBalance(laborId, month, year);
    
    console.log('✅ Payment saved successfully:', savedPayment._id);
    
    res.status(201).json({
      success: true,
      message: 'Payment added successfully',
      payment: savedPayment,
      balance: updatedBalance
    });
    
  } catch (error) {
    console.error('❌ Error adding payment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add payment',
      error: error.message
    });
  }
});

// Route 2: Get payments by labor ID with monthly summary
router.get('/labor/:laborId', async (req, res) => {
  try {
    const { laborId } = req.params;
    const { month, year } = req.query;
    
    if (!laborId) {
      return res.status(400).json({
        success: false,
        message: 'Labor ID is required'
      });
    }
    
    // Build query
    const query = { laborId };
    
    if (month && year) {
      query.month = parseInt(month);
      query.year = parseInt(year);
    }
    
    // Get payments
    const payments = await WorkerPayment.find(query)
      .sort({ date: -1 })
      .populate('laborId', 'name perDayRate');
    
    // Calculate summary if month and year provided (includes Half Day)
    let summary = {};
    if (month && year) {
      summary = await calculateRemainingBalance(laborId, month, year);
    }
    
    res.json({
      success: true,
      payments,
      summary
    });
    
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payments',
      error: error.message
    });
  }
});

// Route 3: Get complete worker summary (all months)
router.get('/summary/:laborId', async (req, res) => {
  try {
    const { laborId } = req.params;
    
    if (!laborId) {
      return res.status(400).json({
        success: false,
        message: 'Labor ID is required'
      });
    }
    
    const summary = await getWorkerSummary(laborId);
    
    res.json({
      success: true,
      ...summary
    });
    
  } catch (error) {
    console.error('Error fetching summary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch summary',
      error: error.message
    });
  }
});

// Route 4: Get monthly details
router.get('/monthly/:laborId', async (req, res) => {
  try {
    const { laborId } = req.params;
    const { month, year } = req.query;
    
    if (!laborId || !month || !year) {
      return res.status(400).json({
        success: false,
        message: 'Labor ID, month and year are required'
      });
    }
    
    const monthNum = parseInt(month);
    const yearNum = parseInt(year);
    
    // Get balance info (includes Half Day)
    const balanceInfo = await calculateRemainingBalance(laborId, monthNum, yearNum);
    
    // Get payments for the month
    const payments = await WorkerPayment.find({
      laborId,
      month: monthNum,
      year: yearNum
    }).sort({ date: 1 });
    
    res.json({
      success: true,
      month: monthNum,
      year: yearNum,
      monthName: new Date(yearNum, monthNum - 1).toLocaleString('default', { month: 'long' }),
      attendance: {
        presentDays: balanceInfo.presentDays,
        halfDays: balanceInfo.halfDays,
        totalEffectiveDays: balanceInfo.totalEffectiveDays,
        totalEarnings: balanceInfo.totalEarnings
      },
      payments,
      summary: {
        totalPaid: balanceInfo.totalPaid,
        remainingAmount: balanceInfo.remainingAmount,
        paymentPercentage: balanceInfo.totalEarnings > 0 
          ? ((balanceInfo.totalPaid / balanceInfo.totalEarnings) * 100).toFixed(2)
          : 0
      }
    });
    
  } catch (error) {
    console.error('Error fetching monthly details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch monthly details',
      error: error.message
    });
  }
});

// Route 5: Get payment by ID
router.get('/:paymentId', async (req, res) => {
  try {
    const { paymentId } = req.params;
    
    const payment = await WorkerPayment.findById(paymentId)
      .populate('laborId', 'name perDayRate');
    
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }
    
    res.json({
      success: true,
      payment
    });
    
  } catch (error) {
    console.error('Error fetching payment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment',
      error: error.message
    });
  }
});

// Route 6: Delete payment
router.delete('/:paymentId', async (req, res) => {
  try {
    const { paymentId } = req.params;
    
    const payment = await WorkerPayment.findByIdAndDelete(paymentId);
    
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Payment deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting payment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete payment',
      error: error.message
    });
  }
});

export default router;