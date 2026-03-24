import mongoose from "mongoose";

const permissionSchema = new mongoose.Schema({
  roleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Role",
    required: true,
    index: true
  },
  
  pageId: {
    type: String,
    required: true,
    index: true
  },

  pageName: {
    type: String,
    required: true
  },

  canAccess: {
    type: Boolean,
    default: true
  },

  grantedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Admin"
  },

  grantedAt: {
    type: Date,
    default: Date.now
  },

  expiresAt: {
    type: Date,
    default: null
  },

  conditions: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {}
  }

}, { 
  timestamps: true 
});

permissionSchema.index({ roleId: 1, pageId: 1 }, { unique: true });

permissionSchema.virtual('isExpired').get(function() {
  return this.expiresAt && this.expiresAt < new Date();
});

permissionSchema.methods.isValid = function() {
  return this.canAccess && (!this.expiresAt || this.expiresAt > new Date());
};

const Permission = mongoose.model("Permission", permissionSchema);

export default Permission;