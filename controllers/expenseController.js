// backend/controllers/expenseController.js
import Expense from "../models/expenseModel.js";
import Order from "../models/Order.js";

// @desc    Create new expense
// @route   POST /api/expenses
// @access  Private
export const createExpense = async (req, res) => {
  try {
    const { order, description, amount, date, category, notes } = req.body;

    // Validation
    if (!order || !description || !amount) {
      return res.status(400).json({ 
        success: false, 
        message: "Please provide order, description and amount" 
      });
    }

    // Check if order exists
    const orderExists = await Order.findById(order);
    if (!orderExists) {
      return res.status(404).json({ 
        success: false, 
        message: "Order not found" 
      });
    }

    // Create expense
    const expense = await Expense.create({
      order,
      description,
      amount,
      date: date || Date.now(),
      category: category || "material",
      notes: notes || ""
    });

    // Add expense to order's expenses array
    await Order.findByIdAndUpdate(
      order,
      { $push: { expenses: expense._id } }
    );

    res.status(201).json({
      success: true,
      data: expense,
      message: "Expense added successfully"
    });

  } catch (error) {
    console.error("Error creating expense:", error);
    res.status(500).json({ 
      success: false, 
      message: error.message || "Server error" 
    });
  }
};

// ✅ NEW: Get all expenses
// @desc    Get all expenses
// @route   GET /api/expenses
// @access  Private
export const getAllExpenses = async (req, res) => {
  try {
    const expenses = await Expense.find()
      .populate({
        path: 'order',
        select: 'billNumber customer finalTotal status',
        populate: {
          path: 'customer',
          select: 'name phone'
        }
      })
      .sort({ date: -1 });

    res.json({
      success: true,
      data: expenses,
      count: expenses.length
    });

  } catch (error) {
    console.error("Error fetching all expenses:", error);
    res.status(500).json({ 
      success: false, 
      message: error.message || "Server error" 
    });
  }
};

// @desc    Get expenses by order
// @route   GET /api/expenses/order/:orderId
// @access  Private
export const getExpensesByOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const expenses = await Expense.find({ order: orderId })
      .populate('order', 'billNumber')
      .sort({ date: -1 });
      
    res.json({ 
      success: true, 
      data: expenses 
    });
  } catch (error) {
    console.error("Error fetching expenses:", error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// @desc    Get expense by ID
// @route   GET /api/expenses/:id
// @access  Private
export const getExpenseById = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id)
      .populate({
        path: 'order',
        select: 'billNumber customer finalTotal',
        populate: {
          path: 'customer',
          select: 'name phone'
        }
      });

    if (!expense) {
      return res.status(404).json({ 
        success: false, 
        message: "Expense not found" 
      });
    }

    res.json({ 
      success: true, 
      data: expense 
    });
  } catch (error) {
    console.error("Error fetching expense:", error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// @desc    Update expense
// @route   PUT /api/expenses/:id
// @access  Private
export const updateExpense = async (req, res) => {
  try {
    const { description, amount, date, category, notes } = req.body;
    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({ 
        success: false, 
        message: "Expense not found" 
      });
    }

    if (description) expense.description = description;
    if (amount) expense.amount = amount;
    if (date) expense.date = date;
    if (category) expense.category = category;
    if (notes !== undefined) expense.notes = notes;

    await expense.save();

    res.json({ 
      success: true, 
      data: expense, 
      message: "Expense updated successfully" 
    });
  } catch (error) {
    console.error("Error updating expense:", error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// @desc    Delete expense
// @route   DELETE /api/expenses/:id
// @access  Private
export const deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({ 
        success: false, 
        message: "Expense not found" 
      });
    }

    // Remove expense from order
    await Order.findByIdAndUpdate(
      expense.order,
      { $pull: { expenses: expense._id } }
    );

    await expense.deleteOne();

    res.json({
      success: true,
      message: "Expense deleted successfully"
    });

  } catch (error) {
    console.error("Error deleting expense:", error);
    res.status(500).json({ 
      success: false, 
      message: error.message || "Server error" 
    });
  }
};