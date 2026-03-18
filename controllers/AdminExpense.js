import AdminExpense from "../models/AdminExpense.js";

// @desc    Get all expenses (with filters)
// @route   GET /api/admin/expenses
// @access  Private/Admin
export const getAllExpenses = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      startDate,
      endDate,
      category,
      status,
      minAmount,
      maxAmount,
      sortBy = 'date',
      sortOrder = 'desc',
      search
    } = req.query;

    // Build filter object
    const filter = {};

    // Date range filter
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.date.$lte = end;
      }
    }

    // Category filter
    if (category) {
      filter.category = category;
    }

    // Status filter
    if (status) {
      filter.status = status;
    }

    // Amount range filter
    if (minAmount || maxAmount) {
      filter.amount = {};
      if (minAmount) filter.amount.$gte = parseFloat(minAmount);
      if (maxAmount) filter.amount.$lte = parseFloat(maxAmount);
    }

    // Search in description
    if (search) {
      filter.description = { $regex: search, $options: 'i' };
    }

    // Calculate pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // ✅ FIXED: REMOVED .populate() completely
    const expenses = await AdminExpense.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limitNum);
      // .populate('addedBy', 'name email'); // ❌ REMOVED - causing error

    // Get total count for pagination
    const total = await AdminExpense.countDocuments(filter);

    // Calculate summary statistics
    const summary = await AdminExpense.aggregate([
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

    res.status(200).json({
      success: true,
      data: expenses,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalItems: total,
        itemsPerPage: limitNum,
        hasNext: pageNum < Math.ceil(total / limitNum),
        hasPrev: pageNum > 1
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
    console.error('Error in getAllExpenses:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching expenses',
      error: error.message
    });
  }
};

// @desc    Create new expense
// @route   POST /api/admin/expenses
// @access  Private/Admin
export const createExpense = async (req, res) => {
  try {
    const {
      amount,
      category,
      description,
      date,
      paymentMethod,
      status,
      notes,
      isTaxDeductible,
      taxPercentage,
      isRecurring,
      recurringFrequency,
      recurringEndDate
    } = req.body;

    // Validation
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

    if (!category) {
      return res.status(400).json({
        success: false,
        message: 'Category is required'
      });
    }

    // Create expense
    const expense = await AdminExpense.create({
      amount: parseFloat(amount),
      category,
      description: description.trim(),
      date: date || new Date(),
      paymentMethod: paymentMethod || 'cash',
      status: status || 'paid',
      notes: notes || '',
      addedBy: req.user?._id,
      addedByName: req.user?.name || 'admin',
      isTaxDeductible: isTaxDeductible || false,
      taxPercentage: taxPercentage || 0,
      isRecurring: isRecurring || false,
      recurringFrequency: recurringFrequency || null,
      recurringEndDate: recurringEndDate || null
    });

    res.status(201).json({
      success: true,
      data: expense,
      message: 'Expense added successfully'
    });
  } catch (error) {
    console.error('Error in createExpense:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: messages
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while creating expense',
      error: error.message
    });
  }
};

// @desc    Get single expense by ID
// @route   GET /api/admin/expenses/:id
// @access  Private/Admin
export const getExpenseById = async (req, res) => {
  try {
    // ✅ FIXED: REMOVED .populate()
    const expense = await AdminExpense.findById(req.params.id);
    // .populate('addedBy', 'name email'); // ❌ REMOVED - causing error

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }

    res.status(200).json({
      success: true,
      data: expense
    });
  } catch (error) {
    console.error('Error in getExpenseById:', error);
    
    // Handle invalid ID format
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid expense ID format'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while fetching expense',
      error: error.message
    });
  }
};

// @desc    Update expense
// @route   PUT /api/admin/expenses/:id
// @access  Private/Admin
export const updateExpense = async (req, res) => {
  try {
    console.log("📝 Update request for ID:", req.params.id);
    console.log("📦 Update data:", req.body);
    
    // Find expense first
    const expense = await AdminExpense.findById(req.params.id);

    if (!expense) {
      console.log("❌ Expense not found");
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }

    // Update expense using findByIdAndUpdate
    const updatedExpense = await AdminExpense.findByIdAndUpdate(
      req.params.id,
      { 
        ...req.body,
        updatedAt: new Date(),
        updatedBy: req.user?._id 
      },
      {
        new: true,
        runValidators: true
      }
    );

    console.log("✅ Expense updated successfully");

    res.status(200).json({
      success: true,
      data: updatedExpense,
      message: 'Expense updated successfully'
    });

  } catch (error) {
    console.error('❌ Error in updateExpense:', error);
    
    // Handle specific MongoDB errors
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid expense ID format'
      });
    }
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: messages
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while updating expense',
      error: error.message
    });
  }
};

// @desc    Delete expense
// @route   DELETE /api/admin/expenses/:id
// @access  Private/Admin
export const deleteExpense = async (req, res) => {
  try {
    const expense = await AdminExpense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }

    // Check if user is admin
    if (!req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete expenses'
      });
    }

    await expense.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Expense deleted successfully'
    });
  } catch (error) {
    console.error('Error in deleteExpense:', error);
    
    // Handle invalid ID format
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid expense ID format'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while deleting expense',
      error: error.message
    });
  }
};

// @desc    Get expense statistics for dashboard
// @route   GET /api/admin/expenses/stats/dashboard
// @access  Private/Admin
export const getExpenseStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter = {
        date: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      };
    }

    const totalExpenses = await AdminExpense.aggregate([
      { $match: { ...dateFilter, status: { $ne: 'cancelled' } } },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    // Get expenses by category
    const expensesByCategory = await AdminExpense.aggregate([
      { $match: { ...dateFilter, status: { $ne: 'cancelled' } } },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { total: -1 } }
    ]);

    // Get monthly expenses for chart
    const monthlyExpenses = await AdminExpense.aggregate([
      { 
        $match: { 
          ...dateFilter,
          status: { $ne: 'cancelled' }
        } 
      },
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
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $limit: 12 }
    ]);

    // Get pending expenses
    const pendingExpenses = await AdminExpense.aggregate([
      { 
        $match: { 
          status: 'pending',
          date: { $lte: new Date() }
        } 
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    // Format monthly data for chart
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const chartData = monthlyExpenses.map(item => ({
      month: monthNames[item._id.month - 1],
      year: item._id.year,
      amount: item.total,
      count: item.count
    }));

    res.status(200).json({
      success: true,
      data: {
        totalExpenses: totalExpenses[0]?.total || 0,
        totalExpensesCount: totalExpenses[0]?.count || 0,
        expensesByCategory,
        monthlyExpenses: chartData,
        pendingExpenses: pendingExpenses[0]?.total || 0,
        pendingCount: pendingExpenses[0]?.count || 0
      }
    });
  } catch (error) {
    console.error('Error in getExpenseStats:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching expense statistics',
      error: error.message
    });
  }
};

// @desc    Get expenses by category
// @route   GET /api/admin/expenses/categories/:category
// @access  Private/Admin
export const getExpensesByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const { startDate, endDate, page = 1, limit = 10 } = req.query;

    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter = {
        date: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      };
    }

    const filter = {
      category,
      ...dateFilter,
      status: { $ne: 'cancelled' }
    };

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const expenses = await AdminExpense.find(filter)
      .sort({ date: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await AdminExpense.countDocuments(filter);

    const totalAmount = await AdminExpense.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: expenses,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalItems: total,
        itemsPerPage: limitNum
      },
      categoryTotal: totalAmount[0]?.total || 0
    });
  } catch (error) {
    console.error('Error in getExpensesByCategory:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching expenses by category',
      error: error.message
    });
  }
};

// ✅ Bulk delete function
export const bulkDeleteExpenses = async (req, res) => {
  try {
    const { expenseIds } = req.body;

    if (!expenseIds || !Array.isArray(expenseIds) || expenseIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of expense IDs'
      });
    }

    // Check if user is admin
    if (!req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete expenses'
      });
    }

    const result = await AdminExpense.deleteMany({
      _id: { $in: expenseIds }
    });

    res.status(200).json({
      success: true,
      message: `Successfully deleted ${result.deletedCount} expenses`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Error in bulkDeleteExpenses:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while bulk deleting expenses',
      error: error.message
    });
  }
};

// ✅ Export function
export const exportExpensesToCSV = async (req, res) => {
  try {
    const { startDate, endDate, category } = req.query;

    let filter = {
      status: { $ne: 'cancelled' }
    };

    if (startDate && endDate) {
      filter.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    if (category) {
      filter.category = category;
    }

    // ✅ FIXED: REMOVED .populate()
    const expenses = await AdminExpense.find(filter)
      .sort({ date: -1 });
      // .populate('addedBy', 'name'); // ❌ REMOVED - causing error

    // Create CSV header
    let csv = 'Date,Category,Description,Amount,Payment Method,Status,Added By,Notes\n';

    // Add rows
    expenses.forEach(expense => {
      const date = new Date(expense.date).toLocaleDateString();
      const description = expense.description.replace(/,/g, ' '); // Remove commas to avoid CSV issues
      const notes = (expense.notes || '').replace(/,/g, ' ');
      
      csv += `${date},${expense.category},"${description}",${expense.amount},${expense.paymentMethod},${expense.status},${expense.addedByName || 'admin'},"${notes}"\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=expenses.csv');
    res.status(200).send(csv);
  } catch (error) {
    console.error('Error in exportExpensesToCSV:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while exporting expenses',
      error: error.message
    });
  }
};