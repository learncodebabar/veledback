import Admin from "../models/Admin.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";

// ======================
// Email Configuration
// ======================
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ======================
// 6-Digit OTP Generation Functions
// ======================
// Generate 6-digit OTP for registration
const generateRegistrationOTP = () => {
  return Math.floor(100000 + Math.random() * 900000);
};

// Generate 6-digit OTP for login
const generateLoginOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// ======================
// Email Sending Functions
// ======================
// Send Registration OTP Email (6-digit)
const sendRegistrationOTPEmail = async (email, otp, name) => {
  const mailOptions = {
    from: `"Welding Software" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Verify Your Admin Account - Welding Software",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: 'Segoe UI', Arial, sans-serif;
            margin: 0;
            padding: 0;
            background-color: #f5f5f5;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 30px;
            text-align: center;
          }
          .header h1 {
            color: #ffffff;
            margin: 0;
            font-size: 28px;
          }
          .header p {
            color: #ffffff;
            margin: 10px 0 0;
            opacity: 0.9;
          }
          .content {
            padding: 40px 30px;
          }
          .content h2 {
            color: #333;
            margin-top: 0;
          }
          .content p {
            color: #666;
            line-height: 1.6;
            margin-bottom: 25px;
          }
          .otp-box {
            background-color: #f8f9fa;
            border: 2px dashed #667eea;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
            margin: 25px 0;
          }
          .otp-box p {
            color: #666;
            margin: 0 0 10px;
            font-size: 14px;
          }
          .otp-code {
            font-size: 42px;
            font-weight: bold;
            color: #667eea;
            letter-spacing: 8px;
            font-family: monospace;
          }
          .footer {
            background-color: #f8f9fa;
            padding: 20px;
            text-align: center;
            border-top: 1px solid #eee;
          }
          .footer p {
            color: #999;
            margin: 0;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welding Software</h1>
            <p>Admin Account Verification</p>
          </div>
          
          <div class="content">
            <h2>Hello ${name || "Admin"}!</h2>
            <p>Thank you for registering as an administrator. Please use the following 6-digit OTP to verify your email address and complete your registration:</p>
            
            <div class="otp-box">
              <p>Your Verification Code</p>
              <div class="otp-code">${otp}</div>
            </div>
            
            <p>This OTP is valid for <strong>10 minutes</strong>. Please do not share this code with anyone.</p>
            
            <p style="color: #999; font-size: 14px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
              If you didn't request this verification, please ignore this email.
            </p>
          </div>
          
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Welding Software. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  await transporter.sendMail(mailOptions);
};

// Send Login OTP Email (6-digit)
const sendLoginOTPEmail = async (email, otp, name) => {
  const mailOptions = {
    from: `"Welding Software" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Login Verification Code - Welding Software",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: 'Segoe UI', Arial, sans-serif;
            margin: 0;
            padding: 0;
            background-color: #f5f5f5;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 30px;
            text-align: center;
          }
          .header h1 {
            color: #ffffff;
            margin: 0;
            font-size: 28px;
          }
          .header p {
            color: #ffffff;
            margin: 10px 0 0;
            opacity: 0.9;
          }
          .content {
            padding: 40px 30px;
          }
          .content h2 {
            color: #333;
            margin-top: 0;
          }
          .content p {
            color: #666;
            line-height: 1.6;
            margin-bottom: 25px;
          }
          .otp-box {
            background-color: #f8f9fa;
            border: 2px dashed #667eea;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
            margin: 25px 0;
          }
          .otp-box p {
            color: #666;
            margin: 0 0 10px;
            font-size: 14px;
          }
          .otp-code {
            font-size: 42px;
            font-weight: bold;
            color: #667eea;
            letter-spacing: 8px;
            font-family: monospace;
          }
          .footer {
            background-color: #f8f9fa;
            padding: 20px;
            text-align: center;
            border-top: 1px solid #eee;
          }
          .footer p {
            color: #999;
            margin: 0;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welding Software</h1>
            <p>Login Verification</p>
          </div>
          
          <div class="content">
            <h2>Hello ${name || "Admin"}!</h2>
            <p>We received a login request for your account. Please use the following 6-digit verification code to complete your login:</p>
            
            <div class="otp-box">
              <p>Your Verification Code</p>
              <div class="otp-code">${otp}</div>
            </div>
            
            <p>This code is valid for <strong>5 minutes</strong>. Please do not share this code with anyone.</p>
            
            <p style="color: #999; font-size: 14px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
              If you didn't request this login, please ignore this email or contact support immediately.
            </p>
          </div>
          
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Welding Software. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  await transporter.sendMail(mailOptions);
};

// ======================
// OTP Storage (Temporary - In production use Redis)
// ======================
const loginOtpStore = new Map();

// Clean up expired OTPs every minute
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of loginOtpStore.entries()) {
    if (value.expiresAt < now) {
      loginOtpStore.delete(key);
    }
  }
}, 60000);

// ======================
// REGISTRATION OTP FUNCTIONS (6-digit)
// ======================

// Step 1: Send 6-digit OTP for registration
export const sendRegistrationOTP = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({ 
        success: false,
        message: "Please provide name, email and password" 
      });
    }

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email: email.toLowerCase() });
    if (existingAdmin) {
      return res.status(400).json({ 
        success: false,
        message: "Admin with this email already exists" 
      });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({ 
        success: false,
        message: "Password must be at least 6 characters" 
      });
    }

    // Generate 6-digit OTP
    const otp = generateRegistrationOTP();
    const verificationExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Send OTP email
    await sendRegistrationOTPEmail(email, otp, name);

    // Store registration data temporarily in JWT
    const tempToken = jwt.sign(
      { 
        name, 
        email: email.toLowerCase(), 
        password,
        otp,
        verificationExpires 
      },
      process.env.JWT_SECRET,
      { expiresIn: "10m" }
    );

    res.status(200).json({
      success: true,
      message: "6-digit OTP sent successfully to your email",
      tempToken
    });

  } catch (err) {
    console.error("Send OTP error:", err);
    res.status(500).json({ 
      success: false,
      message: "Failed to send OTP. Please try again." 
    });
  }
};

// Step 2: Verify 6-digit OTP and complete registration
export const verifyOTPAndRegister = async (req, res) => {
  try {
    const { otp, tempToken } = req.body;

    if (!otp || !tempToken) {
      return res.status(400).json({
        success: false,
        message: "OTP and verification token are required"
      });
    }

    // Verify and decode the temp token
    let decoded;
    try {
      decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(400).json({
        success: false,
        message: "Verification session expired. Please start over."
      });
    }

    const { name, email, password, otp: storedOtp, verificationExpires } = decoded;

    // Check if OTP matches (6-digit)
    if (parseInt(otp) !== storedOtp) {
      return res.status(400).json({
        success: false,
        message: "Invalid 6-digit OTP code"
      });
    }

    // Check if OTP is expired
    if (new Date() > new Date(verificationExpires)) {
      return res.status(400).json({
        success: false,
        message: "OTP has expired. Please request a new one."
      });
    }

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        message: "Admin with this email already exists"
      });
    }

    // Create admin account
    const admin = new Admin({
      name,
      email,
      password,
      verificationCode: null,
      verificationExpires: null
    });

    await admin.save();

    // Generate JWT token for auto-login
    const token = jwt.sign(
      { id: admin._id, email: admin.email, name: admin.name, role: "admin" },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.status(201).json({
      success: true,
      message: "Registration successful! Account verified and created.",
      token,
      user: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        createdAt: admin.createdAt
      }
    });

  } catch (err) {
    console.error("Verify OTP error:", err);
    res.status(500).json({
      success: false,
      message: "Verification failed. Please try again."
    });
  }
};

// Step 3: Resend registration OTP (6-digit)
export const resendRegistrationOTP = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required"
      });
    }

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email: email.toLowerCase() });
    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        message: "Admin with this email already exists"
      });
    }

    // Generate new 6-digit OTP
    const otp = generateRegistrationOTP();
    const verificationExpires = new Date(Date.now() + 10 * 60 * 1000);

    // Send OTP email
    await sendRegistrationOTPEmail(email, otp, name || "Admin");

    // Create new temp token
    const tempToken = jwt.sign(
      { 
        name: name || "Admin", 
        email: email.toLowerCase(), 
        password: password || "",
        otp,
        verificationExpires 
      },
      process.env.JWT_SECRET,
      { expiresIn: "10m" }
    );

    res.status(200).json({
      success: true,
      message: "New 6-digit OTP sent successfully to your email",
      tempToken
    });

  } catch (err) {
    console.error("Resend OTP error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to resend OTP. Please try again."
    });
  }
};

// ======================
// LOGIN OTP FUNCTIONS (6-digit)
// ======================

// Step 1: Verify credentials and send 6-digit login OTP
export const loginWithOTP = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        message: "Please provide email and password" 
      });
    }

    // Find admin
    const admin = await Admin.findOne({ email: email.toLowerCase() });
    if (!admin) {
      return res.status(401).json({ 
        success: false,
        message: "Invalid email or password" 
      });
    }

    // Verify password
    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ 
        success: false,
        message: "Invalid email or password" 
      });
    }

    // Generate 6-digit OTP
    const otp = generateLoginOTP();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes expiry

    // Store OTP
    loginOtpStore.set(email.toLowerCase(), {
      otp,
      expiresAt,
      adminId: admin._id,
      name: admin.name
    });

    // Send OTP email
    await sendLoginOTPEmail(email, otp, admin.name);

    res.status(200).json({
      success: true,
      message: "6-digit verification code sent to your email",
      requiresOTP: true,
      email: email.toLowerCase()
    });

  } catch (err) {
    console.error("Login OTP error:", err);
    res.status(500).json({ 
      success: false,
      message: "Failed to send verification code. Please try again." 
    });
  }
};

// Step 2: Verify 6-digit login OTP and complete login
export const verifyLoginOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ 
        success: false,
        message: "Email and verification code are required" 
      });
    }

    // Get stored OTP
    const storedData = loginOtpStore.get(email.toLowerCase());
    
    if (!storedData) {
      return res.status(400).json({ 
        success: false,
        message: "No verification request found. Please login again." 
      });
    }

    // Check if OTP expired
    if (Date.now() > storedData.expiresAt) {
      loginOtpStore.delete(email.toLowerCase());
      return res.status(400).json({ 
        success: false,
        message: "Verification code has expired. Please request a new one." 
      });
    }

    // Verify 6-digit OTP
    if (storedData.otp !== otp) {
      return res.status(400).json({ 
        success: false,
        message: "Invalid 6-digit verification code" 
      });
    }

    // Get admin details
    const admin = await Admin.findById(storedData.adminId);
    if (!admin) {
      return res.status(404).json({ 
        success: false,
        message: "Admin account not found" 
      });
    }

    // Update last login
    admin.lastLogin = new Date();
    await admin.save();

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: admin._id, 
        email: admin.email, 
        name: admin.name,
        role: "admin"
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    // Clear OTP from store
    loginOtpStore.delete(email.toLowerCase());

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        lastLogin: admin.lastLogin
      }
    });

  } catch (err) {
    console.error("Verify OTP error:", err);
    res.status(500).json({ 
      success: false,
      message: "Verification failed. Please try again." 
    });
  }
};

// Step 3: Resend login OTP (6-digit)
export const resendLoginOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ 
        success: false,
        message: "Email is required" 
      });
    }

    // Find admin
    const admin = await Admin.findOne({ email: email.toLowerCase() });
    if (!admin) {
      return res.status(404).json({ 
        success: false,
        message: "Admin account not found" 
      });
    }

    // Generate new 6-digit OTP
    const otp = generateLoginOTP();
    const expiresAt = Date.now() + 5 * 60 * 1000;

    // Store new OTP
    loginOtpStore.set(email.toLowerCase(), {
      otp,
      expiresAt,
      adminId: admin._id,
      name: admin.name
    });

    // Send new OTP email
    await sendLoginOTPEmail(email, otp, admin.name);

    res.status(200).json({
      success: true,
      message: "New 6-digit verification code sent to your email"
    });

  } catch (err) {
    console.error("Resend login OTP error:", err);
    res.status(500).json({ 
      success: false,
      message: "Failed to resend verification code. Please try again." 
    });
  }
};

// ======================
// TRADITIONAL LOGIN (Without OTP - for backward compatibility)
// ======================
export const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const admin = await Admin.findOne({ email });
    if (!admin)
      return res.status(400).json({ message: "Invalid email or password" });

    const match = await admin.comparePassword(password);
    if (!match)
      return res.status(400).json({ message: "Invalid email or password" });

    // Update last login
    admin.lastLogin = new Date();
    await admin.save();

    // Generate JWT
    const token = jwt.sign(
      { id: admin._id, email: admin.email, name: admin.name },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({ 
      success: true,
      message: "Login successful", 
      token,
      user: {
        id: admin._id,
        name: admin.name,
        email: admin.email
      }
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
};

// ======================
// TRADITIONAL REGISTRATION (Without OTP - for backward compatibility)
// ======================
export const registerAdmin = async (req, res) => {
  try {
    const exists = await Admin.findOne();
    if (exists)
      return res.status(400).json({ message: "Admin already exists" });

    const { name, email, password } = req.body;
    const admin = new Admin({ name, email, password });
    await admin.save();

    res.status(201).json({ message: "Admin registered" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
};

// ======================
// PROFILE FUNCTIONS
// ======================
export const getAdminProfile = async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin.id).select('-password');
    
    if (!admin) {
      return res.status(404).json({ 
        success: false,
        message: "Admin not found" 
      });
    }

    res.json({
      success: true,
      user: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        createdAt: admin.createdAt,
        lastLogin: admin.lastLogin
      }
    });
  } catch (err) {
    console.error("Profile error:", err);
    res.status(500).json({ 
      success: false,
      message: "Server error" 
    });
  }
};

export const updateAdminProfile = async (req, res) => {
  try {
    const { name, email } = req.body;
    const admin = await Admin.findById(req.admin.id);

    if (!admin) {
      return res.status(404).json({ 
        success: false,
        message: "Admin not found" 
      });
    }

    // Update name if provided
    if (name) {
      if (name.length < 3) {
        return res.status(400).json({ 
          success: false,
          message: "Name must be at least 3 characters" 
        });
      }
      admin.name = name;
    }

    // Update email if provided
    if (email && email !== admin.email) {
      // Check if email already exists
      const emailExists = await Admin.findOne({ email, _id: { $ne: req.admin.id } });
      if (emailExists) {
        return res.status(400).json({ 
          success: false,
          message: "Email already in use" 
        });
      }
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ 
          success: false,
          message: "Invalid email format" 
        });
      }
      
      admin.email = email;
    }

    await admin.save();

    res.json({
      success: true,
      message: "Profile updated successfully",
      user: {
        id: admin._id,
        name: admin.name,
        email: admin.email
      }
    });
  } catch (err) {
    console.error("Update profile error:", err);
    res.status(500).json({ 
      success: false,
      message: "Server error" 
    });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const admin = await Admin.findById(req.admin.id);

    if (!admin) {
      return res.status(404).json({ 
        success: false,
        message: "Admin not found" 
      });
    }

    // Validate current password
    const match = await admin.comparePassword(currentPassword);
    if (!match) {
      return res.status(400).json({ 
        success: false,
        message: "Current password is incorrect" 
      });
    }

    // Validate new password
    if (!newPassword) {
      return res.status(400).json({ 
        success: false,
        message: "New password is required" 
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ 
        success: false,
        message: "Password must be at least 6 characters" 
      });
    }

    // Update password
    admin.password = newPassword;
    await admin.save();

    res.json({
      success: true,
      message: "Password changed successfully"
    });
  } catch (err) {
    console.error("Change password error:", err);
    res.status(500).json({ 
      success: false,
      message: "Server error" 
    });
  }
};

export const checkAdminExists = async (req, res) => {
  try {
    const admin = await Admin.findOne({});
    res.json({ 
      success: true, 
      exists: !!admin 
    });
  } catch (err) {
    console.error("Check admin error:", err);
    res.status(500).json({ 
      success: false, 
      message: "Server error" 
    });
  }
};