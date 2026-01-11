import { prisma } from "../config/db.js";
import crypto from "crypto";
import { isValidVPA } from "../utils/vpa.js";
import { isValidCardNumber } from "../utils/luhn.js";
import { detectCardNetwork } from "../utils/cardNetwork.js";
import { isValidExpiry } from "../utils/expiry.js";
import { sleep } from "../utils/delay.js";

function generatePaymentId() {
  return "pay_" + crypto.randomBytes(8).toString("hex");
}

/* ===========================
   MERCHANT (AUTH) CONTROLLERS
   =========================== */

export async function createPayment(req, res) {
  const { order_id, method, vpa, card } = req.body;

  const order = await prisma.order.findFirst({
    where: { id: order_id, merchant_id: req.merchant.id },
  });

  if (!order) {
    return res.status(404).json({
      error: { code: "NOT_FOUND", description: "Order not found" },
    });
  }

  let paymentData = {
    id: generatePaymentId(),
    order_id: order.id,
    merchant_id: req.merchant.id,
    amount: order.amount,
    currency: order.currency,
    method,
    status: "processing",
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

    if (
      !number ||
      !expiry_month ||
      !expiry_year ||
      !cvv ||
      !holder_name
    ) {
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

  let delay = 5000 + Math.random() * 5000;
  let successChance = method === "upi" ? 0.9 : 0.95;
  let success = Math.random() < successChance;

  if (process.env.TEST_MODE === "true") {
    delay = parseInt(process.env.TEST_PROCESSING_DELAY || "1000", 10);
    success = process.env.TEST_PAYMENT_SUCCESS !== "false";
  }

  await sleep(delay);

  const updated = await prisma.payment.update({
    where: { id: payment.id },
    data: success
      ? { status: "success" }
      : {
          status: "failed",
          error_code: "PAYMENT_FAILED",
          error_description: "Payment could not be completed",
        },
  });

  return res.status(201).json(updated);
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
    where: {
      merchant_id: req.merchant.id,
    },
    orderBy: {
      created_at: "desc",
    },
  });

  return res.status(200).json(payments);
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

  let paymentData = {
    id: generatePaymentId(),
    order_id: order.id,
    merchant_id: order.merchant_id,
    amount: order.amount,
    currency: order.currency,
    method,
    status: "processing",
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

    if (
      !number ||
      !expiry_month ||
      !expiry_year ||
      !cvv ||
      !holder_name
    ) {
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

  let delay = 5000 + Math.random() * 5000;
  let successChance = method === "upi" ? 0.9 : 0.95;
  let success = Math.random() < successChance;

  if (process.env.TEST_MODE === "true") {
    delay = parseInt(process.env.TEST_PROCESSING_DELAY || "1000", 10);
    success = process.env.TEST_PAYMENT_SUCCESS !== "false";
  }

  await sleep(delay);

  const updated = await prisma.payment.update({
    where: { id: payment.id },
    data: success
      ? { status: "success" }
      : {
          status: "failed",
          error_code: "PAYMENT_FAILED",
          error_description: "Payment could not be completed",
        },
  });

  return res.status(201).json(updated);
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
