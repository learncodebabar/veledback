import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Create transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Verify connection configuration
transporter.verify(function(error, success) {
  if (error) {
    console.log('❌ Email server error:', error);
  } else {
    console.log('✅ Email server is ready to send messages');
  }
});

// Send due date reminder email
export const sendDueDateReminder = async (adminEmail, adminName, orderDetails) => {
  const { customerName, billNumber, dueDate, finalTotal, advancePayment, remainingBalance, daysRemaining } = orderDetails;
  
  let subject = '';
  let urgencyLevel = '';
  let bgColor = '';
  let borderColor = '';
  
  if (daysRemaining > 0) {
    subject = `Project Due Date Reminder: ${daysRemaining} days remaining - ${billNumber}`;
    urgencyLevel = 'Upcoming Project';
    bgColor = '#F59E0B';
    borderColor = '#F59E0B';
  } else if (daysRemaining === 0) {
    subject = `Project Due Today: ${billNumber}`;
    urgencyLevel = 'Due Today';
    bgColor = '#EF4444';
    borderColor = '#EF4444';
  } else {
    subject = `Project Overdue: ${Math.abs(daysRemaining)} days overdue - ${billNumber}`;
    urgencyLevel = 'Overdue Project';
    bgColor = '#DC2626';
    borderColor = '#DC2626';
  }
  
  // Format dates
  const formattedDueDate = new Date(dueDate).toLocaleDateString('en-PK', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  const mailOptions = {
    from: `"Welding ERP System" <${process.env.EMAIL_USER}>`,
    to: adminEmail,
    subject: subject,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Project Status Alert</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #F3F4F6;">
        
        <!-- Main Container -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #F3F4F6; padding: 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; width: 100%; background-color: #FFFFFF; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                
                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #1E40AF 0%, #3B82F6 100%); padding: 30px; text-align: center;">
                    <h1 style="color: #FFFFFF; margin: 0; font-size: 28px; font-weight: 600;">Project Status Alert</h1>
                    <p style="color: #E0F2FE; margin: 10px 0 0; font-size: 16px;">Hello, ${adminName}!</p>
                  </td>
                </tr>
                
                <!-- Urgency Badge -->
                <tr>
                  <td style="text-align: center; padding: 0 30px;">
                    <div style="display: inline-block; background-color: ${bgColor}; color: #FFFFFF; padding: 8px 24px; border-radius: 20px; font-weight: 600; font-size: 14px; margin-top: -20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                      ${urgencyLevel}
                    </div>
                  </td>
                </tr>
                
                <!-- Content -->
                <tr>
                  <td style="padding: 30px;">
                    
                    <!-- Alert Box -->
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #FEF2F2; border-left: 4px solid ${borderColor}; border-radius: 6px; margin-bottom: 24px;">
                      <tr>
                        <td style="padding: 16px;">
                          <p style="margin: 0; color: #1F2937; font-size: 15px; line-height: 1.6;">
                            ${daysRemaining > 0 
                              ? `This project is due in <strong style="color: ${bgColor};">${daysRemaining} days</strong>. Please ensure timely completion.` 
                              : daysRemaining === 0 
                              ? `<strong style="color: ${bgColor};">This project is due TODAY!</strong> Please complete it as soon as possible.`
                              : `<strong style="color: ${bgColor};">This project is ${Math.abs(daysRemaining)} days overdue!</strong> Immediate action required.`}
                          </p>
                        </td>
                      </tr>
                    </table>
                    
                    <!-- Project Details Card -->
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #F9FAFB; border-radius: 8px; border: 1px solid #E5E7EB; margin-bottom: 24px;">
                      <tr>
                        <td style="padding: 20px;">
                          <h3 style="margin: 0 0 15px 0; color: #111827; font-size: 18px; font-weight: 600; border-bottom: 1px solid #E5E7EB; padding-bottom: 12px;">Project Details</h3>
                          
                          <table width="100%" cellpadding="0" cellspacing="0" border="0">
                            <tr>
                              <td style="padding: 8px 0; color: #6B7280; width: 40%;">Bill Number:</td>
                              <td style="padding: 8px 0; font-weight: 600; color: #111827;">${billNumber}</td>
                            </tr>
                            <tr>
                              <td style="padding: 8px 0; color: #6B7280;">Customer Name:</td>
                              <td style="padding: 8px 0; font-weight: 600; color: #111827;">${customerName}</td>
                            </tr>
                            <tr>
                              <td style="padding: 8px 0; color: #6B7280;">Due Date:</td>
                              <td style="padding: 8px 0; font-weight: 600; color: ${bgColor};">${formattedDueDate}</td>
                            </tr>
                            <tr>
                              <td style="padding: 8px 0; color: #6B7280;">Time Remaining:</td>
                              <td style="padding: 8px 0;">
                                <span style="display: inline-block; background-color: ${bgColor}20; color: ${bgColor}; padding: 4px 12px; border-radius: 20px; font-size: 13px; font-weight: 500;">
                                  ${daysRemaining > 0 ? `${daysRemaining} days left` : daysRemaining === 0 ? 'Due today' : `${Math.abs(daysRemaining)} days overdue`}
                                </span>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                    
                    <!-- Payment Summary -->
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: linear-gradient(135deg, #F9FAFB 0%, #F3F4F6 100%); border-radius: 8px; margin-bottom: 24px;">
                      <tr>
                        <td style="padding: 20px;">
                          <h3 style="margin: 0 0 20px 0; color: #111827; font-size: 18px; font-weight: 600;">Payment Summary</h3>
                          
                          <table width="100%" cellpadding="0" cellspacing="0" border="0">
                            <tr>
                              <td width="33%" align="center" style="padding: 10px;">
                                <div style="font-size: 13px; color: #6B7280; margin-bottom: 5px;">Final Total</div>
                                <div style="font-size: 20px; font-weight: 700; color: #3B82F6;">Rs ${finalTotal.toFixed(2)}</div>
                              </td>
                              <td width="33%" align="center" style="padding: 10px;">
                                <div style="font-size: 13px; color: #6B7280; margin-bottom: 5px;">Advance</div>
                                <div style="font-size: 20px; font-weight: 700; color: #10B981;">Rs ${advancePayment.toFixed(2)}</div>
                              </td>
                              <td width="33%" align="center" style="padding: 10px;">
                                <div style="font-size: 13px; color: #6B7280; margin-bottom: 5px;">Remaining</div>
                                <div style="font-size: 20px; font-weight: 700; color: #EF4444;">Rs ${remainingBalance.toFixed(2)}</div>
                              </td>
                            </tr>
                          </table>
                          
                          <!-- Payment Status -->
                          <div style="text-align: center; margin-top: 15px;">
                            <span style="display: inline-block; background-color: ${remainingBalance === 0 ? '#D1FAE5' : remainingBalance < finalTotal ? '#FEF3C7' : '#FEE2E2'}; color: ${remainingBalance === 0 ? '#065F46' : remainingBalance < finalTotal ? '#92400E' : '#991B1B'}; padding: 6px 16px; border-radius: 20px; font-size: 13px; font-weight: 500;">
                              Payment Status: ${remainingBalance === 0 ? 'Fully Paid' : remainingBalance < finalTotal ? 'Partially Paid' : 'Pending'}
                            </span>
                          </div>
                        </td>
                      </tr>
                    </table>
                    
                    <!-- Action Buttons -->
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                     
                      </tr>
                    </table>
                    
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="background-color: #F9FAFB; padding: 20px; text-align: center; border-top: 1px solid #E5E7EB;">
                    <p style="margin: 0; color: #6B7280; font-size: 12px;">This is an automated notification from your Welding ERP System.</p>
                    <p style="margin: 5px 0 0; color: #6B7280; font-size: 12px;">© ${new Date().getFullYear()} All Rights Reserved</p>
                  </td>
                </tr>
                
              </table>
            </td>
          </tr>
        </table>
        
      </body>
      </html>
    `
  };
  
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent to ${adminEmail} for order ${billNumber}`);
    return { success: true, info };
  } catch (error) {
    console.error(`❌ Error sending email to ${adminEmail}:`, error);
    return { success: false, error };
  }
};

// Send weekly summary email
export const sendWeeklySummary = async (adminEmail, adminName, summary) => {
  const { totalOrders, dueThisWeek, overdue, completed, upcomingProjects } = summary;
  
  const mailOptions = {
    from: `"Welding ERP System" <${process.env.EMAIL_USER}>`,
    to: adminEmail,
    subject: `Weekly Project Summary - ${new Date().toLocaleDateString('en-PK', { month: 'long', day: 'numeric' })}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Weekly Project Summary</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #F3F4F6;">
        
        <!-- Main Container -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #F3F4F6; padding: 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; width: 100%; background-color: #FFFFFF; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                
                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #059669 0%, #10B981 100%); padding: 30px; text-align: center;">
                    <h1 style="color: #FFFFFF; margin: 0; font-size: 28px; font-weight: 600;">Weekly Project Summary</h1>
                    <p style="color: #D1FAE5; margin: 10px 0 0; font-size: 16px;">Hello, ${adminName}!</p>
                  </td>
                </tr>
                
                <!-- Content -->
                <tr>
                  <td style="padding: 30px;">
                    
                    <p style="font-size: 16px; color: #374151; margin-bottom: 25px; line-height: 1.6;">
                      Here's your weekly summary of all projects. Stay on top of your deadlines!
                    </p>
                    
                    <!-- Stats Grid -->
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 25px;">
                      <tr>
                        <td width="50%" style="padding: 5px;">
                          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: linear-gradient(135deg, #F9FAFB 0%, #F3F4F6 100%); border-radius: 8px;">
                            <tr>
                              <td style="padding: 20px; text-align: center;">
                                <div style="font-size: 32px; font-weight: 700; color: #3B82F6; margin-bottom: 5px;">${totalOrders}</div>
                                <div style="font-size: 14px; color: #6B7280;">Total Projects</div>
                              </td>
                            </tr>
                          </table>
                        </td>
                        <td width="50%" style="padding: 5px;">
                          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: linear-gradient(135deg, #F9FAFB 0%, #F3F4F6 100%); border-radius: 8px;">
                            <tr>
                              <td style="padding: 20px; text-align: center;">
                                <div style="font-size: 32px; font-weight: 700; color: #F59E0B; margin-bottom: 5px;">${dueThisWeek}</div>
                                <div style="font-size: 14px; color: #6B7280;">Due This Week</div>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td width="50%" style="padding: 5px;">
                          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: linear-gradient(135deg, #F9FAFB 0%, #F3F4F6 100%); border-radius: 8px;">
                            <tr>
                              <td style="padding: 20px; text-align: center;">
                                <div style="font-size: 32px; font-weight: 700; color: #EF4444; margin-bottom: 5px;">${overdue}</div>
                                <div style="font-size: 14px; color: #6B7280;">Overdue</div>
                              </td>
                            </tr>
                          </table>
                        </td>
                        <td width="50%" style="padding: 5px;">
                          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: linear-gradient(135deg, #F9FAFB 0%, #F3F4F6 100%); border-radius: 8px;">
                            <tr>
                              <td style="padding: 20px; text-align: center;">
                                <div style="font-size: 32px; font-weight: 700; color: #10B981; margin-bottom: 5px;">${completed}</div>
                                <div style="font-size: 14px; color: #6B7280;">Completed</div>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                    
                    <!-- Upcoming Deadlines -->
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #F9FAFB; border-radius: 8px; margin: 20px 0;">
                      <tr>
                        <td style="padding: 20px;">
                          <h3 style="margin: 0 0 15px 0; color: #111827; font-size: 18px; font-weight: 600;">Upcoming Deadlines (Next 7 Days)</h3>
                          
                          ${upcomingProjects.map(project => `
                            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-bottom: 1px solid #E5E7EB; padding: 12px 0;">
                              <tr>
                                <td>
                                  <div style="font-weight: 600; color: #111827;">${project.billNumber}</div>
                                  <div style="font-size: 13px; color: #6B7280;">${project.customerName}</div>
                                </td>
                                <td align="right">
                                  <span style="display: inline-block; background-color: #FEF3C7; color: #92400E; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 500;">
                                    ${project.daysLeft} days left
                                  </span>
                                </td>
                              </tr>
                            </table>
                          `).join('')}
                          
                          ${upcomingProjects.length === 0 ? `
                            <p style="color: #6B7280; text-align: center; margin: 20px 0;">No upcoming deadlines this week</p>
                          ` : ''}
                        </td>
                      </tr>
                    </table>
                    
                    <!-- View All Button -->
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td align="center" style="padding: 20px 0;">
                          <a href="${process.env.FRONTEND_URL}/all-customers" style="display: inline-block; background-color: #3B82F6; color: #FFFFFF; padding: 12px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 15px;">View All Projects</a>
                        </td>
                      </tr>
                    </table>
                    
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="background-color: #F9FAFB; padding: 20px; text-align: center; border-top: 1px solid #E5E7EB;">
                    <p style="margin: 0; color: #6B7280; font-size: 12px;">© ${new Date().getFullYear()} Welding ERP System</p>
                  </td>
                </tr>
                
              </table>
            </td>
          </tr>
        </table>
        
      </body>
      </html>
    `
  };
  
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Weekly summary sent to ${adminEmail}`);
    return { success: true, info };
  } catch (error) {
    console.error(`❌ Error sending weekly summary to ${adminEmail}:`, error);
    return { success: false, error };
  }
};

// Test email function
export const sendTestEmail = async (adminEmail, adminName) => {
  const mailOptions = {
    from: `"Welding ERP System" <${process.env.EMAIL_USER}>`,
    to: adminEmail,
    subject: 'Test Email - Notification System Active',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Test Email</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #F3F4F6;">
        
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #F3F4F6; padding: 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; width: 100%; background-color: #FFFFFF; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                
                <tr>
                  <td style="background: linear-gradient(135deg, #10B981 0%, #059669 100%); padding: 30px; text-align: center;">
                    <h1 style="color: #FFFFFF; margin: 0; font-size: 28px; font-weight: 600;">Email System Test</h1>
                  </td>
                </tr>
                
                <tr>
                  <td style="padding: 30px;">
                    <h2 style="color: #10B981; margin: 0 0 20px 0;">✅ Email System is Working!</h2>
                    
                    <p style="font-size: 16px; color: #374151; line-height: 1.6;">Hello ${adminName},</p>
                    
                    <p style="font-size: 16px; color: #374151; line-height: 1.6;">This is a test email to confirm that your email notification system is configured correctly.</p>
                    
                    <p style="font-size: 16px; color: #374151; line-height: 1.6; margin-top: 20px;">You will now receive notifications for:</p>
                    
                    <ul style="font-size: 16px; color: #374151; line-height: 1.8;">
                      <li>Projects due in 5 days</li>
                      <li>Projects due today</li>
                      <li>Overdue projects</li>
                      <li>Weekly project summaries</li>
                    </ul>
                    
                    <p style="font-size: 16px; color: #6B7280; margin-top: 30px;">Thank you for using Welding ERP System!</p>
                  </td>
                </tr>
                
                <tr>
                  <td style="background-color: #F9FAFB; padding: 20px; text-align: center; border-top: 1px solid #E5E7EB;">
                    <p style="margin: 0; color: #6B7280; font-size: 12px;">© ${new Date().getFullYear()} Welding ERP System</p>
                  </td>
                </tr>
                
              </table>
            </td>
          </tr>
        </table>
        
      </body>
      </html>
    `
  };
  
  try {
    const info = await transporter.sendMail(mailOptions);
    return { success: true, info };
  } catch (error) {
    return { success: false, error };
  }
};