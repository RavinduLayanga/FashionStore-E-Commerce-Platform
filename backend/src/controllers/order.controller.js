const orderService = require("../services/order.service");
const crypto = require("crypto");
const { Prisma } = require("@prisma/client");

async function createOrder(req, res, next) {
  try {
    const order = await orderService.createOrder(req.body);

    let payhereConfig = null;

    if (order.paymentMethod === "PAYHERE") {
      const merchantId = process.env.PAYHERE_MERCHANT_ID;
      const merchantSecret = process.env.PAYHERE_SECRET;

      if (!merchantId || !merchantSecret) {
        throw new Error("PayHere configuration is missing");
      }

      const amount = new Prisma.Decimal(order.totalAmount).toFixed(2);
      const currency = "LKR";

      const cleanMerchantId = merchantId.trim();
      const cleanSecret = merchantSecret.trim();

      const hashedSecret = crypto
        .createHash("md5")
        .update(cleanSecret)
        .digest("hex")
        .toUpperCase();
      const rawString = `${cleanMerchantId}${order.orderNumber}${amount}${currency}${hashedSecret}`;
      const hash = crypto
        .createHash("md5")
        .update(rawString)
        .digest("hex")
        .toUpperCase();

      const nameParts = order.customerName.trim().split(/\s+/);
      const firstName = nameParts.shift() || "";
      const lastName = nameParts.join(" ") || "";

      payhereConfig = {
        sandbox: true,
        merchant_id: cleanMerchantId,
        return_url: `${process.env.FRONTEND_URL || "http://localhost:3000"}/checkout/success`,
        cancel_url: `${process.env.FRONTEND_URL || "http://localhost:3000"}/checkout/cancel`,
        notify_url: `${process.env.API_URL || "http://localhost:5001/api"}/orders/webhook/payhere`,
        order_id: order.orderNumber,
        items: "Store Purchase",
        currency: currency,
        amount: amount,
        first_name: firstName,
        last_name: lastName,
        email: order.customerEmail,
        phone: order.customerPhone,
        address: order.address,
        city: order.city,
        country: "Sri Lanka",
        hash: hash,
      };
    }

    res.status(201).json({
      success: true,
      data: order,
      payhereConfig,
      message: "Order created and inventory locked successfully",
    });
  } catch (error) {
    if (error.code === "INVENTORY_ERROR") {
      return res.status(400).json({
        success: false,
        message: error.message,
        code: "INVENTORY_ERROR",
      });
    }
    next(error);
  }
}

async function approveOrder(req, res, next) {
  try {
    const { orderId } = req.params;
    const changedBy = "ADMIN: Manual Approval";

    // Use the WhatsApp gateway
    const confirmedOrder = await orderService.confirmWhatsAppOrder(
      orderId,
      changedBy,
    );

    res.status(200).json({
      success: true,
      data: confirmedOrder,
      message: "Order confirmed and physical stock decremented successfully",
    });
  } catch (error) {
    if (
      error.code === "INVALID_STATE" ||
      error.code === "EXPIRED_RESERVATION" ||
      error.code === "INVENTORY_ERROR"
    ) {
      return res.status(400).json({ success: false, message: error.message });
    }
    next(error);
  }
}

// --- PAYHERE WEBHOOK ---
async function handlePayHereWebhook(req, res) {
  try {
    const payload = req.body;

    const merchantId = payload.merchant_id;
    const orderId = payload.order_id;
    const payhereAmount = payload.payhere_amount;
    const payhereCurrency = payload.payhere_currency;
    const statusCode = payload.status_code;
    const md5sig = payload.md5sig;
    const paymentId = payload.payment_id;

    // 1. Missing fields check
    if (
      !merchantId ||
      !orderId ||
      !payhereAmount ||
      !payhereCurrency ||
      !statusCode ||
      !md5sig ||
      !paymentId
    ) {
      console.error("PayHere Webhook: Missing required fields");
      return res.status(400).send("Invalid webhook payload");
    }

    // 2. Merchant ID check
    const expectedMerchantId = process.env.PAYHERE_MERCHANT_ID
      ? process.env.PAYHERE_MERCHANT_ID.trim()
      : null;
    if (merchantId !== expectedMerchantId) {
      console.error(
        `PayHere Webhook: Invalid merchant ID. Expected ${expectedMerchantId}, got ${merchantId}`,
      );
      return res.status(400).send("Invalid merchant");
    }

    const merchantSecret = process.env.PAYHERE_SECRET
      ? process.env.PAYHERE_SECRET.trim()
      : null;
    if (!merchantSecret) {
      console.error("CRITICAL: PAYHERE_SECRET is not defined in .env");
      return res.status(500).send("Server Error");
    }

    // 3. Signature Verification
    const hashedSecret = crypto
      .createHash("md5")
      .update(merchantSecret)
      .digest("hex")
      .toUpperCase();
    const verifyString = `${merchantId}${orderId}${payhereAmount}${payhereCurrency}${statusCode}${hashedSecret}`;
    const generatedSig = crypto
      .createHash("md5")
      .update(verifyString)
      .digest("hex")
      .toUpperCase();

    if (generatedSig !== md5sig) {
      console.error(`PayHere Webhook: Signature failed for Order ${orderId}`);
      return res.status(400).send("Invalid signature");
    }

    // 4. Status '2' means SUCCESS in PayHere
    if (statusCode === "2") {
      try {
        await orderService.processPayHerePayment(payload);
      } catch (err) {
        console.error(`PayHere DB Processing Error [${orderId}]:`, err.message);

        // LATE PAYMENTS (Money taken, but stock gone/reservation expired) ---
        if (
          err.code === "EXPIRED_RESERVATION" ||
          err.code === "INVENTORY_ERROR"
        ) {
          await orderService.handleLatePaymentFallback(orderId, payload);
          return res.status(200).send("OK - Late Payment Recorded");
        }

        // --- BUSINESS LOGIC ERRORS ---
        if (err.code === "AMOUNT_MISMATCH" || err.code === "INVALID_STATE") {
          return res.status(400).send(err.message);
        }

        // --- INTERNAL DATABASE FAILURES ---
        return res.status(500).send("Internal Database Error");
      }
    }

    res.status(200).send("OK");
  } catch (error) {
    // console.error("PayHere Webhook Critical Error:", error.message);
    res.status(500).send("Internal Server Error");
  }
}
async function cancelOrder(req, res, next) {
  try {
    const { orderId } = req.params;
    const cancelledOrder = await orderService.cancelOrder(orderId);

    res.status(200).json({
      success: true,
      data: cancelledOrder,
      message: "Order cancelled and inventory released successfully",
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
}

async function getAllOrders(req, res, next) {
  try {
    const orders = await orderService.getAllOrders();
    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createOrder,
  approveOrder,
  handlePayHereWebhook,
  cancelOrder,
  getAllOrders,
};
