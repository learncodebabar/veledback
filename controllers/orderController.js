import Order from "../models/Order.js";
import Customer from "../models/Customer.js";
import Admin from "../models/Admin.js";
import { sendDueDateReminder } from "../utils/emailService.js";

// ✅ Create Order
export const createOrder = async (req, res) => {
  try {
    console.log("📦 Creating order with data:", req.body);

    // Validate required fields
    if (!req.body.customer) {
      return res.status(400).json({ 
        success: false, 
        message: "Customer ID is required" 
      });
    }

    if (!req.body.finalTotal || req.body.finalTotal <= 0) {
      return res.status(400).json({ 
        success: false, 
        message: "Valid final total is required" 
      });
    }

    // Check if customer exists
    const customerExists = await Customer.findById(req.body.customer);
    if (!customerExists) {
      return res.status(404).json({ 
        success: false, 
        message: "Customer not found" 
      });
    }

    // Create order - only customer ID is stored, name/phone/address are not needed
    const order = new Order({
      customer: req.body.customer,
      billNumber: req.body.billNumber || 'ORD-' + Date.now().toString().slice(-8) + '-' + Math.floor(Math.random() * 1000),
      finalTotal: Number(req.body.finalTotal),
      advancePayment: Number(req.body.advancePayment || 0),
      status: req.body.status || 'pending',
      notes: req.body.notes || '',
      date: req.body.date || new Date(),
      dueDate: req.body.dueDate || null // Add dueDate if you have it in your schema
    });

    const savedOrder = await order.save();
    console.log("✅ Order saved:", savedOrder);

    // Update customer with new order
    await Customer.findByIdAndUpdate(
      req.body.customer,
      { $push: { orders: savedOrder._id } }
    );

    // Populate customer details for response
    const populatedOrder = await Order.findById(savedOrder._id)
      .populate("customer", "name phone address");

    // 📧 SEND EMAIL NOTIFICATION TO ALL ADMINS
    try {
      // Get all admins
      const admins = await Admin.find({}).select('name email');
      
      if (admins.length > 0) {
        console.log(`📧 Sending new order notification to ${admins.length} admins`);
        
        // Calculate days remaining if dueDate exists
        let daysRemaining = null;
        if (savedOrder.dueDate) {
          const today = new Date();
          const dueDate = new Date(savedOrder.dueDate);
          const diffTime = dueDate - today;
          daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        }
        
        // Prepare order details for email
        const orderDetails = {
          customerName: customerExists.name,
          billNumber: savedOrder.billNumber,
          dueDate: savedOrder.dueDate || new Date(),
          finalTotal: savedOrder.finalTotal,
          advancePayment: savedOrder.advancePayment,
          remainingBalance: savedOrder.remainingBalance,
          daysRemaining: daysRemaining !== null ? daysRemaining : 0,
          status: savedOrder.status
        };
        
        // Send email to each admin
        for (const admin of admins) {
          await sendDueDateReminder(admin.email, admin.name, orderDetails);
        }
        
        console.log(`✅ New order notifications sent successfully`);
      }
    } catch (emailError) {
      console.error("❌ Error sending new order email notifications:", emailError);
      // Don't fail the order creation if email fails
    }

    res.status(201).json({
      success: true,
      data: populatedOrder,
    });

  } catch (error) {
    console.error("❌ Error creating order:", error);
    
    // Handle duplicate key error (billNumber)
    if (error.code === 11000) {
      return res.status(400).json({ 
        success: false, 
        message: "Bill number already exists. Please try again." 
      });
    }

    // Handle validation errors
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        success: false, 
        message: messages.join(", ") 
      });
    }

    res.status(500).json({ 
      success: false, 
      message: error.message || "Error creating order" 
    });
  }
};

// ✅ Get All Orders
export const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("customer", "name phone address")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders,
    });

  } catch (error) {
    console.error("❌ Error fetching orders:", error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// ✅ Get Order By ID
export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("customer", "name phone address");

    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: "Order not found" 
      });
    }

    res.status(200).json({
      success: true,
      data: order,
    });

  } catch (error) {
    console.error("❌ Error fetching order:", error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// ✅ Get Orders By Customer
export const getOrdersByCustomer = async (req, res) => {
  try {
    const orders = await Order.find({
      customer: req.params.customerId,
    })
    .populate("customer", "name phone address")
    .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders,
    });

  } catch (error) {
    console.error("❌ Error fetching customer orders:", error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// ✅ Update Order
export const updateOrder = async (req, res) => {
  try {
    // Get original order before update
    const originalOrder = await Order.findById(req.params.id);
    
    if (!originalOrder) {
      return res.status(404).json({ 
        success: false, 
        message: "Order not found" 
      });
    }

    // Calculate remaining balance if finalTotal or advancePayment is updated
    if (req.body.finalTotal !== undefined || req.body.advancePayment !== undefined) {
      const finalTotal = req.body.finalTotal !== undefined ? req.body.finalTotal : originalOrder.finalTotal;
      const advancePayment = req.body.advancePayment !== undefined ? req.body.advancePayment : originalOrder.advancePayment;
      req.body.remainingBalance = finalTotal - advancePayment;
      
      // Update payment status
      if (advancePayment >= finalTotal) {
        req.body.paymentStatus = 'paid';
      } else if (advancePayment > 0) {
        req.body.paymentStatus = 'partial';
      } else {
        req.body.paymentStatus = 'pending';
      }
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate("customer", "name phone address");

    // 📧 SEND EMAIL NOTIFICATION FOR ORDER UPDATE
    try {
      // Check if important fields changed
      const importantChanges = [];
      if (req.body.status && req.body.status !== originalOrder.status) {
        importantChanges.push(`status changed from ${originalOrder.status} to ${req.body.status}`);
      }
      if (req.body.dueDate && req.body.dueDate !== originalOrder.dueDate?.toISOString()) {
        importantChanges.push('due date updated');
      }
      if (req.body.finalTotal && req.body.finalTotal !== originalOrder.finalTotal) {
        importantChanges.push('final total updated');
      }
      
      if (importantChanges.length > 0) {
        const admins = await Admin.find({}).select('name email');
        
        if (admins.length > 0) {
          console.log(`📧 Sending order update notification to ${admins.length} admins`);
          
          const customer = await Customer.findById(updatedOrder.customer);
          
          // Calculate days remaining
          let daysRemaining = null;
          if (updatedOrder.dueDate) {
            const today = new Date();
            const dueDate = new Date(updatedOrder.dueDate);
            const diffTime = dueDate - today;
            daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          }
          
          const orderDetails = {
            customerName: customer?.name || 'Unknown',
            billNumber: updatedOrder.billNumber,
            dueDate: updatedOrder.dueDate || new Date(),
            finalTotal: updatedOrder.finalTotal,
            advancePayment: updatedOrder.advancePayment,
            remainingBalance: updatedOrder.remainingBalance,
            daysRemaining: daysRemaining !== null ? daysRemaining : 0,
            status: updatedOrder.status,
            changes: importantChanges.join(', ')
          };
          
          for (const admin of admins) {
            await sendDueDateReminder(admin.email, admin.name, orderDetails);
          }
          
          console.log(`✅ Order update notifications sent successfully`);
        }
      }
    } catch (emailError) {
      console.error("❌ Error sending update email notifications:", emailError);
    }

    res.status(200).json({
      success: true,
      data: updatedOrder,
    });

  } catch (error) {
    console.error("❌ Error updating order:", error);
    
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        success: false, 
        message: messages.join(", ") 
      });
    }

    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// ✅ Delete Order
export const deleteOrder = async (req, res) => {
  try {
    const deletedOrder = await Order.findByIdAndDelete(req.params.id);

    if (!deletedOrder) {
      return res.status(404).json({ 
        success: false, 
        message: "Order not found" 
      });
    }

    // Remove order from customer's orders array
    await Customer.findByIdAndUpdate(
      deletedOrder.customer,
      { $pull: { orders: deletedOrder._id } }
    );

    res.status(200).json({
      success: true,
      message: "Order deleted successfully",
    });

  } catch (error) {
    console.error("❌ Error deleting order:", error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// ✅ Update Order Status
export const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({ 
        success: false, 
        message: "Status is required" 
      });
    }

    const validStatuses = ['pending', 'in-progress', 'completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid status value" 
      });
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    ).populate("customer", "name phone address");

    if (!updatedOrder) {
      return res.status(404).json({ 
        success: false, 
        message: "Order not found" 
      });
    }

    // 📧 SEND EMAIL FOR STATUS CHANGE
    try {
      const admins = await Admin.find({}).select('name email');
      
      if (admins.length > 0) {
        console.log(`📧 Sending status update notification to ${admins.length} admins`);
        
        const customer = await Customer.findById(updatedOrder.customer);
        
        // Calculate days remaining
        let daysRemaining = null;
        if (updatedOrder.dueDate) {
          const today = new Date();
          const dueDate = new Date(updatedOrder.dueDate);
          const diffTime = dueDate - today;
          daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        }
        
        const orderDetails = {
          customerName: customer?.name || 'Unknown',
          billNumber: updatedOrder.billNumber,
          dueDate: updatedOrder.dueDate || new Date(),
          finalTotal: updatedOrder.finalTotal,
          advancePayment: updatedOrder.advancePayment,
          remainingBalance: updatedOrder.remainingBalance,
          daysRemaining: daysRemaining !== null ? daysRemaining : 0,
          status: updatedOrder.status
        };
        
        for (const admin of admins) {
          await sendDueDateReminder(admin.email, admin.name, orderDetails);
        }
        
        console.log(`✅ Status update notifications sent successfully`);
      }
    } catch (emailError) {
      console.error("❌ Error sending status update email:", emailError);
    }

    res.status(200).json({
      success: true,
      data: updatedOrder,
    });

  } catch (error) {
    console.error("❌ Error updating order status:", error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// ✅ Add Payment to Order
export const addPayment = async (req, res) => {
  try {
    const { paymentAmount } = req.body;
    
    if (!paymentAmount || paymentAmount <= 0) {
      return res.status(400).json({ 
        success: false, 
        message: "Valid payment amount is required" 
      });
    }

    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: "Order not found" 
      });
    }

    // Update advance payment and remaining balance
    order.advancePayment = (order.advancePayment || 0) + paymentAmount;
    order.remainingBalance = order.finalTotal - order.advancePayment;

    // Update payment status
    if (order.advancePayment >= order.finalTotal) {
      order.paymentStatus = 'paid';
    } else if (order.advancePayment > 0) {
      order.paymentStatus = 'partial';
    }

    await order.save();

    const updatedOrder = await Order.findById(order._id)
      .populate("customer", "name phone address");

    // 📧 SEND EMAIL FOR PAYMENT ADDED
    try {
      const admins = await Admin.find({}).select('name email');
      
      if (admins.length > 0) {
        console.log(`📧 Sending payment notification to ${admins.length} admins`);
        
        const customer = await Customer.findById(updatedOrder.customer);
        
        const orderDetails = {
          customerName: customer?.name || 'Unknown',
          billNumber: updatedOrder.billNumber,
          dueDate: updatedOrder.dueDate || new Date(),
          finalTotal: updatedOrder.finalTotal,
          advancePayment: updatedOrder.advancePayment,
          remainingBalance: updatedOrder.remainingBalance,
          daysRemaining: 0,
          status: updatedOrder.status,
          paymentAdded: paymentAmount
        };
        
        for (const admin of admins) {
          await sendDueDateReminder(admin.email, admin.name, orderDetails);
        }
        
        console.log(`✅ Payment notifications sent successfully`);
      }
    } catch (emailError) {
      console.error("❌ Error sending payment email:", emailError);
    }

    res.status(200).json({
      success: true,
      data: updatedOrder,
      message: "Payment added successfully"
    });

  } catch (error) {
    console.error("❌ Error adding payment:", error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// ✅ Get Order Statistics
export const getOrderStats = async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments();
    
    const pendingOrders = await Order.countDocuments({ status: 'pending' });
    const inProgressOrders = await Order.countDocuments({ status: 'in-progress' });
    const completedOrders = await Order.countDocuments({ status: 'completed' });
    
    const totalRevenue = await Order.aggregate([
      { $group: { _id: null, total: { $sum: "$finalTotal" } } }
    ]);
    
    const totalAdvance = await Order.aggregate([
      { $group: { _id: null, total: { $sum: "$advancePayment" } } }
    ]);
    
    const totalRemaining = await Order.aggregate([
      { $group: { _id: null, total: { $sum: "$remainingBalance" } } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalOrders,
        pendingOrders,
        inProgressOrders,
        completedOrders,
        totalRevenue: totalRevenue[0]?.total || 0,
        totalAdvance: totalAdvance[0]?.total || 0,
        totalRemaining: totalRemaining[0]?.total || 0
      }
    });

  } catch (error) {
    console.error("❌ Error getting order stats:", error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};