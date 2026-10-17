function verifyFrontendOrigin(req, res, next) {
  const allowedOrigin = process.env.FRONTEND_URL;
  const origin = req.get("Origin");

  if (!allowedOrigin || origin !== allowedOrigin) {
    return res.status(403).json({
      success: false,
      message: "Request origin not allowed",
      code: "FORBIDDEN_ORIGIN",
    });
  }

  next();
}

module.exports = verifyFrontendOrigin;
