import Role from "../models/Role.js";
import jwt from "jsonwebtoken";

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

// ======================
// Role Login
// ======================
export const roleLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const role = await Role.findOne({ email });
    
    if (!role) {
      return res.status(400).json({ 
        success: false,
        message: "Invalid email or password" 
      });
    }
    
    const match = await role.comparePassword(password);
    
    if (!match) {
      return res.status(400).json({ 
        success: false,
        message: "Invalid email or password" 
      });
    }
    
    // Update last login
    role.lastLogin = new Date();
    await role.save();
    
    // Generate JWT
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
    console.error("❌ Role login error:", err);
    res.status(500).json({ 
      success: false,
      message: "Server error" 
    });
  }
};