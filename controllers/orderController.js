// backend/controllers/orderController.js
import Order from "../models/Order.js";
import Customer from "../models/Customer.js";
import QuotationCustomer from "../models/quotationCustomer.js";
import Admin from "../models/Admin.js";
import Quotation from "../models/quotation.js";
import { sendDueDateReminder } from "../utils/emailService.js";

// Helper function to find or create customer from quotation data
const findOrCreateCustomerFromQuotation = async (quotation) => {
  try {
    // First try to find by phone in regular Customer collection
    let customer = await Customer.findOne({ phone: quotation.customerPhone });
    
    if (customer) {
      console.log("✅ Found existing regular customer by phone:", customer.name);
      return customer;
    }
    
    // If not found, try to find by name
    customer = await Customer.findOne({ name: quotation.customerName });
    
    if (customer) {
      console.log("✅ Found existing regular customer by name:", customer.name);
      return customer;
    }
    
    // Create new customer from quotation data
    customer = new Customer({
      name: quotation.customerName,
      phone: quotation.customerPhone || '',
      address: quotation.customerAddress || '',
      orders: []
    });
    
    await customer.save();
    console.log("✅ Created new customer from quotation:", customer.name);
    
    return customer;
  } catch (error) {
    console.error("❌ Error finding/creating customer:", error);
    throw error;
  }
};

// ✅ Create Order from Quotation
export const createOrderFromQuotation = async (req, res) => {
  try {
    const { quotationId, finalTotal, advancePayment, dueDate, notes, status, items } = req.body;
    
    console.log("📦 Creating order from quotation:", { 
      quotationId, 
      finalTotal, 
      advancePayment, 
      itemsCount: items?.length 
    });
    
    // Validate required fields
    if (!quotationId) {
      return res.status(400).json({
        success: false,
        message: "Quotation ID is required"
      });
    }
    
    // Find quotation
    const quotation = await Quotation.findById(quotationId);
    if (!quotation) {
      return res.status(404).json({
        success: false,
        message: "Quotation not found"
      });
    }
    
    console.log("✅ Quotation found:", quotation.quotationNumber);
    
    // Check if already converted
    if (quotation.status === 'converted') {
      return res.status(400).json({
        success: false,
        message: "This quotation has already been converted to an order"
      });
    }
    
    // Generate bill number
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    const billNumber = `ORD-${timestamp.toString().slice(-8)}-${random}`;
    
    // Calculate amounts
    const finalTotalAmount = finalTotal || quotation.grandTotal;
    const advancePaymentAmount = advancePayment || 0;
    const remainingBalance = finalTotalAmount - advancePaymentAmount;
    
    // Determine payment status - FIXED LOGIC
    let paymentStatus = 'pending';
    if (advancePaymentAmount >= finalTotalAmount) {
      paymentStatus = 'paid';
      console.log("✅ Full payment detected - Status: paid");
    } else if (advancePaymentAmount > 0) {
      paymentStatus = 'partial';
      console.log("⚠️ Partial payment detected - Status: partial");
    } else {
      paymentStatus = 'pending';
      console.log("⏳ No payment detected - Status: pending");
    }
    
    // Find or create regular customer from quotation data
    const customer = await findOrCreateCustomerFromQuotation(quotation);
    
    // Prepare order items
    let orderItems = [];
    
    if (items && items.length > 0) {
      // Use items from the request (from CreateQuotationOrder page)
      orderItems = items.map(item => ({
        itemName: item.itemName || item.name,
        quantity: Number(item.quantity) || 1,
        unitPrice: Number(item.unitPrice) || Number(item.rate) || 0,
        totalPrice: Number(item.totalPrice) || Number(item.total) || ((Number(item.quantity) || 1) * (Number(item.unitPrice) || Number(item.rate) || 0)),
        notes: item.notes || ''
      }));
    } else if (quotation.items && quotation.items.length > 0) {
      // Convert quotation items to order items
      quotation.items.forEach(item => {
        if (item.materials && item.materials.length > 0) {
          item.materials.forEach(material => {
            orderItems.push({
              itemName: material.name || item.title || 'Material',
              quantity: Number(material.quantity) || 1,
              unitPrice: Number(material.pricePerUnit) || 0,
              totalPrice: Number(material.totalPrice) || 0,
              notes: item.notes || ''
            });
          });
        } else {
          orderItems.push({
            itemName: item.title || 'Work Item',
            quantity: 1,
            unitPrice: Number(item.subtotal) || 0,
            totalPrice: Number(item.subtotal) || 0,
            notes: item.notes || ''
          });
        }
      });
    }
    
    if (orderItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No items found in quotation"
      });
    }
    
    console.log(`📦 Creating order with ${orderItems.length} items`);
    
    // Create order
    const order = new Order({
      customer: customer._id,
      items: orderItems,
      finalTotal: Number(finalTotalAmount),
      advancePayment: Number(advancePaymentAmount),
      remainingBalance: Number(remainingBalance),
      paymentStatus: paymentStatus,
      billNumber: billNumber,
      date: new Date(),
      dueDate: dueDate || null,
      status: status || 'pending',
      notes: notes || `Order created from quotation: ${quotation.quotationNumber || quotation._id}`,
      quotationId: quotation._id
    });
    
    await order.save();
    console.log("✅ Order saved:", order._id);
    console.log("📊 Payment Status after save:", order.paymentStatus);
    
    // Update quotation
    quotation.orderId = order._id;
    quotation.status = 'converted';
    await quotation.save();
    console.log("✅ Quotation updated to converted status");
    
    // Add order to customer's orders array
    await Customer.findByIdAndUpdate(
      customer._id,
      { $push: { orders: order._id } }
    );
    
    // Update QuotationCustomer stats if exists
    if (quotation.customer) {
      await QuotationCustomer.findByIdAndUpdate(
        quotation.customer,
        { 
          $inc: { totalQuotations: 1 }, 
          lastQuotationDate: new Date() 
        }
      );
      console.log("✅ QuotationCustomer stats updated");
    }
    
    // Populate customer details
    const populatedOrder = await Order.findById(order._id)
      .populate('customer', 'name phone address');
    
    res.status(201).json({
      success: true,
      message: "Order created successfully from quotation",
      order: populatedOrder
    });
    
  } catch (error) {
    console.error("❌ Error creating order from quotation:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error creating order from quotation"
    });
  }
};

// ✅ Regular Create Order
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

    // Validate items if provided
    if (req.body.items && req.body.items.length > 0) {
      for (const item of req.body.items) {
        if (!item.itemName || !item.quantity || !item.unitPrice) {
          return res.status(400).json({ 
            success: false, 
            message: "Each item must have itemName, quantity, and unitPrice" 
          });
        }
      }
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

    // Calculate item totals if items are provided
    let items = [];
    if (req.body.items && req.body.items.length > 0) {
      items = req.body.items.map(item => ({
        itemName: item.itemName,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        totalPrice: Number(item.quantity) * Number(item.unitPrice),
        notes: item.notes || ''
      }));
    }

    // Generate bill number if not provided
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    const billNumber = req.body.billNumber || `ORD-${timestamp.toString().slice(-8)}-${random}`;

    // Calculate payment status
    const advancePayment = Number(req.body.advancePayment || 0);
    const finalTotal = Number(req.body.finalTotal);
    let paymentStatus = 'pending';
    
    if (advancePayment >= finalTotal) {
      paymentStatus = 'paid';
      console.log("✅ Full payment detected - Status: paid");
    } else if (advancePayment > 0) {
      paymentStatus = 'partial';
      console.log("⚠️ Partial payment detected - Status: partial");
    }

    // Create order
    const order = new Order({
      customer: req.body.customer,
      items: items,
      billNumber: billNumber,
      finalTotal: finalTotal,
      advancePayment: advancePayment,
      remainingBalance: finalTotal - advancePayment,
      paymentStatus: paymentStatus, // Set payment status explicitly
      status: req.body.status || 'pending',
      notes: req.body.notes || '',
      date: req.body.date || new Date(),
      dueDate: req.body.dueDate || null,
      quotationId: req.body.quotationId || null
    });

    const savedOrder = await order.save();
    console.log("✅ Order saved:", savedOrder._id);
    console.log("📊 Payment Status after save:", savedOrder.paymentStatus);

    // Update customer with new order
    await Customer.findByIdAndUpdate(
      req.body.customer,
      { $push: { orders: savedOrder._id } }
    );

    // Populate customer details for response
    const populatedOrder = await Order.findById(savedOrder._id)
      .populate("customer", "name phone address");

    // Send email notifications to admins
    try {
      const admins = await Admin.find({}).select('name email');
      
      if (admins.length > 0) {
        console.log(`📧 Sending new order notification to ${admins.length} admins`);
        
        let daysRemaining = null;
        if (savedOrder.dueDate) {
          const today = new Date();
          const dueDate = new Date(savedOrder.dueDate);
          const diffTime = dueDate - today;
          daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        }
        
        const orderDetails = {
          customerName: customerExists.name,
          billNumber: savedOrder.billNumber,
          dueDate: savedOrder.dueDate || new Date(),
          finalTotal: savedOrder.finalTotal,
          advancePayment: savedOrder.advancePayment,
          remainingBalance: savedOrder.remainingBalance,
          daysRemaining: daysRemaining !== null ? daysRemaining : 0,
          status: savedOrder.status,
          items: savedOrder.items
        };
        
        for (const admin of admins) {
          await sendDueDateReminder(admin.email, admin.name, orderDetails);
        }
        
        console.log(`✅ New order notifications sent successfully`);
      }
    } catch (emailError) {
      console.error("❌ Error sending new order email notifications:", emailError);
    }

    res.status(201).json({
      success: true,
      data: populatedOrder,
    });

  } catch (error) {
    console.error("❌ Error creating order:", error);
    
    if (error.code === 11000) {
      return res.status(400).json({ 
        success: false, 
        message: "Bill number already exists. Please try again." 
      });
    }

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

// ✅ Update Order - FIXED with proper payment status update
export const updateOrder = async (req, res) => {
  try {
    const originalOrder = await Order.findById(req.params.id);
    
    if (!originalOrder) {
      return res.status(404).json({ 
        success: false, 
        message: "Order not found" 
      });
    }

    console.log("🔄 Updating order:", req.params.id);
    console.log("📊 Original payment status:", originalOrder.paymentStatus);
    console.log("📊 Original advance:", originalOrder.advancePayment);
    console.log("📊 Original final total:", originalOrder.finalTotal);

    // Calculate new values if payment or total is being updated
    if (req.body.finalTotal !== undefined || req.body.advancePayment !== undefined) {
      const finalTotal = req.body.finalTotal !== undefined ? Number(req.body.finalTotal) : originalOrder.finalTotal;
      const advancePayment = req.body.advancePayment !== undefined ? Number(req.body.advancePayment) : originalOrder.advancePayment;
      
      req.body.remainingBalance = finalTotal - advancePayment;
      
      // CRITICAL: Update payment status based on new values
      if (advancePayment >= finalTotal) {
        req.body.paymentStatus = 'paid';
        console.log("✅ Payment status updated to: PAID");
        console.log(`   Advance: ${advancePayment}, Final Total: ${finalTotal}`);
      } else if (advancePayment > 0) {
        req.body.paymentStatus = 'partial';
        console.log("⚠️ Payment status updated to: PARTIAL");
        console.log(`   Advance: ${advancePayment}, Final Total: ${finalTotal}`);
      } else {
        req.body.paymentStatus = 'pending';
        console.log("⏳ Payment status updated to: PENDING");
      }
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate("customer", "name phone address");

    if (!updatedOrder) {
      return res.status(404).json({ 
        success: false, 
        message: "Order not found" 
      });
    }

    console.log("✅ Order updated successfully");
    console.log("📊 New payment status:", updatedOrder.paymentStatus);
    console.log("📊 New advance:", updatedOrder.advancePayment);
    console.log("📊 New remaining balance:", updatedOrder.remainingBalance);

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

// ✅ Add Payment to Order - FIXED with proper status update
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

    console.log("💰 Adding payment to order:", req.params.id);
    console.log("📊 Current advance:", order.advancePayment);
    console.log("📊 Current payment status:", order.paymentStatus);
    console.log("💰 Payment amount:", paymentAmount);
    console.log("📊 Final total:", order.finalTotal);

    // Update advance payment
    const newAdvancePayment = (order.advancePayment || 0) + paymentAmount;
    order.advancePayment = newAdvancePayment;
    order.remainingBalance = order.finalTotal - newAdvancePayment;

    // CRITICAL: Update payment status based on new advance payment
    if (newAdvancePayment >= order.finalTotal) {
      order.paymentStatus = 'paid';
      console.log("✅ FULL PAYMENT! Status updated to: PAID");
      console.log(`   Total paid: ${newAdvancePayment}, Total due: ${order.finalTotal}`);
    } else if (newAdvancePayment > 0) {
      order.paymentStatus = 'partial';
      console.log("⚠️ PARTIAL PAYMENT! Status updated to: PARTIAL");
      console.log(`   Paid so far: ${newAdvancePayment}, Remaining: ${order.remainingBalance}`);
    }
    // Note: Status remains 'pending' if advance is still 0

    await order.save();
    console.log("✅ Payment added and order saved");

    const updatedOrder = await Order.findById(order._id)
      .populate("customer", "name phone address");

    console.log("📊 Final payment status after save:", updatedOrder.paymentStatus);
    console.log("📊 Final advance payment:", updatedOrder.advancePayment);
    console.log("📊 Final remaining balance:", updatedOrder.remainingBalance);

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
    
    // Payment status statistics
    const paidOrders = await Order.countDocuments({ paymentStatus: 'paid' });
    const partialOrders = await Order.countDocuments({ paymentStatus: 'partial' });
    const pendingPaymentOrders = await Order.countDocuments({ paymentStatus: 'pending' });
    
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
        paidOrders,
        partialOrders,
        pendingPaymentOrders,
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

// ✅ Get Orders by Payment Status
export const getOrdersByPaymentStatus = async (req, res) => {
  try {
    const { status } = req.params;
    
    if (!['pending', 'partial', 'paid'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment status. Must be 'pending', 'partial', or 'paid'"
      });
    }
    
    const orders = await Order.find({ paymentStatus: status })
      .populate("customer", "name phone address")
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders
    });
    
  } catch (error) {
    console.error("❌ Error fetching orders by payment status:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};