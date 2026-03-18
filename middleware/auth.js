// middleware/auth.js
import jwt from "jsonwebtoken";
import Admin from "../models/Admin.js";
import Role from "../models/Role.js";

export const protect = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1]; // Bearer token
  
  if (!token) {
    return res.status(401).json({ 
      success: false,
      message: "Not authorized, no token" 
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Decoded token:", decoded);
    
    // ---------- YEH CONDITION ADD KARO ----------
    // Agar decoded mein type 'role' hai to Role model se check karo
    if (decoded.type === 'role' || decoded.role === 'manager' || decoded.role === 'staff') {
      // Role token
      const role = await Role.findById(decoded.id || decoded._id).select('-password');
      if (!role) {
        return res.status(401).json({ 
          success: false,
          message: "Role not found" 
        });
      }
      req.role = role;
      req.user = role;
      req.userType = 'role';
      req.userId = role._id;
      console.log("✅ Role authenticated:", role.email);
      return next(); // ← IMPORTANT: next() call karo
    }
    // --------------------------------------------
    
    // Admin token check
    if (decoded.type === 'admin' || decoded.role === 'admin' || decoded.isAdmin) {
      const admin = await Admin.findById(decoded.id || decoded._id || decoded.userId).select('-password');
      if (!admin) {
        return res.status(401).json({ 
          success: false,
          message: "Admin not found" 
        });
      }
      req.admin = admin;
      req.user = admin;
      req.userType = 'admin';
      req.userId = admin._id;
      console.log("✅ Admin authenticated:", admin.email);
      return next();
    }
    
    // Backward compatibility
    const admin = await Admin.findById(decoded.id || decoded._id || decoded.userId).select('-password');
    if (admin) {
      req.admin = admin;
      req.user = admin;
      req.userType = 'admin';
      req.userId = admin._id;
      console.log("✅ Admin authenticated (legacy):", admin.email);
      return next();
    }
    
    const role = await Role.findById(decoded.id || decoded._id || decoded.userId).select('-password');
    if (role) {
      req.role = role;
      req.user = role;
      req.userType = 'role';
      req.userId = role._id;
      console.log("✅ Role authenticated (legacy):", role.email);
      return next();
    }
    
    return res.status(401).json({ 
      success: false,
      message: "User not found" 
    });
    
  } catch (err) {
    console.error("❌ Auth error:", err.message);
    res.status(401).json({ 
      success: false,
      message: "Token invalid or expired" 
    });
  }
};