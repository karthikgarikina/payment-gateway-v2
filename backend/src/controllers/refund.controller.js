import { prisma } from "../config/db.js";
import crypto from "crypto";
import { refundQueue } from "../queue/queues.js";

function generateRefundId() {
  return "rfnd_" + crypto.randomBytes(8).toString("hex");
}

export async function createRefund(req, res) {
  const { payment_id } = req.params;
  const { amount, reason } = req.body;

  const payment = await prisma.payment.findFirst({
    where: {
      id: payment_id,
      merchant_id: req.merchant.id,
    },
  });

  if (!payment || payment.status !== "success") {
    return res.status(400).json({
      error: {
        code: "BAD_REQUEST_ERROR",
        description: "Payment not refundable",
      },
    });
  }

  if (!amount || amount <= 0) {
    return res.status(400).json({
      error: {
        code: "BAD_REQUEST_ERROR",
        description: "Refund amount must be greater than zero",
      },
    });
  }

  const refunds = await prisma.refund.findMany({
    where: {
      payment_id,
      status: { in: ["pending", "processed"] },
    },
  });

  const refundedAmount = refunds.reduce((s, r) => s + r.amount, 0);

  if (amount > payment.amount - refundedAmount) {
    return res.status(400).json({
      error: {
        code: "BAD_REQUEST_ERROR",
        description: "Refund amount exceeds available amount",
      },
    });
  }

  const refund = await prisma.refund.create({
    data: {
      id: generateRefundId(),
      payment_id,
      merchant_id: req.merchant.id,
      amount,
      reason,
      status: "pending",
    },
  });

  await refundQueue.add("process-refund", {
    refundId: refund.id,
  });

  return res.status(201).json(refund);
}

export async function getRefund(req, res) {
  const { refund_id } = req.params;

  const refund = await prisma.refund.findFirst({
    where: {
      id: refund_id,
      merchant_id: req.merchant.id,
    },
  });

  if (!refund) {
    return res.status(404).json({
      error: { code: "NOT_FOUND", description: "Refund not found" },
    });
  }

  return res.status(200).json(refund);
}

