const prisma = require("../config/prisma");
const { Prisma } = require("@prisma/client");

async function createOrder(data) {
  const itemMap = new Map();
  for (const item of data.items) {
    itemMap.set(
      item.variantId,
      (itemMap.get(item.variantId) || 0) + item.quantity,
    );
  }

  const sortedVariantIds = Array.from(itemMap.keys()).sort();

  return await prisma.$transaction(async (tx) => {
    let totalAmount = new Prisma.Decimal(0);
    const orderItemsData = [];
    const reservationsData = [];

    const initialStatus =
      data.paymentMethod === "WHATSAPP"
        ? "PENDING_APPROVAL"
        : "PENDING_PAYMENT";
    const reservationMinutes = data.paymentMethod === "WHATSAPP" ? 30 : 15;

    for (const variantId of sortedVariantIds) {
      const requestedQuantity = itemMap.get(variantId);

      await tx.$queryRaw`SELECT id FROM "ProductVariant" WHERE id = ${variantId} FOR UPDATE`;

      const variant = await tx.productVariant.findUnique({
        where: { id: variantId },
        include: {
          product: { select: { name: true } },
          reservations: {
            where: { status: "ACTIVE", expiresAt: { gt: new Date() } },
          },
        },
      });

      if (!variant || !variant.isActive) {
        const err = new Error(`Item ${variantId} is no longer available.`);
        err.code = "INVENTORY_ERROR";
        throw err;
      }

      const activeReserved = variant.reservations.reduce(
        (sum, res) => sum + res.quantity,
        0,
      );
      const availableStock = variant.stock - activeReserved;

      if (requestedQuantity > availableStock) {
        const err = new Error(
          `Insufficient stock for ${variant.product.name} (${variant.size}). Only ${availableStock} left.`,
        );
        err.code = "INVENTORY_ERROR";
        throw err;
      }

      const unitPrice = new Prisma.Decimal(variant.price);
      const subtotal = unitPrice.mul(requestedQuantity);
      totalAmount = totalAmount.add(subtotal);

      orderItemsData.push({
        variantId: variant.id,
        productNameSnapshot: variant.product.name,
        skuSnapshot: variant.sku,
        colorSnapshot: variant.color,
        sizeSnapshot: variant.size,
        unitPrice: variant.price,
        quantity: requestedQuantity,
        subtotal: subtotal,
      });

      reservationsData.push({
        variantId: variant.id,
        quantity: requestedQuantity,
        status: "ACTIVE",
        expiresAt: new Date(Date.now() + reservationMinutes * 60 * 1000),
      });
    }

    const orderNumber = `ORD-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 9000) + 1000}`;

    const order = await tx.order.create({
      data: {
        orderNumber,
        customerName: data.customerName,
        customerEmail: data.email,
        customerPhone: data.phone,
        address: data.address,
        city: data.city,
        paymentMethod: data.paymentMethod,
        status: initialStatus,
        totalAmount,
        items: { create: orderItemsData },
        reservations: { create: reservationsData },
        payments: {
          create: {
            paymentMethod: data.paymentMethod,
            amount: totalAmount,
            currency: "LKR",
            status: "PENDING",
          },
        },
      },
    });

    return order;
  });
}

// ==========================================
// SHARED INTERNAL INVENTORY LOGIC
// ==========================================
async function finalizeOrderTransaction({
  orderId,
  expectedStatus,
  changedBy,
  paymentDetails = null,
  amountCheck = null,
}) {
  return await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "Order" WHERE id = ${orderId} FOR UPDATE`;

    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        payments: true,
        reservations: true,
      },
    });

    if (!order) throw new Error("Order not found");

    const payment = order.payments[0];

    if (expectedStatus === "PENDING_PAYMENT" && payment?.status === "SUCCESS") {
      console.log(
        `Payment for order ${orderId} already processed. Ignoring duplicate webhook.`,
      );
      return order;
    }

    if (order.status !== expectedStatus) {
      const err = new Error(
        `Order state mismatch. Expected ${expectedStatus}, got ${order.status}`,
      );
      err.code = "INVALID_STATE";
      throw err;
    }

    if (amountCheck) {
      const orderTotal = new Prisma.Decimal(order.totalAmount);
      const paidAmount = new Prisma.Decimal(amountCheck.amount);
      const orderCurrency = payment?.currency || "LKR";

      if (
        !orderTotal.equals(paidAmount) ||
        orderCurrency !== amountCheck.currency
      ) {
        const err = new Error(
          `Amount mismatch. Database: ${orderTotal} ${orderCurrency}, Webhook: ${paidAmount} ${amountCheck.currency}`,
        );
        err.code = "AMOUNT_MISMATCH";
        throw err;
      }
    }

    const invalidItem = order.items.find((i) => !i.variantId);
    if (invalidItem) {
      throw new Error(
        `Cannot confirm order: Variant for item ${invalidItem.id} no longer exists.`,
      );
    }

    const now = new Date();
    const hasExpiredReservations = order.reservations.some(
      (res) => res.status !== "ACTIVE" || res.expiresAt <= now,
    );

    if (hasExpiredReservations) {
      const err = new Error(
        "Cannot confirm order: Inventory reservations have expired.",
      );
      err.code = "EXPIRED_RESERVATION";
      throw err;
    }

    const sortedVariantIds = [...order.items].map((i) => i.variantId).sort();

    for (const variantId of sortedVariantIds) {
      await tx.$queryRaw`SELECT id FROM "ProductVariant" WHERE id = ${variantId} FOR UPDATE`;

      const variant = await tx.productVariant.findUnique({
        where: { id: variantId },
      });
      const item = order.items.find((i) => i.variantId === variantId);

      if (variant.stock < item.quantity) {
        const err = new Error(
          `Insufficient physical stock for variant ${variantId}. Available: ${variant.stock}, Requested: ${item.quantity}`,
        );
        err.code = "INVENTORY_ERROR";
        throw err;
      }
    }

    await tx.inventoryReservation.updateMany({
      where: { orderId: order.id, status: "ACTIVE" },
      data: { status: "CONSUMED" },
    });

    for (const item of order.items) {
      await tx.productVariant.update({
        where: { id: item.variantId },
        data: { stock: { decrement: item.quantity } },
      });
    }

    const updatedOrder = await tx.order.update({
      where: { id: order.id },
      data: { status: "CONFIRMED" },
    });

    if (payment) {
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: "SUCCESS",
          ...(paymentDetails?.transactionId && {
            transactionId: paymentDetails.transactionId,
          }),
          ...(paymentDetails?.rawPayload && {
            rawPayload: paymentDetails.rawPayload,
          }),
        },
      });
    }

    await tx.orderStatusHistory.create({
      data: {
        orderId: order.id,
        fromStatus: order.status,
        toStatus: "CONFIRMED",
        changedBy: changedBy,
      },
    });

    return updatedOrder;
  });
}

// ==========================================
// BUSINESS GATEWAYS
// ==========================================

async function confirmWhatsAppOrder(orderId, changedBy = "SYSTEM") {
  return await finalizeOrderTransaction({
    orderId,
    expectedStatus: "PENDING_APPROVAL",
    changedBy,
  });
}

async function processPayHerePayment(payload) {
  const orderId = payload.order_id;

  return await finalizeOrderTransaction({
    orderId,
    expectedStatus: "PENDING_PAYMENT",
    changedBy: "SYSTEM: PAYHERE_WEBHOOK",
    paymentDetails: {
      transactionId: payload.payment_id,
      rawPayload: payload,
    },
    amountCheck: {
      amount: payload.payhere_amount,
      currency: payload.payhere_currency,
    },
  });
}

// ==========================================
// LATE PAYMENT RECONCILIATION
// ==========================================
async function handleLatePaymentFallback(orderId, payload) {
  return await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "Order" WHERE id = ${orderId} FOR UPDATE`;

    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { payments: true },
    });

    if (!order) return;

    if (order.payments.length > 0 && order.payments[0].status === "SUCCESS") {
      console.log(
        `Fallback idempotency: Payment for order ${orderId} already marked SUCCESS.`,
      );
      return order;
    }

    if (order.payments.length > 0) {
      await tx.payment.update({
        where: { id: order.payments[0].id },
        data: {
          status: "SUCCESS",
          transactionId: payload.payment_id,
          rawPayload: payload,
        },
      });
    }

    await tx.order.update({
      where: { id: orderId },
      data: { status: "EXPIRED" },
    });

    await tx.orderStatusHistory.create({
      data: {
        orderId: order.id,
        fromStatus: order.status,
        toStatus: "EXPIRED",
        changedBy: "SYSTEM: PAYHERE_WEBHOOK",
        note: "URGENT: Valid payment received, but inventory reservation expired or stock was unavailable. Manual reconciliation/refund required.",
      },
    });

    return order;
  });
}

// ==========================================
// ADMIN DASHBOARD OPERATIONS
// ==========================================

async function getAllOrders() {
  return await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      items: true,
      payments: {
        select: {
          id: true,
          paymentMethod: true,
          transactionId: true,
          amount: true,
          currency: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      },
    },
  });
}

async function cancelOrder(orderId, changedBy = "ADMIN: Manual Cancellation") {
  return await prisma.$transaction(async (tx) => {
    const lockedRows = await tx.$queryRaw`
      SELECT id FROM "Order" WHERE id = ${orderId} FOR UPDATE
    `;

    if (lockedRows.length === 0) {
      throw new Error("Order not found");
    }

    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { reservations: true },
    });

    if (
      order.status !== "PENDING_APPROVAL" &&
      order.status !== "PENDING_PAYMENT"
    ) {
      throw new Error(`Cannot cancel order in ${order.status} state`);
    }

    await tx.inventoryReservation.updateMany({
      where: { orderId: order.id, status: "ACTIVE" },
      data: { status: "RELEASED" },
    });

    const updatedOrder = await tx.order.update({
      where: { id: order.id },
      data: { status: "CANCELLED" },
    });

    await tx.orderStatusHistory.create({
      data: {
        orderId: order.id,
        fromStatus: order.status,
        toStatus: "CANCELLED",
        changedBy: changedBy,
      },
    });

    return updatedOrder;
  });
}

module.exports = {
  createOrder,
  confirmWhatsAppOrder,
  processPayHerePayment,
  handleLatePaymentFallback,
  cancelOrder,
  getAllOrders,
};
