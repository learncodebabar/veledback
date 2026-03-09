import nodemailer from 'nodemailer';

// Create transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Generate random 8-digit OTP
export const generateOTP = () => {
  return Math.floor(10000000 + Math.random() * 90000000).toString();
};

// Send OTP email
export const sendOTPEmail = async (email, otp) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Login Verification Code - Welding Software',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #2563eb; margin-bottom: 5px;">Welding Software</h1>
          <p style="color: #64748b;">Account Security Verification</p>
        </div>
        
        <div style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); padding: 30px; border-radius: 10px; text-align: center;">
          <h2 style="color: white; margin-bottom: 10px;">Your Verification Code</h2>
          <div style="background: white; padding: 20px; border-radius: 10px; display: inline-block;">
            <span style="font-size: 36px; font-weight: bold; letter-spacing: 5px; color: #2563eb;">${otp}</span>
          </div>
          <p style="color: white; margin-top: 20px; font-size: 14px;">This code will expire in 10 minutes</p>
        </div>
        
        <div style="margin-top: 20px; padding: 20px; background: #f8fafc; border-radius: 10px;">
          <p style="color: #334155; margin-bottom: 10px;"><strong>Security Tips:</strong></p>
          <ul style="color: #64748b; font-size: 14px; padding-left: 20px;">
            <li>Never share this code with anyone</li>
            <li>Our team will never ask for this code</li>
            <li>If you didn't request this, please change your password immediately</li>
          </ul>
        </div>
        
        <div style="text-align: center; margin-top: 20px; color: #94a3b8; font-size: 12px;">
          <p>This is an automated message, please do not reply.</p>
          <p>&copy; 2024 Welding Software. All rights reserved.</p>
        </div>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ OTP sent to ${email}`);
    return true;
  } catch (error) {
    console.error('❌ Error sending email:', error);
    throw error;
  }
};