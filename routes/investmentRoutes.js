const express = require('express');
const router = express.Router();
const Investment = require('../models/Investment');
const { protect, admin } = require('../middleware/authMiddleware');

// @desc    Create a new investment
// @route   POST /api/investments
// @access  Private/Admin
router.post('/', protect, admin, async (req, res) => {
  try {
    const {
      amount,
      investmentType,
      source,
      description,
      date,
      paymentMethod,
      notes,
      status,
      isOwnerInvestment,
      transactionType,
      loanDetails
    } = req.body;

    // Validate amount
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid amount'
      });
    }

    // Create investment
    const investment = await Investment.create({
      amount,
      investmentType: investmentType || 'owner',
      source: source || 'personal',
      description: description || '',
      date: date || new Date(),
      paymentMethod: paymentMethod || 'cash',
      notes: notes || '',
      status: status || 'completed',
      isOwnerInvestment: isOwnerInvestment !== undefined ? isOwnerInvestment : true,
      addedBy: req.user?.name || 'admin',
      transactionType: transactionType || 'credit',
      userId: req.user?._id,
      loanDetails: loanDetails || {}
    });

    res.status(201).json({
      success: true,
      data: investment,
      message: 'Investment added successfully'
    });
  } catch (error) {
    console.error('Error creating investment:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @desc    Get all investments
// @route   GET /api/investments
// @access  Private/Admin
router.get('/', protect, admin, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      startDate,
      endDate,
      investmentType,
      status,
      sortBy = 'date',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = {};

    // Date range filter
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    // Investment type filter
    if (investmentType) {
      filter.investmentType = investmentType;
    }

    // Status filter
    if (status) {
      filter.status = status;
    }

    // Calculate pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query
    const investments = await Investment.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limitNum);

    // Get total count for pagination
    const total = await Investment.countDocuments(filter);

    // Calculate summary statistics
    const summary = await Investment.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amount' },
          averageAmount: { $avg: '$amount' },
          count: { $sum: 1 },
          maxAmount: { $max: '$amount' },
          minAmount: { $min: '$amount' }
        }
      }
    ]);

    res.json({
      success: true,
      data: investments,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalItems: total,
        itemsPerPage: limitNum
      },
      summary: summary[0] || {
        totalAmount: 0,
        averageAmount: 0,
        count: 0,
        maxAmount: 0,
        minAmount: 0
      }
    });
  } catch (error) {
    console.error('Error fetching investments:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @desc    Get single investment by ID
// @route   GET /api/investments/:id
// @access  Private/Admin
router.get('/:id', protect, admin, async (req, res) => {
  try {
    const investment = await Investment.findById(req.params.id);

    if (!investment) {
      return res.status(404).json({
        success: false,
        message: 'Investment not found'
      });
    }

    res.json({
      success: true,
      data: investment
    });
  } catch (error) {
    console.error('Error fetching investment:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @desc    Update investment
// @route   PUT /api/investments/:id
// @access  Private/Admin
router.put('/:id', protect, admin, async (req, res) => {
  try {
    let investment = await Investment.findById(req.params.id);

    if (!investment) {
      return res.status(404).json({
        success: false,
        message: 'Investment not found'
      });
    }

    // Update investment
    investment = await Investment.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    res.json({
      success: true,
      data: investment,
      message: 'Investment updated successfully'
    });
  } catch (error) {
    console.error('Error updating investment:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @desc    Delete investment
// @route   DELETE /api/investments/:id
// @access  Private/Admin
router.delete('/:id', protect, admin, async (req, res) => {
  try {
    const investment = await Investment.findById(req.params.id);

    if (!investment) {
      return res.status(404).json({
        success: false,
        message: 'Investment not found'
      });
    }

    await investment.deleteOne();

    res.json({
      success: true,
      message: 'Investment deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting investment:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @desc    Get investment statistics
// @route   GET /api/investments/stats/summary
// @access  Private/Admin
router.get('/stats/summary', protect, admin, async (req, res) => {
  try {
    const { year, month } = req.query;
    
    let matchStage = {};
    
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

    const stats = await Investment.aggregate([
      { $match: matchStage },
      {
        $facet: {
          byType: [
            {
              $group: {
                _id: '$investmentType',
                total: { $sum: '$amount' },
                count: { $sum: 1 }
              }
            }
          ],
          bySource: [
            {
              $group: {
                _id: '$source',
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
          ],
          totalStats: [
            {
              $group: {
                _id: null,
                totalAmount: { $sum: '$amount' },
                averageAmount: { $avg: '$amount' },
                totalCount: { $sum: 1 },
                maxAmount: { $max: '$amount' },
                minAmount: { $min: '$amount' }
              }
            }
          ]
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        byType: stats[0].byType,
        bySource: stats[0].bySource,
        byPaymentMethod: stats[0].byPaymentMethod,
        monthlyTrend: stats[0].monthlyTrend,
        totalStats: stats[0].totalStats[0] || {
          totalAmount: 0,
          averageAmount: 0,
          totalCount: 0,
          maxAmount: 0,
          minAmount: 0
        }
      }
    });
  } catch (error) {
    console.error('Error fetching investment stats:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

module.exports = router;