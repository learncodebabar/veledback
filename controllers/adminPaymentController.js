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
    
    // Execute query
    const payments = await AdminPayment.find(filter)
      .sort({ date: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('createdBy', 'name email');

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
      message: 'Server error',
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
    if (!amount || !description) {
      return res.status(400).json({
        success: false,
        message: 'Amount and description are required'
      });
    }

    // Prepare payment data
    const paymentData = {
      amount: parseFloat(amount),
      paymentType: paymentType || 'business',
      description,
      date: date || new Date(),
      paymentMethod: paymentMethod || 'cash',
      reference: reference || '',
      status: status || 'completed',
      notes: notes || ''
    };

    // ✅ Fix: Check if req.user exists before accessing _id
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
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get single admin payment
// @route   GET /api/admin/payments/:id
// @access  Private
export const getAdminPaymentById = async (req, res) => {
  try {
    const payment = await AdminPayment.findById(req.params.id)
      .populate('createdBy', 'name email');

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
    return res.status(500).json({
      success: false,
      message: 'Server error',
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
        payment[field] = req.body[field];
      }
    });

    await payment.save();

    return res.status(200).json({
      success: true,
      message: 'Admin payment updated successfully',
      data: payment
    });
  } catch (error) {
    console.error('Error updating admin payment:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
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
    return res.status(500).json({
      success: false,
      message: 'Server error',
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
      const endDate = new Date(year, 11, 31);
      matchStage.date = { $gte: startDate, $lte: endDate };
    }
    
    if (month && year) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      matchStage.date = { $gte: startDate, $lte: endDate };
    }

    const stats = await AdminPayment.aggregate([
      { $match: matchStage },
      {
        $facet: {
          byPaymentType: [
            {
              $group: {
                _id: '$paymentType',
                total: { $sum: '$amount' },
                count: { $sum: 1 }
              }
            }
          ],
          byPaymentMethod: [
            {
              $group: {
                _id: '$paymentMethod',
                total: { $sum: '$amount' },
                count: { $sum: 1 }
              }
            }
          ],
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

    return res.status(200).json({
      success: true,
      data: stats[0]
    });
  } catch (error) {
    console.error('Error fetching payment stats:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};