const express = require("express");
const router = express.Router();
const orderController = require("../controllers/order.controller");
const validate = require("../middleware/validate");
const { createOrderSchema } = require("../validators/order.validator");
const { authenticate, requireAdmin } = require("../middleware/auth");

// PayHere Webhook (Must parse form-urlencoded data)
router.post(
  "/webhook/payhere",
  express.urlencoded({ extended: true }),
  orderController.handlePayHereWebhook,
);

// Public route: Customers create orders
router.post(
  "/",
  validate({ body: createOrderSchema }),
  orderController.createOrder,
);

// Admin route: Approve WhatsApp orders and decrement stock
router.post(
  "/:orderId/approve",
  authenticate,
  requireAdmin,
  orderController.approveOrder,
);

module.exports = router;
