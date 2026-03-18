// ✅ Default import - ensure model export default use kar raha hai
import AdminPayment from '../models/AdminPayment.js';

// @desc    Get all admin payments
// @route   GET /api/admin/payments
// @access  Private
export const getAdminPayments = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      startDate, 
      endDate, 
      paymentType,
      status,
      search 
    } = req.query;

    // Build filter object
    const filter = {};
    
    // Date range filter
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }
    
    // Payment type filter
    if (paymentType) filter.paymentType = paymentType;
    
    // Status filter
    if (status) filter.status = status;
    
    // Search in description or reference
    if (search) {
      filter.$or = [
        { description: { $regex: search, $options: 'i' } },
        { reference: { $regex: search, $options: 'i' } }
      ];
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // ✅ FIXED: REMOVED .populate() completely
    const payments = await AdminPayment.find(filter)
      .sort({ date: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
      // .populate('createdBy', 'name email'); // ❌ REMOVED - causing error

    // Get total count for pagination
    const total = await AdminPayment.countDocuments(filter);

    return res.status(200).json({
      success: true,
      data: payments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching admin payments:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching payments',
      error: error.message
    });
  }
};

// @desc    Create new admin payment
// @route   POST /api/admin/payments
// @access  Private
export const createAdminPayment = async (req, res) => {
  try {
    const {
      amount,
      paymentType,
      description,
      date,
      paymentMethod,
      reference,
      status,
      notes
    } = req.body;

    // Validate required fields
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid amount'
      });
    }

    if (!description || !description.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Description is required'
      });
    }

    // Prepare payment data
    const paymentData = {
      amount: parseFloat(amount),
      paymentType: paymentType || 'business',
      description: description.trim(),
      date: date || new Date(),
      paymentMethod: paymentMethod || 'cash',
      reference: reference || '',
      status: status || 'completed',
      notes: notes || ''
    };

    // ✅ Add createdBy if user exists
    if (req.user && req.user._id) {
      paymentData.createdBy = req.user._id;
    }

    // Create payment
    const payment = await AdminPayment.create(paymentData);

    return res.status(201).json({
      success: true,
      message: 'Admin payment created successfully',
      data: payment
    });
  } catch (error) {
    console.error('Error creating admin payment:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: messages
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Server error while creating payment',
      error: error.message
    });
  }
};

// @desc    Get single admin payment
// @route   GET /api/admin/payments/:id
// @access  Private
export const getAdminPaymentById = async (req, res) => {
  try {
    // ✅ FIXED: REMOVED .populate()
    const payment = await AdminPayment.findById(req.params.id);
    // .populate('createdBy', 'name email'); // ❌ REMOVED - causing error

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: payment
    });
  } catch (error) {
    console.error('Error fetching admin payment:', error);
    
    // Handle invalid ID format
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment ID format'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Server error while fetching payment',
      error: error.message
    });
  }
};

// @desc    Update admin payment
// @route   PUT /api/admin/payments/:id
// @access  Private
export const updateAdminPayment = async (req, res) => {
  try {
    const payment = await AdminPayment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    // Update fields
    const updateFields = [
      'amount', 'paymentType', 'description', 'date',
      'paymentMethod', 'reference', 'status', 'notes'
    ];

    updateFields.forEach(field => {
      if (req.body[field] !== undefined) {
        // Special handling for amount
        if (field === 'amount') {
          payment[field] = parseFloat(req.body[field]);
        } 
        // Special handling for description
        else if (field === 'description') {
          payment[field] = req.body[field].trim();
        }
        else {
          payment[field] = req.body[field];
        }
      }
    });

    payment.updatedAt = new Date();
    await payment.save();

    return res.status(200).json({
      success: true,
      message: 'Admin payment updated successfully',
      data: payment
    });
  } catch (error) {
    console.error('Error updating admin payment:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: messages
      });
    }

    // Handle invalid ID format
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment ID format'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Server error while updating payment',
      error: error.message
    });
  }
};

// @desc    Delete admin payment
// @route   DELETE /api/admin/payments/:id
// @access  Private
export const deleteAdminPayment = async (req, res) => {
  try {
    const payment = await AdminPayment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    await payment.deleteOne();

    return res.status(200).json({
      success: true,
      message: 'Admin payment deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting admin payment:', error);
    
    // Handle invalid ID format
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment ID format'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Server error while deleting payment',
      error: error.message
    });
  }
};

// @desc    Get payment statistics
// @route   GET /api/admin/payments/stats/summary
// @access  Private
export const getPaymentStats = async (req, res) => {
  try {
    const { year, month } = req.query;
    
    const matchStage = {};
    
    if (year) {
      const startDate = new Date(year, 0, 1);
      const endDate = new Date(year, 11, 31, 23, 59, 59, 999);
      matchStage.date = { $gte: startDate, $lte: endDate };
    }
    
    if (month && year) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59, 999);
      matchStage.date = { $gte: startDate, $lte: endDate };
    }

    const stats = await AdminPayment.aggregate([
      { $match: matchStage },
      {
        $facet: {
          // Overall summary
          overall: [
            {
              $group: {
                _id: null,
                totalAmount: { $sum: '$amount' },
                totalCount: { $sum: 1 },
                averageAmount: { $avg: '$amount' },
                maxAmount: { $max: '$amount' },
                minAmount: { $min: '$amount' }
              }
            }
          ],
          // By payment type
          byPaymentType: [
            {
              $group: {
                _id: '$paymentType',
                total: { $sum: '$amount' },
                count: { $sum: 1 }
              }
            },
            { $sort: { total: -1 } }
          ],
          // By payment method
          byPaymentMethod: [
            {
              $group: {
                _id: '$paymentMethod',
                total: { $sum: '$amount' },
                count: { $sum: 1 }
              }
            },
            { $sort: { total: -1 } }
          ],
          // By status
          byStatus: [
            {
              $group: {
                _id: '$status',
                total: { $sum: '$amount' },
                count: { $sum: 1 }
              }
            }
          ],
          // Monthly trend
          monthlyTrend: [
            {
              $group: {
                _id: {
                  year: { $year: '$date' },
                  month: { $month: '$date' }
                },
                total: { $sum: '$amount' },
                count: { $sum: 1 }
              }
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } }
          ]
        }
      }
    ]);

    // Format monthly trend data
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const formattedMonthlyTrend = stats[0]?.monthlyTrend?.map(item => ({
      month: monthNames[item._id.month - 1],
      year: item._id.year,
      total: item.total,
      count: item.count,
      label: `${monthNames[item._id.month - 1]} ${item._id.year}`
    })) || [];

    return res.status(200).json({
      success: true,
      data: {
        overall: stats[0]?.overall?.[0] || {
          totalAmount: 0,
          totalCount: 0,
          averageAmount: 0,
          maxAmount: 0,
          minAmount: 0
        },
        byPaymentType: stats[0]?.byPaymentType || [],
        byPaymentMethod: stats[0]?.byPaymentMethod || [],
        byStatus: stats[0]?.byStatus || [],
        monthlyTrend: formattedMonthlyTrend
      }
    });
  } catch (error) {
    console.error('Error fetching payment stats:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching payment statistics',
      error: error.message
    });
  }
};

// @desc    Bulk delete payments
// @route   DELETE /api/admin/payments/bulk
// @access  Private
export const bulkDeletePayments = async (req, res) => {
  try {
    const { paymentIds } = req.body;

    if (!paymentIds || !Array.isArray(paymentIds) || paymentIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of payment IDs'
      });
    }

    const result = await AdminPayment.deleteMany({
      _id: { $in: paymentIds }
    });

    return res.status(200).json({
      success: true,
      message: `Successfully deleted ${result.deletedCount} payments`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Error bulk deleting payments:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while bulk deleting payments',
      error: error.message
    });
  }
};

// @desc    Export payments to CSV
// @route   GET /api/admin/payments/export/csv
// @access  Private
export const exportPaymentsToCSV = async (req, res) => {
  try {
    const { startDate, endDate, paymentType, status } = req.query;

    let filter = {};

    if (startDate && endDate) {
      filter.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    if (paymentType) {
      filter.paymentType = paymentType;
    }

    if (status) {
      filter.status = status;
    }

    const payments = await AdminPayment.find(filter)
      .sort({ date: -1 });

    // Create CSV header
    let csv = 'Date,Payment Type,Description,Amount,Payment Method,Reference,Status,Notes\n';

    // Add rows
    payments.forEach(payment => {
      const date = new Date(payment.date).toLocaleDateString();
      const amount = payment.amount.toFixed(2);
      const description = payment.description.replace(/,/g, ' '); // Remove commas to avoid CSV issues
      const notes = (payment.notes || '').replace(/,/g, ' ');
      
      csv += `${date},${payment.paymentType},"${description}",${amount},${payment.paymentMethod},${payment.reference || ''},${payment.status},"${notes}"\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=payments.csv');
    res.status(200).send(csv);
  } catch (error) {
    console.error('Error exporting payments to CSV:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while exporting payments',
      error: error.message
    });
  }
};