import cron from 'node-cron';
import Order from '../models/Order.js';
import Admin from '../models/Admin.js';
import { sendDueDateReminder, sendWeeklySummary } from './emailService.js';

// Store sent notifications to avoid duplicates
const sentNotifications = new Map();

// Clear old notifications (older than 24 hours)
const clearOldNotifications = () => {
  const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
  for (const [key, timestamp] of sentNotifications.entries()) {
    if (timestamp < oneDayAgo) {
      sentNotifications.delete(key);
    }
  }
};

// Main cron job for due date notifications
export const startDueDateCron = () => {
  console.log('⏰ Starting due date notification cron job...');
  
  // Run every day at 8:00 AM
  cron.schedule('0 8 * * *', async () => {
    console.log('🔍 Checking for due date notifications at:', new Date().toLocaleString());
    
    try {
      // Clear old notifications
      clearOldNotifications();
      
      // Get all admins
      const admins = await Admin.find({}).select('name email');
      
      if (admins.length === 0) {
        console.log('⚠️ No admins found');
        return;
      }
      
      console.log(`📧 Sending notifications to ${admins.length} admins`);
      
      // Get current date
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Get all orders with dueDate that are not completed
      const orders = await Order.find({
        dueDate: { $ne: null },
        status: { $ne: 'completed' }
      }).populate('customer', 'name phone');
      
      console.log(`📦 Found ${orders.length} active projects with due dates`);
      
      for (const order of orders) {
        const dueDate = new Date(order.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        
        // Calculate days difference
        const diffTime = dueDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        console.log(`Project ${order.billNumber}: Due in ${diffDays} days`);
        
        // Check if we should send notification
        let shouldSend = false;
        let notificationType = '';
        
        // 5 days before due date
        if (diffDays === 5) {
          shouldSend = true;
          notificationType = '5days';
        }
        // On due date
        else if (diffDays === 0) {
          shouldSend = true;
          notificationType = 'due_today';
        }
        // Overdue (1, 3, 7 days after due date)
        else if (diffDays < 0) {
          const overdueDays = Math.abs(diffDays);
          if (overdueDays === 1 || overdueDays === 3 || overdueDays === 7 || overdueDays % 7 === 0) {
            shouldSend = true;
            notificationType = `overdue_${overdueDays}days`;
          }
        }
        
        // Check if already sent
        const notificationKey = `${order._id}_${notificationType}`;
        if (shouldSend && !sentNotifications.has(notificationKey)) {
          console.log(`📨 Sending notification for project ${order.billNumber} (${notificationType})`);
          
          // Prepare order details for email
          const orderDetails = {
            customerName: order.customer?.name || 'Unknown Customer',
            billNumber: order.billNumber,
            dueDate: order.dueDate,
            finalTotal: order.finalTotal,
            advancePayment: order.advancePayment,
            remainingBalance: order.remainingBalance,
            daysRemaining: diffDays
          };
          
          // Send email to all admins
          for (const admin of admins) {
            await sendDueDateReminder(admin.email, admin.name, orderDetails);
          }
          
          // Mark as sent
          sentNotifications.set(notificationKey, Date.now());
          console.log(`✅ Notification sent for project ${order.billNumber}`);
        }
      }
      
      console.log('✅ Due date check completed at:', new Date().toLocaleString());
      
    } catch (error) {
      console.error('❌ Error in due date cron job:', error);
    }
  });
  
  // Weekly summary every Monday at 9:00 AM
  cron.schedule('0 9 * * 1', async () => {
    console.log('📊 Sending weekly project summary...');
    
    try {
      const admins = await Admin.find({}).select('name email');
      const today = new Date();
      const nextWeek = new Date(today);
      nextWeek.setDate(today.getDate() + 7);
      
      // Get summary data
      const totalOrders = await Order.countDocuments();
      const overdue = await Order.countDocuments({
        dueDate: { $lt: today },
        status: { $ne: 'completed' }
      });
      const completed = await Order.countDocuments({ status: 'completed' });
      
      // Get projects due in next 7 days
      const dueThisWeek = await Order.find({
        dueDate: { $gte: today, $lte: nextWeek },
        status: { $ne: 'completed' }
      }).populate('customer', 'name').limit(5);
      
      const upcomingProjects = dueThisWeek.map(order => ({
        billNumber: order.billNumber,
        customerName: order.customer?.name || 'Unknown',
        daysLeft: Math.ceil((new Date(order.dueDate) - today) / (1000 * 60 * 60 * 24))
      }));
      
      const summary = {
        totalOrders,
        dueThisWeek: dueThisWeek.length,
        overdue,
        completed,
        upcomingProjects
      };
      
      // Send to all admins
      for (const admin of admins) {
        await sendWeeklySummary(admin.email, admin.name, summary);
      }
      
      console.log('✅ Weekly summary sent to all admins');
      
    } catch (error) {
      console.error('❌ Error sending weekly summary:', error);
    }
  });
  
  console.log('✅ All cron jobs started successfully');
};

// Manual check function
export const checkDueDatesManually = async () => {
  try {
    const admins = await Admin.find({}).select('name email');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const orders = await Order.find({
      dueDate: { $ne: null },
      status: { $ne: 'completed' }
    }).populate('customer', 'name phone');
    
    const notifications = [];
    
    for (const order of orders) {
      const dueDate = new Date(order.dueDate);
      dueDate.setHours(0, 0, 0, 0);
      
      const diffTime = dueDate - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays <= 5 && diffDays >= -30) {
        notifications.push({
          billNumber: order.billNumber,
          customerName: order.customer?.name,
          dueDate: order.dueDate,
          daysRemaining: diffDays,
          status: diffDays > 0 ? `${diffDays} days left` : diffDays === 0 ? 'Due Today' : `${Math.abs(diffDays)} days overdue`,
          finalTotal: order.finalTotal,
          advancePayment: order.advancePayment,
          remainingBalance: order.remainingBalance
        });
      }
    }
    
    return {
      totalAdmins: admins.length,
      admins: admins.map(a => ({ name: a.name, email: a.email })),
      notifications
    };
    
  } catch (error) {
    console.error('Error in manual check:', error);
    throw error;
  }
};