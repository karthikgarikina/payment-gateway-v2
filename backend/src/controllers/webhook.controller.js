import { prisma } from "../config/db.js";
import { webhookQueue } from "../queue/queues.js";
export async function listWebhookLogs(req, res) {
  const limit = parseInt(req.query.limit || "10", 10);
  const offset = parseInt(req.query.offset || "0", 10);

  const [data, total] = await Promise.all([
    prisma.webhookLog.findMany({
      where: {
        merchant_id: req.merchant.id,
      },
      orderBy: { created_at: "desc" },
      take: limit,
      skip: offset,
      select: {
        id: true,
        event: true,
        status: true,
        attempts: true,
        created_at: true,
        last_attempt_at: true,
        response_code: true,
      },
    }),
    prisma.webhookLog.count({
      where: { merchant_id: req.merchant.id },
    }),
  ]);

  res.json({ data, total, limit, offset });
}
export async function retryWebhook(req, res) {
  const { webhook_id } = req.params;

  const log = await prisma.webhookLog.findFirst({
    where: {
      id: webhook_id,
      merchant_id: req.merchant.id,
    },
  });

  if (!log) {
    return res.status(404).json({
      error: {
        code: "NOT_FOUND",
        description: "Webhook not found",
      },
    });
  }

  // 🚫 Block retry if already delivered successfully
  if (log.status === "success") {
    return res.status(400).json({
      error: {
        code: "BAD_REQUEST_ERROR",
        description: "Webhook already delivered successfully",
      },
    });
  }

  // Reset webhook state (fresh retry cycle)
  await prisma.webhookLog.update({
    where: { id: log.id },
    data: {
      status: "pending",
      attempts: 0,
      next_retry_at: null,
      last_attempt_at: null,
    },
  });

  // Enqueue a NEW webhook job (fresh cycle)
  await webhookQueue.add("deliver-webhook", {
    merchantId: log.merchant_id,
    event: log.event,
    payload: log.payload, // payload only, worker wraps event + timestamp
  });

  return res.status(200).json({
    id: log.id,
    status: "pending",
    message: "Webhook retry scheduled",
  });
}
