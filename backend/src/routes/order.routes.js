const express = require("express");
const router = express.Router();
const orderController = require("../controllers/order.controller");
const validate = require("../middleware/validate");
const { createOrderSchema } = require("../validators/order.validator");
const { authenticate, requireAdmin } = require("../middleware/auth");

// PayHere Webhook
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

// Admin route: Get all orders
router.get("/", authenticate, requireAdmin, orderController.getAllOrders);

// Admin route: Approve WhatsApp orders and decrement stock
router.post(
  "/:orderId/approve",
  authenticate,
  requireAdmin,
  orderController.approveOrder,
);

// Admin route: Cancel pending orders and release inventory
router.post(
  "/:orderId/cancel",
  authenticate,
  requireAdmin,
  orderController.cancelOrder,
);

module.exports = router;
