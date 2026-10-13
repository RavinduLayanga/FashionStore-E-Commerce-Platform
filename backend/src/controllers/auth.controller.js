const authService = require("../services/auth.service");

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    // 1. Actually log the user in using the service
    const { token, user } = await authService.loginUser(email, password);

    // 2. Set the HTTP-Only cookie
    res.cookie("adminToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    });

    // 3. Return success without exposing the token in the JSON body
    res.status(200).json({ success: true, data: { user } });
  } catch (error) {
    next(error);
  }
}

async function getMe(req, res, next) {
  try {
    res.status(200).json({ success: true, data: req.user });
  } catch (error) {
    next(error);
  }
}

// ... existing login and getMe functions ...

async function logout(req, res, next) {
  try {
    res.clearCookie("adminToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });
    res.status(200).json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    next(error);
  }
}

module.exports = { login, getMe, logout };
