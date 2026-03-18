import Role from "../models/Role.js";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import crypto from "crypto";


import dotenv from "dotenv";
dotenv.config();
// Store OTPs temporarily (in production, use Redis)
const otpStore = new Map();

// const transporter = nodemailer.createTransport({
//   service: "gmail",
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASS
//   }
// });
// TEMPORARY TESTING ONLY - Remove in production

 const  MyEmail = process.env.EMAIL_USER
 const  MyPassword=  process.env.EMAIL_PASS
// const MyPassword =process.env.EMAIL_PASS


const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: MyEmail,
    pass: MyPassword 
  }
});

transporter.verify((error, success) => {
  if (error) {
    console.log('❌ Email connection error:', error);
  } else {
    console.log('✅ Email server is ready to send messages');
  }
});

// ======================
// Generate OTP
// ======================
const generateOTP = () => {
  return crypto.randomInt(100000, 999999).toString();
};

// ======================
// Send OTP Email (Gmail Inbox)
// ======================
const sendOTPEmail = async (email, otp) => {
  const mailOptions = {
    from: `"ERP System" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: ' Your Login OTP - Role Dashboard',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f4f6f9;">
        <div style="max-width: 600px; margin: 20px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #667eea 0%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;"> Role Dashboard</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0; font-size: 16px;">Login Verification</p>
          </div>
          
          <!-- Body -->
          <div style="padding: 40px 30px;">
            <h2 style="color: #333; margin-top: 0; font-size: 24px;">Hello!</h2>
            <p style="color: #666; line-height: 1.6; font-size: 16px;">
              You requested to login to your Role Dashboard. Use the following OTP to complete your login:
            </p>
            
            <!-- OTP Box -->
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 25px; border-radius: 12px; text-align: center; margin: 30px 0;">
              <div style="font-size: 48px; font-weight: bold; letter-spacing: 10px; color: white; font-family: monospace;">
                ${otp}
              </div>
            </div>
            
            <div style="background: #f8f9fa; border-left: 4px solid #667eea; padding: 15px; margin: 20px 0;">
              <p style="color: #555; margin: 0; font-size: 14px;">
                <strong> Valid for:</strong> 5 minutes<br>
                <strong> Security:</strong> Never share this OTP with anyone
              </p>
            </div>
            
            <p style="color: #888; font-size: 14px; line-height: 1.6; margin-top: 30px;">
              If you didn't request this login, please ignore this email or contact support immediately.
            </p>
          </div>
          
          <!-- Footer -->
          <div style="background: #f4f6f9; padding: 20px; text-align: center; border-top: 1px solid #e0e4e9;">
            <p style="color: #999; margin: 0; font-size: 12px;">
              This is an automated message, please do not reply to this email.
            </p>
            <p style="color: #999; margin: 5px 0 0; font-size: 12px;">
              &copy; 2025 ERP System. All rights reserved.
            </p>
          </div>
        </div>
      </body>
      </html>
    `,
    // Plain text version for email clients that don't support HTML
    text: `
      Your Login OTP: ${otp}
      
      Valid for 5 minutes.
      Never share this OTP with anyone.
      
      If you didn't request this login, please ignore this email.
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
   
    return info;
  } catch (error) {
    console.error('❌ Failed to send email:', error);
    throw error;
  }
};

// ======================
// Send OTP
// ======================
export const sendOtp = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    
    // Find role by email
    const role = await Role.findOne({ email });
    
    if (!role) {
      return res.status(400).json({ 
        success: false,
        message: "Role not found with this email" 
      });
    }
    
    // Check if role is active
    if (role.status !== 'Active') {
      return res.status(400).json({
        success: false,
        message: `Your account is ${role.status}. Please contact administrator.`
      });
    }
    
    // Verify password
    const isPasswordValid = await role.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(400).json({ 
        success: false,
        message: "Invalid password" 
      });
    }
    
    // Generate OTP
    const otp = generateOTP();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes
    
    // Store OTP
    otpStore.set(email, {
      otp,
      expiresAt,
      roleId: role._id,
      attempts: 0
    });
    
    // Send OTP via email (Gmail Inbox)
    await sendOTPEmail(email, otp);
    
    
    res.json({
      success: true,
      message: "OTP sent successfully to your email",
      email: email,
      userId: role._id
    });
    
  } catch (err) {
    console.error("❌ Error sending OTP:", err);
    
    // More detailed error message
    let errorMessage = err.message;
    if (err.code === 'EAUTH') {
      errorMessage = 'Email authentication failed. Please check your Gmail credentials.';
    } else if (err.code === 'ESOCKET') {
      errorMessage = 'Network error. Please check your internet connection.';
    }
    
    res.status(500).json({ 
      success: false, 
      message: errorMessage
    });
  }
};

// ======================
// Verify OTP and Login
// ======================
export const verifyOtpAndLogin = async (req, res) => {
  try {
    const { email, otp, userId } = req.body;
    
    
    // Get OTP from store
    const otpData = otpStore.get(email);
    
    if (!otpData) {
      return res.status(400).json({
        success: false,
        message: "OTP expired or not requested"
      });
    }
    
    // Check attempts
    if (otpData.attempts >= 3) {
      otpStore.delete(email);
      return res.status(400).json({
        success: false,
        message: "Too many failed attempts. Request new OTP"
      });
    }
    
    // Check expiry
    if (Date.now() > otpData.expiresAt) {
      otpStore.delete(email);
      return res.status(400).json({
        success: false,
        message: "OTP expired. Request new OTP"
      });
    }
    
    // Verify OTP
    if (otpData.otp !== otp) {
      otpData.attempts += 1;
      otpStore.set(email, otpData);
      
      return res.status(400).json({
        success: false,
        message: `Invalid OTP. ${3 - otpData.attempts} attempts remaining`
      });
    }
    
    // Find role
    const role = await Role.findById(otpData.roleId);
    
    if (!role) {
      return res.status(400).json({
        success: false,
        message: "Role not found"
      });
    }
    
    // Update last login
    role.lastLogin = new Date();
    await role.save();
    
    // Generate JWT token
    const token = jwt.sign(
      { 
        id: role._id, 
        email: role.email,
        name: role.name,
        role: role.role,
        type: 'role'
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );
    
    // Clear OTP from store
    otpStore.delete(email);
    
    
    res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: role._id,
        name: role.name,
        email: role.email,
        role: role.role,
        type: 'role'
      }
    });
    
  } catch (err) {
    res.status(500).json({ 
      success: false, 
      message: err.message 
    });
  }
};

// ======================
// Resend OTP
// ======================
export const resendOtp = async (req, res) => {
  try {
    const { email, userId } = req.body;
    
    console.log("📝 Resending OTP for:", email);
    
    // Check if exists in store
    const existingOtp = otpStore.get(email);
    
    if (!existingOtp) {
      return res.status(400).json({
        success: false,
        message: "No active OTP request. Please login again"
      });
    }
    
    // Generate new OTP
    const otp = generateOTP();
    const expiresAt = Date.now() + 5 * 60 * 1000;
    
    // Update store
    otpStore.set(email, {
      otp,
      expiresAt,
      roleId: existingOtp.roleId,
      attempts: 0
    });
    
    // Send new OTP
    await sendOTPEmail(email, otp);
    
    console.log(`✅ OTP resent to ${email}`);
    
    res.json({
      success: true,
      message: "OTP resent successfully"
    });
    
  } catch (err) {
    console.error("❌ Error resending OTP:", err);
    res.status(500).json({ 
      success: false, 
      message: err.message 
    });
  }
};

// ======================
// Traditional Login (without OTP)
// ======================
export const roleLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log("📝 Traditional login attempt for:", email);
    
    const role = await Role.findOne({ email });
    
    if (!role) {
      return res.status(400).json({ 
        success: false,
        message: "Invalid credentials" 
      });
    }
    
    // Check if role is active
    if (role.status !== 'Active') {
      return res.status(400).json({
        success: false,
        message: `Your account is ${role.status}. Please contact administrator.`
      });
    }
    
    // Verify password
    const isPasswordValid = await role.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(400).json({ 
        success: false,
        message: "Invalid credentials" 
      });
    }
    
    // Update last login
    role.lastLogin = new Date();
    await role.save();
    
    // Generate JWT token
    const token = jwt.sign(
      { 
        id: role._id, 
        email: role.email,
        name: role.name,
        role: role.role,
        type: 'role'
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );
    
    console.log("✅ Traditional login successful for:", email);
    
    res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: role._id,
        name: role.name,
        email: role.email,
        role: role.role,
        type: 'role'
      }
    });
    
  } catch (err) {
    console.error("❌ Error in traditional login:", err);
    res.status(500).json({ 
      success: false, 
      message: err.message 
    });
  }
};

// ======================
// Create New Role
// ======================
export const createRole = async (req, res) => {
  try {
    console.log("📝 Creating new role:", req.body);
    
    const { name, email, password, role, permissions } = req.body;
    
    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ 
        success: false,
        message: "Name, email and password are required" 
      });
    }
    
    // Check if email already exists
    const existingRole = await Role.findOne({ email });
    if (existingRole) {
      return res.status(400).json({ 
        success: false,
        message: "Email already exists" 
      });
    }
    
    // Create new role
    const newRole = new Role({
      name,
      email,
      password,
      role: role || 'manager',
      permissions: permissions || [],
      createdBy: req.admin?.id
    });
    
    // Save to database
    const savedRole = await newRole.save();
    
    console.log("✅ Role created successfully:", savedRole.email);
    
    res.status(201).json({ 
      success: true,
      message: "Role created successfully",
      role: {
        id: savedRole._id,
        name: savedRole.name,
        email: savedRole.email,
        role: savedRole.role,
        status: savedRole.status,
        createdAt: savedRole.createdAt
      }
    });
    
  } catch (err) {
    console.error("❌ Error creating role:", err);
    
    if (err.code === 11000) {
      return res.status(400).json({ 
        success: false,
        message: "Email already exists" 
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: "Server error: " + err.message 
    });
  }
};

// ======================
// Get All Roles
// ======================
export const getAllRoles = async (req, res) => {
  try {
    const roles = await Role.find({}).select('-password').sort({ createdAt: -1 });
    
    res.json({
      success: true,
      roles
    });
    
  } catch (err) {
    console.error("❌ Error fetching roles:", err);
    res.status(500).json({ 
      success: false,
      message: "Server error: " + err.message 
    });
  }
};

// ======================
// Get Role by ID
// ======================
export const getRoleById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const role = await Role.findById(id).select('-password');
    
    if (!role) {
      return res.status(404).json({ 
        success: false,
        message: "Role not found" 
      });
    }
    
    res.json({
      success: true,
      role
    });
    
  } catch (err) {
    console.error("❌ Error fetching role:", err);
    res.status(500).json({ 
      success: false,
      message: "Server error: " + err.message 
    });
  }
};

// ======================
// Update Role
// ======================
export const updateRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role, status, permissions } = req.body;
    
    const existingRole = await Role.findById(id);
    
    if (!existingRole) {
      return res.status(404).json({ 
        success: false,
        message: "Role not found" 
      });
    }
    
    // Update fields
    if (name) existingRole.name = name;
    if (email) existingRole.email = email;
    if (role) existingRole.role = role;
    if (status) existingRole.status = status;
    if (permissions) existingRole.permissions = permissions;
    
    await existingRole.save();
    
    res.json({
      success: true,
      message: "Role updated successfully",
      role: {
        id: existingRole._id,
        name: existingRole.name,
        email: existingRole.email,
        role: existingRole.role,
        status: existingRole.status
      }
    });
    
  } catch (err) {
    console.error("❌ Error updating role:", err);
    
    if (err.code === 11000) {
      return res.status(400).json({ 
        success: false,
        message: "Email already exists" 
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: "Server error: " + err.message 
    });
  }
};

// ======================
// Delete Role
// ======================
export const deleteRole = async (req, res) => {
  try {
    const { id } = req.params;
    
    const role = await Role.findByIdAndDelete(id);
    
    if (!role) {
      return res.status(404).json({ 
        success: false,
        message: "Role not found" 
      });
    }
    
    res.json({
      success: true,
      message: "Role deleted successfully"
    });
    
  } catch (err) {
    console.error("❌ Error deleting role:", err);
    res.status(500).json({ 
      success: false,
      message: "Server error: " + err.message 
    });
  }
};