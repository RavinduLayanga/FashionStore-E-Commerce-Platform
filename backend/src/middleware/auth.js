const jwt = require("jsonwebtoken");
const prisma = require("../config/prisma");

async function authenticate(req, res, next) {
  try {
    // Read the token from the cookie instead of the Authorization header
    const token = req.cookies.adminToken;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
        code: "UNAUTHORIZED",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, name: true, role: true },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
        code: "UNAUTHORIZED",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res
      .status(401)
      .json({ success: false, message: "Invalid token", code: "UNAUTHORIZED" });
  }
}

function requireAdmin(req, res, next) {
  if (req.user.role !== "ADMIN") {
    return res.status(403).json({
      success: false,
      message: "Admin access required",
      code: "FORBIDDEN",
    });
  }
  next();
}

module.exports = { authenticate, requireAdmin };
