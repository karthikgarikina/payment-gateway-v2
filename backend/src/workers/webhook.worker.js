import { Worker } from "bullmq";
import { prisma } from "../config/db.js";
import { connection } from "../queue/redis.js";
import { generateWebhookSignature } from "../utils/webhookSignature.js";
import { getRetryDelay } from "../utils/retrySchedule.js";

new Worker(
  "webhooks",
  async (job) => {
    const { merchantId, event, payload } = job.data;

    console.log("Delivering webhook:", event);

    // 1️⃣ ALWAYS create webhook log first
    const log = await prisma.webhookLog.create({
      data: {
        merchant_id: merchantId,
        event,
        payload,
        status: "pending",
        attempts: 0,
      },
    });

    const merchant = await prisma.merchant.findUnique({
      where: { id: merchantId },
    });

    // 2️⃣ If merchant or webhook_url missing → mark failed
    if (!merchant || !merchant.webhook_url) {
      await prisma.webhookLog.update({
        where: { id: log.id },
        data: {
          status: "failed",
          attempts: 1,
          last_attempt_at: new Date(),
          response_body: "Webhook URL not configured",
        },
      });
      return;
    }

    const payloadString = JSON.stringify({
      event,
      timestamp: Math.floor(Date.now() / 1000),
      data: payload,
    });

    const signature = generateWebhookSignature(
      payloadString,
      merchant.webhook_secret || ""
    );

    const attempt = log.attempts + 1;

    try {
      const res = await fetch(merchant.webhook_url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Webhook-Signature": signature,
        },
        body: payloadString,
      });

      await prisma.webhookLog.update({
        where: { id: log.id },
        data: {
          status: res.ok ? "success" : "pending",
          attempts: attempt,
          response_code: res.status,
          last_attempt_at: new Date(),
          next_retry_at: !res.ok && attempt < 5
            ? new Date(Date.now() + getRetryDelay(attempt))
            : null,
        },
      });

      if (!res.ok && attempt < 5) {
        throw new Error("Webhook delivery failed");
      }
    } catch (err) {
      if (attempt >= 5) {
        await prisma.webhookLog.update({
          where: { id: log.id },
          data: {
            status: "failed",
            attempts: attempt,
            last_attempt_at: new Date(),
          },
        });
      }
      throw err; // BullMQ retry
    }
  },
  { connection }
);

console.log("🚀 webhook Worker listening to BullMQ queues");
