const jwt = require("jsonwebtoken");

// ===============================
// Middleware: Is Authenticated
// ===============================
const isAuthenticated = async (req, res, next) => {
  try {
    const token =
      req.headers.authorization?.startsWith("Bearer ")
        ? req.headers.authorization.split(" ")[1]
        : req.cookies?.token;

    if (!token) {
      return res.status(401).json({
        message: "User not authenticated",
        success: false,
      });
    }

    const secretKey = process.env.SECRET_KEY?.trim();
    if (!secretKey) {
      console.error("AUTH ERROR 👉 SECRET_KEY is not configured");
      return res.status(500).json({ message: "Server configuration error", success: false });
    }

    const decoded = jwt.verify(token, secretKey);

    req.user = {
      id: decoded.userId,
      isAdmin: decoded.is_admin,
      level: decoded.level || null,
    };

    next();
  } catch (error) {
    console.error("AUTH ERROR 👉", error);
    return res.status(401).json({
      message: "Authentication error",
      success: false,
    });
  }
};

// ===============================
// Middleware: Verify Admin
// ===============================
const verifyAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  if (!req.user.isAdmin) {
    return res.status(403).json({ message: "Forbidden: Admins only" });
  }

  next();
};

module.exports = {
  isAuthenticated,
  verifyAdmin,

};
