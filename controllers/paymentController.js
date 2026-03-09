// backend/controllers/paymentController.js
import Payment from "../models/Payment.js";
import Order from "../models/Order.js";

// @desc    Create new payment
// @route   POST /api/payments
// @access  Private
export const createPayment = async (req, res) => {
  try {
    const { order, amount, paymentMethod, date, notes } = req.body;

    console.log("📥 Received payment data:", req.body);

    // Validation
    if (!order) {
      return res.status(400).json({ 
        success: false, 
        message: "Please provide order ID" 
      });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({ 
        success: false, 
        message: "Please provide valid amount" 
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

    // Check if amount exceeds remaining balance
    if (amount > orderExists.remainingBalance) {
      return res.status(400).json({ 
        success: false, 
        message: `Amount cannot exceed remaining balance: ${orderExists.remainingBalance}` 
      });
    }

    // Create payment
    const payment = await Payment.create({
      order,
      amount: Number(amount),
      paymentMethod: paymentMethod || "cash",
      date: date || Date.now(),
      notes: notes || ""
    });

    // Calculate new remaining balance
    const newRemainingBalance = orderExists.remainingBalance - amount;
    
    // Determine payment status
    let paymentStatus = 'partial';
    if (newRemainingBalance <= 0) {
      paymentStatus = 'paid';
    } else if (orderExists.advancePayment > 0 || amount > 0) {
      paymentStatus = 'partial';
    }

    // Update order with new payment and balance
    await Order.findByIdAndUpdate(
      order,
      { 
        $push: { payments: payment._id },
        $set: { 
          remainingBalance: newRemainingBalance,
          paymentStatus: paymentStatus,
          updatedAt: new Date()
        }
      }
    );

    console.log("✅ Payment added successfully");
    console.log("   New Remaining Balance:", newRemainingBalance);
    console.log("   Payment Status:", paymentStatus);

    res.status(201).json({
      success: true,
      data: payment,
      message: "Payment added successfully",
      remainingBalance: newRemainingBalance,
      paymentStatus: paymentStatus
    });

  } catch (error) {
    console.error("❌ Error creating payment:", error);
    res.status(500).json({ 
      success: false, 
      message: error.message || "Server error" 
    });
  }
};

// @desc    Get all payments for an order
// @route   GET /api/payments/order/:orderId
// @access  Private
export const getPaymentsByOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    const payments = await Payment.find({ order: orderId })
      .sort({ date: -1 });

    res.json({
      success: true,
      data: payments
    });

  } catch (error) {
    console.error("❌ Error fetching payments:", error);
    res.status(500).json({ 
      success: false, 
      message: error.message || "Server error" 
    });
  }
};

// @desc    Get single payment by ID
// @route   GET /api/payments/:id
// @access  Private
export const getPaymentById = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({ 
        success: false, 
        message: "Payment not found" 
      });
    }

    res.json({
      success: true,
      data: payment
    });

  } catch (error) {
    console.error("❌ Error fetching payment:", error);
    res.status(500).json({ 
      success: false, 
      message: error.message || "Server error" 
    });
  }
};

// @desc    Update payment
// @route   PUT /api/payments/:id
// @access  Private
export const updatePayment = async (req, res) => {
  try {
    const { amount, paymentMethod, date, notes, status } = req.body;

    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({ 
        success: false, 
        message: "Payment not found" 
      });
    }

    // Get original order
    const order = await Order.findById(payment.order);
    
    // Calculate balance adjustment if amount changes
    if (amount && amount !== payment.amount) {
      const difference = amount - payment.amount;
      const newRemainingBalance = order.remainingBalance - difference;
      
      await Order.findByIdAndUpdate(
        payment.order,
        { 
          remainingBalance: newRemainingBalance,
          paymentStatus: newRemainingBalance <= 0 ? "paid" : "partial"
        }
      );
    }

    // Update payment fields
    if (amount) payment.amount = Number(amount);
    if (paymentMethod) payment.paymentMethod = paymentMethod;
    if (date) payment.date = date;
    if (notes !== undefined) payment.notes = notes;
    if (status) payment.status = status;

    await payment.save();

    res.json({
      success: true,
      data: payment,
      message: "Payment updated successfully"
    });

  } catch (error) {
    console.error("❌ Error updating payment:", error);
    res.status(500).json({ 
      success: false, 
      message: error.message || "Server error" 
    });
  }
};

// @desc    Delete payment
// @route   DELETE /api/payments/:id
// @access  Private
export const deletePayment = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({ 
        success: false, 
        message: "Payment not found" 
      });
    }

    // Get order
    const order = await Order.findById(payment.order);
    
    // Calculate new remaining balance (add back the payment amount)
    const newRemainingBalance = order.remainingBalance + payment.amount;
    
    // Determine new payment status
    let newPaymentStatus = 'pending';
    if (newRemainingBalance < order.finalTotal) {
      newPaymentStatus = 'partial';
    }
    
    // Remove payment from order
    await Order.findByIdAndUpdate(
      payment.order,
      { 
        $pull: { payments: payment._id },
        $set: { 
          remainingBalance: newRemainingBalance,
          paymentStatus: newPaymentStatus,
          updatedAt: new Date()
        }
      }
    );

    await payment.deleteOne();

    console.log("✅ Payment deleted successfully");
    console.log("   New Remaining Balance:", newRemainingBalance);
    console.log("   Payment Status:", newPaymentStatus);

    res.json({
      success: true,
      message: "Payment deleted successfully"
    });

  } catch (error) {
    console.error("❌ Error deleting payment:", error);
    res.status(500).json({ 
      success: false, 
      message: error.message || "Server error" 
    });
  }
};
// @desc    Get all payments
// @route   GET /api/payments
// @access  Private
export const getAllPayments = async (req, res) => {
  try {
    const payments = await Payment.find()
      .populate("order")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: payments.length,
      data: payments
    });

  } catch (error) {
    console.error("❌ Error fetching all payments:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server error"
    });
  }
};