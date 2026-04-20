import Permission from "../models/Permission.js";

// یہ middleware چیک کرے گا کہ یوزر کو مخصوص page کی اجازت ہے یا نہیں
export const requirePermission = (requiredPageId) => {
  return async (req, res, next) => {
    try {
      // Admin کو ہمیشہ اجازت ہے (full access)
      if (req.userType === 'admin') {
        console.log(`✅ Admin access granted to ${requiredPageId}`);
        return next();
      }

      // Role user کے لیے چیک کریں
      if (req.userType === 'role') {
        const roleId = req.userId; // یا req.user._id

        // ڈیٹا بیس میں چیک کریں
        const permission = await Permission.findOne({
          roleId: roleId,
          pageId: requiredPageId,
          canAccess: true
        });

        if (!permission) {
          console.log(`⛔ Access Denied: Role ${roleId} tried to access ${requiredPageId}`);
          
          // API request کے لیے JSON response
          if (req.xhr || req.headers.accept.includes('json')) {
            return res.status(403).json({
              success: false,
              message: "Access Denied: You don't have permission to access this resource"
            });
          }
          
          // Web page کے لیے redirect
          return res.redirect('/unauthorized');
        }

        console.log(`✅ Role ${roleId} granted access to ${requiredPageId}`);
        return next();
      }

      // اگر نہ admin نہ role
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Invalid user type"
      });

    } catch (error) {
      console.error("❌ Permission middleware error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error while checking permissions"
      });
    }
  };
};

// Multiple pages میں سے کسی ایک کی اجازت چیک کریں
export const requireAnyPermission = (requiredPageIds) => {
  return async (req, res, next) => {
    try {
      if (req.userType === 'admin') return next();

      if (req.userType === 'role') {
        const roleId = req.userId;
        
        const permissions = await Permission.find({
          roleId: roleId,
          pageId: { $in: requiredPageIds },
          canAccess: true
        });

        if (permissions.length === 0) {
          return res.status(403).json({
            success: false,
            message: "Access Denied: You need at least one of the required permissions"
          });
        }

        return next();
      }

      return res.status(401).json({ success: false, message: "Unauthorized" });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };
};