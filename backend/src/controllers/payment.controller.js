import { prisma } from "../config/db.js";
import crypto from "crypto";
import { isValidVPA } from "../utils/vpa.js";
import { isValidCardNumber } from "../utils/luhn.js";
import { detectCardNetwork } from "../utils/cardNetwork.js";
import { isValidExpiry } from "../utils/expiry.js";
import { paymentQueue } from "../queue/queues.js";
import {
  getIdempotentResponse,
  storeIdempotentResponse,
} from "../utils/idempotency.js";

function generatePaymentId() {
  return "pay_" + crypto.randomBytes(8).toString("hex");
}

/* ===========================
   MERCHANT (AUTH) CONTROLLERS
   =========================== */


export async function createPayment(req, res) {
  const idempotencyKey = req.headers["idempotency-key"];
  const merchantId = req.merchant.id;

  if (idempotencyKey) {
    const cached = await getIdempotentResponse(merchantId, idempotencyKey);
    if (cached) {
      return res.status(201).json(cached);
    }
  }

  const { order_id, method, vpa, card } = req.body;

  const order = await prisma.order.findFirst({
    where: { id: order_id, merchant_id: merchantId },
  });

  if (!order) {
    return res.status(404).json({
      error: { code: "NOT_FOUND", description: "Order not found" },
    });
  }

  const paymentData = {
    id: generatePaymentId(),
    order_id: order.id,
    merchant_id: merchantId,
    amount: order.amount,
    currency: order.currency,
    method,
    status: "pending",
  };

  if (method === "upi") {
    if (!vpa || !isValidVPA(vpa)) {
      return res.status(400).json({
        error: { code: "INVALID_VPA", description: "Invalid VPA" },
      });
    }
    paymentData.vpa = vpa;
  }

  if (method === "card") {
    if (!card) {
      return res.status(400).json({
        error: { code: "INVALID_CARD", description: "Card details required" },
      });
    }

    const { number, expiry_month, expiry_year, cvv, holder_name } = card;

    if (!number || !expiry_month || !expiry_year || !cvv || !holder_name) {
      return res.status(400).json({
        error: { code: "INVALID_CARD", description: "Missing card fields" },
      });
    }

    if (!isValidCardNumber(number)) {
      return res.status(400).json({
        error: { code: "INVALID_CARD", description: "Invalid card number" },
      });
    }

    if (!isValidExpiry(expiry_month, expiry_year)) {
      return res.status(400).json({
        error: { code: "INVALID_EXPIRY", description: "Card expired" },
      });
    }

    paymentData.card_network = detectCardNetwork(number);
    paymentData.card_last4 = number.slice(-4);
  }

  const payment = await prisma.payment.create({ data: paymentData });

  await paymentQueue.add("process-payment", {
    paymentId: payment.id,
  });

  if (idempotencyKey) {
    await storeIdempotentResponse(merchantId, idempotencyKey, payment);
  }

  return res.status(201).json(payment);
}



export async function getPayment(req, res) {
  const { payment_id } = req.params;

  const payment = await prisma.payment.findFirst({
    where: {
      id: payment_id,
      merchant_id: req.merchant.id,
    },
  });

  if (!payment) {
    return res.status(404).json({
      error: { code: "NOT_FOUND", description: "Payment not found" },
    });
  }

  return res.status(200).json(payment);
}

export async function listPayments(req, res) {
  const payments = await prisma.payment.findMany({
    where: { merchant_id: req.merchant.id },
    orderBy: { created_at: "desc" },
  });

  return res.status(200).json(payments);
}
export async function capturePayment(req, res) {
  const { payment_id } = req.params;
  const { amount } = req.body;

  const payment = await prisma.payment.findFirst({
    where: {
      id: payment_id,
      merchant_id: req.merchant.id,
    },
  });

  if (!payment) {
    return res.status(404).json({
      error: {
        code: "NOT_FOUND",
        description: "Payment not found",
      },
    });
  }

  if (payment.status !== "success" || payment.captured === true) {
    return res.status(400).json({
      error: {
        code: "BAD_REQUEST_ERROR",
        description: "Payment not in capturable state",
      },
    });
  }

  if (amount !== payment.amount) {
    return res.status(400).json({
      error: {
        code: "BAD_REQUEST_ERROR",
        description: "Capture amount mismatch",
      },
    });
  }

  const updated = await prisma.payment.update({
    where: { id: payment.id },
    data: {
      captured: true,
    },
  });

  return res.status(200).json(updated);
}


/* ===========================
   PUBLIC (CHECKOUT) CONTROLLERS
   =========================== */


export async function createPublicPayment(req, res) {
  const { order_id, method, vpa, card } = req.body;

  const order = await prisma.order.findUnique({
    where: { id: order_id },
  });

  if (!order) {
    return res.status(404).json({
      error: { code: "NOT_FOUND", description: "Order not found" },
    });
  }

  const paymentData = {
    id: generatePaymentId(),
    order_id: order.id,
    merchant_id: order.merchant_id,
    amount: order.amount,
    currency: order.currency,
    method,
    status: "pending", // ✅ async lifecycle
  };

  if (method === "upi") {
    if (!vpa || !isValidVPA(vpa)) {
      return res.status(400).json({
        error: { code: "INVALID_VPA", description: "Invalid VPA" },
      });
    }
    paymentData.vpa = vpa;
  }

  if (method === "card") {
    if (!card) {
      return res.status(400).json({
        error: { code: "INVALID_CARD", description: "Card details required" },
      });
    }

    const { number, expiry_month, expiry_year, cvv, holder_name } = card;

    if (!number || !expiry_month || !expiry_year || !cvv || !holder_name) {
      return res.status(400).json({
        error: { code: "INVALID_CARD", description: "Missing card fields" },
      });
    }

    if (!isValidCardNumber(number)) {
      return res.status(400).json({
        error: { code: "INVALID_CARD", description: "Invalid card number" },
      });
    }

    if (!isValidExpiry(expiry_month, expiry_year)) {
      return res.status(400).json({
        error: { code: "INVALID_EXPIRY", description: "Card expired" },
      });
    }

    paymentData.card_network = detectCardNetwork(number);
    paymentData.card_last4 = number.slice(-4);
  }

  const payment = await prisma.payment.create({
    data: paymentData,
  });

  // ✅ enqueue async processing
  await paymentQueue.add("process-payment", {
    paymentId: payment.id,
  });

  return res.status(201).json(payment);
}

export async function getPublicPayment(req, res) {
  const { payment_id } = req.params;

  const payment = await prisma.payment.findUnique({
    where: { id: payment_id },
  });

  if (!payment) {
    return res.status(404).json({
      error: { code: "NOT_FOUND", description: "Payment not found" },
    });
  }

  return res.status(200).json(payment);
}
