// backend/routes/permissions.js
import express from "express";
import Permission from "../models/Permission.js";
import Role from "../models/Role.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// Get all permissions for a role (with array)
router.get("/role/:roleId", protect, async (req, res) => {
  try {
    const roleId = req.params.roleId;
    
    const role = await Role.findById(roleId).select('name email role permissions');
    
    if (!role) {
      return res.status(404).json({
        success: false,
        message: "Role not found"
      });
    }
    
    const permissions = await Permission.find({ roleId });

    console.log('📦 Current Role Permissions Array:', role.permissions);
    console.log('📦 Permission Model entries:', permissions.length);

    res.json({
      success: true,
      role: {
        id: role._id,
        name: role.name,
        email: role.email,
        role: role.role,
        permissionsArray: role.permissions || []
      },
      permissions: permissions
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// ✅ FIXED: Toggle permission - Updates BOTH places
router.post("/toggle", protect, async (req, res) => {
  try {
    const { roleId, pageId, pageName } = req.body;

    console.log('🔄 Toggling permission:', { roleId, pageId, pageName });

    // Find the role
    const role = await Role.findById(roleId);
    if (!role) {
      return res.status(404).json({
        success: false,
        message: "Role not found"
      });
    }

    console.log('🔍 Current role.permissions:', role.permissions);

    // Check if permission exists in Permission model
    let permission = await Permission.findOne({ roleId, pageId });
    
    let canAccess;
    let updatedPermissionsArray = role.permissions ? [...role.permissions] : [];
    
    if (permission) {
      // Toggle existing permission
      permission.canAccess = !permission.canAccess;
      permission.grantedBy = req.userId;
      permission.grantedAt = new Date();
      await permission.save();
      canAccess = permission.canAccess;
      
      // ✅ Update role's permissions array
      if (canAccess) {
        // Add to array if not exists
        if (!updatedPermissionsArray.includes(pageId)) {
          updatedPermissionsArray.push(pageId);
          console.log(`✅ Added ${pageId} to permissions array`);
        }
      } else {
        // Remove from array
        updatedPermissionsArray = updatedPermissionsArray.filter(p => p !== pageId);
        console.log(`❌ Removed ${pageId} from permissions array`);
      }
    } else {
      // Create new permission with canAccess = true
      permission = await Permission.create({
        roleId,
        pageId,
        pageName,
        canAccess: true,
        grantedBy: req.userId,
        grantedAt: new Date()
      });
      canAccess = true;
      
      // ✅ Add to role's permissions array
      if (!updatedPermissionsArray.includes(pageId)) {
        updatedPermissionsArray.push(pageId);
        console.log(`✅ Added ${pageId} to permissions array (new)`);
      }
    }
    
    // ✅ CRITICAL: Save updated permissions array to role
    role.permissions = updatedPermissionsArray;
    await role.save();
    
    console.log('✅ FINAL role.permissions:', role.permissions);
    console.log('✅ Permission canAccess:', canAccess);

    res.json({
      success: true,
      message: canAccess ? "Access granted" : "Access revoked",
      permission: {
        canAccess: canAccess,
        pageId: pageId,
        pageName: pageName
      },
      permissionsArray: role.permissions
    });

  } catch (error) {
    console.error("Toggle permission error:", error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// ✅ FIXED: Bulk set permissions
router.post("/bulk", protect, async (req, res) => {
  try {
    const { roleId, pageIds } = req.body;

    console.log('📦 Bulk updating permissions:', { roleId, pageIds });

    const role = await Role.findById(roleId);
    if (!role) {
      return res.status(404).json({
        success: false,
        message: "Role not found"
      });
    }

    // Delete all existing permissions for this role
    await Permission.deleteMany({ roleId });

    // Create new permissions for selected pageIds
    const permissionsToCreate = pageIds.map(pageId => ({
      roleId,
      pageId,
      pageName: pageId,
      canAccess: true,
      grantedBy: req.userId,
      grantedAt: new Date()
    }));

    if (permissionsToCreate.length > 0) {
      await Permission.insertMany(permissionsToCreate);
    }

    // ✅ Update role's permissions array directly
    role.permissions = pageIds;
    await role.save();

    console.log('✅ Updated role.permissions:', role.permissions);

    res.json({
      success: true,
      message: "Permissions updated successfully",
      count: pageIds.length,
      permissionsArray: role.permissions
    });

  } catch (error) {
    console.error("Bulk permission error:", error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// ✅ Get role's permissions array only
router.get("/array/:roleId", protect, async (req, res) => {
  try {
    const role = await Role.findById(req.params.roleId).select('name email role permissions');
    
    if (!role) {
      return res.status(404).json({
        success: false,
        message: "Role not found"
      });
    }
    
    console.log('📦 Permissions array for role:', role.permissions);
    
    res.json({
      success: true,
      roleId: role._id,
      roleName: role.name,
      roleType: role.role,
      permissionsArray: role.permissions || []
    });
  } catch (error) {
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
    
    if (!role) {
      return res.json({ success: true, hasAccess: false });
    }
    
    // First check array (fast)
    const hasInArray = role.permissions?.includes(pageId) || false;
    
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

export default router;