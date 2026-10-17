const express = require("express");
const router = express.Router();

const orderController = require("../controllers/order.controller");
const validate = require("../middleware/validate");
const { createOrderSchema } = require("../validators/order.validator");
const { authenticate, requireAdmin } = require("../middleware/auth");
const { orderLimiter } = require("../middleware/rateLimiters");
const verifyFrontendOrigin = require("../middleware/verifyOrigin");

// PayHere webhook: verify PayHere's notification/hash in the controller.
router.post(
  "/webhook/payhere",
  express.urlencoded({ extended: true }),
  orderController.handlePayHereWebhook,
);

// Public route: Customers create orders.
router.post(
  "/",
  orderLimiter,
  validate({ body: createOrderSchema }),
  orderController.createOrder,
);

// Admin route: Get all orders (read-only).
router.get("/", authenticate, requireAdmin, orderController.getAllOrders);

// Admin route: Approve WhatsApp orders and decrement stock.
router.post(
  "/:orderId/approve",
  verifyFrontendOrigin,
  authenticate,
  requireAdmin,
  orderController.approveOrder,
);

// Admin route: Cancel pending orders and release inventory.
router.post(
  "/:orderId/cancel",
  verifyFrontendOrigin,
  authenticate,
  requireAdmin,
  orderController.cancelOrder,
);

module.exports = router;
