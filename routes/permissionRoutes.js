import express from "express";
import Permission from "../models/Permission.js";
import Role from "../models/Role.js";
import { protect } from "../middleware/auth.js";
import { PAGES } from "../constants/pages.js";

const router = express.Router();

// Get all permissions for a role (with array)
router.get("/role/:roleId", protect, async (req, res) => {
  try {
    const roleId = req.params.roleId;
    
    // Get role with permissions array
    const role = await Role.findById(roleId).select('name email role permissions');
    
    // Get detailed permissions
    const permissions = await Permission.find({ roleId });

    res.json({
      success: true,
      role: {
        id: role._id,
        name: role.name,
        email: role.email,
        role: role.role,
        permissionsArray: role.permissions  // یہ ARRAY ہے
      },
      permissions  // detailed permissions
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// Toggle permission (updates both)
router.post("/toggle", protect, async (req, res) => {
  try {
    const { roleId, pageId, pageName } = req.body;

    const role = await Role.findById(roleId);
    if (!role) {
      return res.status(404).json({
        success: false,
        message: "Role not found"
      });
    }

    // Use role's toggle method (updates both)
    const result = await role.togglePermission(pageId, pageName, req.userId);

    res.json({
      success: true,
      message: result.permission.canAccess ? "Access granted" : "Access revoked",
      permission: result.permission,
      permissionsArray: result.permissionsArray  // Updated array
    });

  } catch (error) {
    console.error("Toggle permission error:", error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// Bulk set permissions (updates both)
router.post("/bulk", protect, async (req, res) => {
  try {
    const { roleId, pageIds } = req.body;

    const role = await Role.findById(roleId);
    if (!role) {
      return res.status(404).json({
        success: false,
        message: "Role not found"
      });
    }

    // Delete all existing permissions
    await Permission.deleteMany({ roleId });

    // Create new permissions
    const permissionsToCreate = pageIds.map(pageId => {
      const page = PAGES.find(p => p.id === pageId);
      return {
        roleId,
        pageId,
        pageName: page?.name || pageId,
        canAccess: true,
        grantedBy: req.userId,
        grantedAt: new Date()
      };
    });

    if (permissionsToCreate.length > 0) {
      await Permission.insertMany(permissionsToCreate);
    }

    // Update role's permissions array
    role.permissions = pageIds;  // پورا array replace
    await role.save();

    res.json({
      success: true,
      message: "Permissions updated successfully",
      count: pageIds.length,
      permissionsArray: role.permissions  // Updated array
    });

  } catch (error) {
    console.error("Bulk permission error:", error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// Check single page access
router.get("/check", protect, async (req, res) => {
  try {
    const { pageId } = req.query;
    const roleId = req.userId;

    if (req.userType === 'admin') {
      return res.json({ 
        success: true, 
        hasAccess: true,
        userType: 'admin'
      });
    }

    const role = await Role.findById(roleId);
    
    // First check array (fast)
    const hasInArray = role.permissions.includes(pageId);
    
    if (hasInArray) {
      return res.json({
        success: true,
        hasAccess: true,
        source: 'array'
      });
    }

    // Then check Permission model
    const permission = await Permission.findOne({
      roleId,
      pageId,
      canAccess: true
    });

    res.json({
      success: true,
      hasAccess: !!permission,
      source: permission ? 'model' : 'none'
    });

  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message,
      hasAccess: false 
    });
  }
});

// Get role's permissions array
router.get("/array/:roleId", protect, async (req, res) => {
  try {
    const role = await Role.findById(req.params.roleId)
      .select('name email role permissions');
    
    res.json({
      success: true,
      permissionsArray: role.permissions
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

export default router;