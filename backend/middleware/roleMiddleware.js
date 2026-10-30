import User from "../models/user.js";

/**
 * Middleware: Attach the full user (with org and role) to req.user
 * 
 * This runs AFTER authMiddleware (which gives us req.user.userId from the JWT).
 * It fetches the full user document and replaces req.user with it.
 * 
 * Why? So every route has access to req.user.organization and req.user.role
 * without fetching the user again.
 */
export const attachUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // Replace the minimal JWT data with the full user document
    req.user = user;
    next();
  } catch (error) {
    console.error("Attach user error:", error.message);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

/**
 * Middleware: Require that the user belongs to an organization
 * 
 * Must run after attachUser.
 */
export const requireOrg = (req, res, next) => {
  if (!req.user.organization) {
    return res.status(403).json({
      message: "You must belong to an organization to perform this action",
    });
  }
  next();
};

/**
 * Middleware factory: Require one of the specified roles
 * 
 * Usage: requireRole("Admin", "Manager")
 * Must run after attachUser.
 * 
 * Interview note: This is a "higher-order function" — a function that
 * returns another function. Express calls the inner function as middleware.
 */
export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: `This action requires one of these roles: ${allowedRoles.join(", ")}`,
      });
    }
    next();
  };
};
