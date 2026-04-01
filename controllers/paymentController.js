import Order from "../models/Order.js";

// ========== Create Payment ==========
export const createPayment = async (req, res) => {
  try {
    const { orderId, amount, paymentMethod, date, notes } = req.body;

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    const currentTotalPaid = order.calculateTotalPaid();
    const currentRemaining = order.finalTotal - currentTotalPaid;

    if (amount > currentRemaining) {
      return res.status(400).json({ success: false, message: `Amount cannot exceed remaining balance ${currentRemaining}` });
    }

    const newPayment = {
      amount: Number(amount),
      paymentMethod: paymentMethod || "cash",
      date: date || new Date(),
      notes: notes || ""
    };

    order.payments.push(newPayment);
    const summary = order.updatePaymentStatus();
    await order.save();

    res.status(201).json({
      success: true,
      data: newPayment,
      message: "Payment added successfully",
      summary
    });

  } catch (error) {
    console.error("❌ Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ========== Get Payments ==========
export const getPaymentsByOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    const totalPaid = order.calculateTotalPaid();

    res.json({
      success: true,
      data: order.payments,
      summary: {
        totalPaid,
        remainingBalance: order.remainingBalance,
        paymentStatus: order.paymentStatus,
        finalTotal: order.finalTotal,
        advancePayment: order.advancePayment
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ========== Delete Payment ==========
export const deletePayment = async (req, res) => {
  try {
    const { orderId, paymentIndex } = req.params;
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    order.payments.splice(paymentIndex, 1);
    const summary = order.updatePaymentStatus();
    await order.save();

    res.json({ success: true, message: "Payment deleted", summary });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};