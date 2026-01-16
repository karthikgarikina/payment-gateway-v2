import crypto from "crypto";
import { prisma } from "../config/db.js";
import { enqueueWebhook } from "../queue/webhook.producer.js";

/* ---------------- GET webhook config ---------------- */
export async function getWebhookConfig(req, res) {
  const merchantId = req.merchant.id;

  const merchant = await prisma.merchant.findUnique({
    where: { id: merchantId },
    select: {
      webhook_url: true,
      webhook_secret: true,
    },
  });

  return res.json({
    webhook_url: merchant.webhook_url,
    webhook_secret: merchant.webhook_secret,
  });
}

/* ---------------- SAVE webhook URL ---------------- */
export async function updateWebhookConfig(req, res) {
  const merchantId = req.merchant.id;
  const { webhook_url } = req.body;

  if (!webhook_url || typeof webhook_url !== "string") {
    return res.status(400).json({
      error: {
        code: "BAD_REQUEST_ERROR",
        description: "Invalid webhook URL",
      },
    });
  }

  await prisma.merchant.update({
    where: { id: merchantId },
    data: { webhook_url },
  });

  return res.json({ success: true });
}

/* ---------------- ROTATE webhook secret ---------------- */
export async function rotateWebhookSecret(req, res) {
  const merchantId = req.merchant.id;

  const newSecret =
    "whsec_" + crypto.randomBytes(8).toString("hex");

  await prisma.merchant.update({
    where: { id: merchantId },
    data: { webhook_secret: newSecret },
  });

  return res.json({ webhook_secret: newSecret });
}

/* ---------------- SEND test webhook ---------------- */
export async function sendTestWebhook(req, res) {
  const merchantId = req.merchant.id;

  const merchant = await prisma.merchant.findUnique({
    where: { id: merchantId },
  });

  if (!merchant.webhook_url) {
    return res.status(400).json({
      error: {
        code: "BAD_REQUEST_ERROR",
        description: "Webhook URL not configured",
      },
    });
  }

  const payload = {
    event: "payment.success",
    timestamp: Math.floor(Date.now() / 1000),
    data: {
      payment: {
        id: "pay_test_123",
        amount: 50000,
        currency: "INR",
      },
    },
  };

  // create webhook log
  const log = await prisma.webhookLog.create({
    data: {
      merchant_id: merchant.id,
      event: "payment.test",  
      payload: {
        event: "payment.test",
        data: {
          message: "This is a test webhook",
        },
      },
      status: "pending",
    },
  });


  // enqueue job
  await enqueueWebhook({
    webhookLogId: log.id,
  });

  return res.json({
    message: "Test webhook scheduled",
  });
}
