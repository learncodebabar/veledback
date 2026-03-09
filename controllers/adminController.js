import Admin from "../models/Admin.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// ======================
// Register Admin (only once)
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
// Login without OTP
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
// Get Admin Profile
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

// ======================
// Update Admin Profile (Name & Email)
// ======================
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

// ======================
// Change Password
// ======================
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
};// ======================
// Check if Admin Exists
// ======================
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