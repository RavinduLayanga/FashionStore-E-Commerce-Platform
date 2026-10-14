const rateLimit = require("express-rate-limit");

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 login requests per window
  message: {
    success: false,
    message: "Too many login attempts, please try again later",
  },
});

const orderLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20, // Limit each IP to 20 order creations per window
  message: {
    success: false,
    message: "Too many orders placed, please try again later",
  },
});

module.exports = { loginLimiter, orderLimiter };
