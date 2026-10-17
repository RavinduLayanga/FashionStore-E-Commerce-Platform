const express = require("express");
const router = express.Router();

const authController = require("../controllers/auth.controller");
const validate = require("../middleware/validate");
const { loginSchema } = require("../validators/auth.validator");
const { authenticate } = require("../middleware/auth");
const { loginLimiter } = require("../middleware/rateLimiters");
const verifyFrontendOrigin = require("../middleware/verifyOrigin");

router.post(
  "/login",
  loginLimiter,
  verifyFrontendOrigin,
  validate({ body: loginSchema }),
  authController.login,
);

router.get("/me", authenticate, authController.getMe);

router.post("/logout", verifyFrontendOrigin, authController.logout);

module.exports = router;
