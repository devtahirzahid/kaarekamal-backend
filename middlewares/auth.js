const jwt = require("jsonwebtoken");
const User = require("../database/models/User");

const authenticate = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Authentication required" });
  }

  try {
    const decodedToken = jwt.verify(token, process.env.SECRET_KEY);
    const user = await User.findById(decodedToken.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user && user.tokenBlacklist.includes(token)) {
      console.log("failure token");
      return res
        .status(401)
        .json({ error: "Unauthorized - Token is invalid", status: 401 });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid token" });
  }
};

const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
};

/** Primary administrator only (no delegating parent). */
const requireRootAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }
  if (req.user.createdBy) {
    return res.status(403).json({
      message: "Only the primary administrator can manage admin users",
    });
  }
  next();
};

module.exports = { authenticate, requireAdmin, requireRootAdmin };
