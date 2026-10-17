const authService = require("../services/auth.service");

const isProd = process.env.NODE_ENV === "production";

const adminCookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: isProd ? "none" : "lax",
  path: "/",
};

async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    const { token, user } = await authService.loginUser(email, password);

    if (user.role !== "ADMIN") {
      return res.status(403).json({
        success: false,
        message: "Admin access required",
        code: "FORBIDDEN",
      });
    }

    res.cookie("adminToken", token, {
      ...adminCookieOptions,
      maxAge: 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      success: true,
      data: { user },
    });
  } catch (error) {
    next(error);
  }
}

function getMe(req, res) {
  return res.status(200).json({
    success: true,
    data: req.user,
  });
}

function logout(req, res, next) {
  try {
    res.clearCookie("adminToken", adminCookieOptions);

    return res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { login, getMe, logout };
