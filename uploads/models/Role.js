import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import Permission from "./Permission.js";

const roleSchema = new mongoose.Schema({
  name: { 
    type: String,
    required: true,
    trim: true
  },
  email: { 
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: { 
    type: String,
    required: true
  },
  role: { 
    type: String,
    enum: ['admin','manager','supervisor','user'],
    default: "manager"
  },
  status: {
    type: String,
    enum: ['Active','Inactive','Suspended'],
    default: "Active"
  },
  // ===== یہ ARRAY ہے جس میں permissions store ہوں گی =====
  permissions: {
    type: [String],    // pageIds ka array
    default: []
  },
  lastLogin: Date,
  createdBy:{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Admin"
  }
},{timestamps:true});

// PASSWORD HASH
roleSchema.pre("save", async function(){
  if(!this.isModified("password")) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// PASSWORD COMPARE
roleSchema.methods.comparePassword = async function(password){
  return await bcrypt.compare(password, this.password);
};

// ===== PERMISSION ARRAY METHODS =====

// 1. Check if page is in permissions array
roleSchema.methods.hasPermission = function(pageId) {
  return this.permissions.includes(pageId);
};

// 2. Add permission to array
roleSchema.methods.addPermission = function(pageId) {
  if (!this.permissions.includes(pageId)) {
    this.permissions.push(pageId);
  }
  return this.permissions;
};

// 3. Remove permission from array
roleSchema.methods.removePermission = function(pageId) {
  this.permissions = this.permissions.filter(p => p !== pageId);
  return this.permissions;
};

// 4. Toggle permission in array
roleSchema.methods.togglePermissionInArray = function(pageId) {
  if (this.permissions.includes(pageId)) {
    this.permissions = this.permissions.filter(p => p !== pageId);
  } else {
    this.permissions.push(pageId);
  }
  return this.permissions;
};

// 5. Get permissions array
roleSchema.methods.getPermissionsArray = function() {
  return this.permissions;
};

// 6. Set bulk permissions
roleSchema.methods.setPermissionsArray = function(pageIds) {
  this.permissions = pageIds;
  return this.permissions;
};

// ===== INTEGRATED METHODS WITH PERMISSION MODEL =====

// Check if role has access to a specific page
roleSchema.methods.hasPageAccess = async function(pageId) {
  try {
    if (this.status !== 'Active') {
      return false;
    }

    // First check array (fast)
    if (this.permissions.includes(pageId)) {
      return true;
    }

    // Then check Permission model (detailed)
    const permission = await Permission.findOne({
      roleId: this._id,
      pageId: pageId,
      canAccess: true
    });

    return permission ? permission.isValid() : false;
  } catch (error) {
    console.error("Error checking page access:", error);
    return false;
  }
};

// Grant permission (updates both)
roleSchema.methods.grantPermission = async function(pageId, pageName, grantedBy = null) {
  try {
    // Update Permission model
    const permission = await Permission.findOneAndUpdate(
      { roleId: this._id, pageId: pageId },
      { 
        canAccess: true,
        pageName: pageName,
        grantedBy: grantedBy,
        grantedAt: new Date()
      },
      { upsert: true, new: true }
    );
    
    // Update array
    if (!this.permissions.includes(pageId)) {
      this.permissions.push(pageId);
      await this.save();
    }
    
    return {
      permission,
      permissionsArray: this.permissions
    };
  } catch (error) {
    console.error("Error granting permission:", error);
    throw error;
  }
};

// Revoke permission (updates both)
roleSchema.methods.revokePermission = async function(pageId) {
  try {
    // Update Permission model
    const permission = await Permission.findOneAndUpdate(
      { roleId: this._id, pageId: pageId },
      { canAccess: false },
      { new: true }
    );
    
    // Update array
    this.permissions = this.permissions.filter(p => p !== pageId);
    await this.save();
    
    return {
      permission,
      permissionsArray: this.permissions
    };
  } catch (error) {
    console.error("Error revoking permission:", error);
    throw error;
  }
};

// Toggle permission (updates both)
roleSchema.methods.togglePermission = async function(pageId, pageName, grantedBy = null) {
  try {
    const existingPermission = await Permission.findOne({
      roleId: this._id,
      pageId: pageId
    });

    let permission;
    
    if (existingPermission) {
      // Toggle
      existingPermission.canAccess = !existingPermission.canAccess;
      existingPermission.grantedBy = grantedBy;
      existingPermission.grantedAt = new Date();
      await existingPermission.save();
      permission = existingPermission;
    } else {
      // Create new
      permission = await Permission.create({
        roleId: this._id,
        pageId,
        pageName,
        canAccess: true,
        grantedBy
      });
    }

    // Update array based on canAccess
    if (permission.canAccess) {
      if (!this.permissions.includes(pageId)) {
        this.permissions.push(pageId);
      }
    } else {
      this.permissions = this.permissions.filter(p => p !== pageId);
    }
    
    await this.save();

    return {
      permission,
      permissionsArray: this.permissions
    };
  } catch (error) {
    console.error("Error toggling permission:", error);
    throw error;
  }
};

// Get all accessible pages (from array + model)
roleSchema.methods.getAccessiblePages = async function() {
  try {
    // From array (fast)
    const arrayPages = this.permissions;
    
    // From Permission model (detailed)
    const permissions = await Permission.find({
      roleId: this._id,
      canAccess: true
    });

    const modelPages = permissions.map(p => p.pageId);
    
    // Combine both (unique)
    const allPages = [...new Set([...arrayPages, ...modelPages])];
    
    return allPages;
  } catch (error) {
    console.error("Error getting accessible pages:", error);
    return this.permissions; // fallback to array
  }
};

export default mongoose.model("Role", roleSchema);