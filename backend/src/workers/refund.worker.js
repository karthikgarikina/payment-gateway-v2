import { Worker } from "bullmq";
import { prisma } from "../config/db.js";
import { connection } from "../queue/redis.js";
import { webhookQueue } from "../queue/queues.js";

new Worker(
  "refunds",
  async (job) => {
    const { refundId } = job.data;

    console.log("Processing refund:", refundId);

    const refund = await prisma.refund.findUnique({
      where: { id: refundId },
      include: { payment: true },
    });

    if (!refund) return;

    // ----- validation -----
    if (!refund.payment || refund.payment.status !== "success") {
      throw new Error("Payment not refundable");
    }

    if (refund.amount <= 0) {
      throw new Error("Invalid refund amount");
    }

    // ----- delay -----
    const delay =
      process.env.TEST_MODE === "true"
        ? 1000
        : 3000 + Math.random() * 2000;

    await new Promise((r) => setTimeout(r, delay));

    // ----- update refund -----
    const processedRefund = await prisma.refund.update({
      where: { id: refund.id },
      data: {
        status: "processed",
        processed_at: new Date(),
      },
    });

    console.log("Refund processed:", refund.id);

    // ----- enqueue webhook -----
    await webhookQueue.add("deliver-webhook", {
      merchantId: refund.merchant_id,
      event: "refund.processed",
      payload: {
        refund: processedRefund,
      },
    });
  },
  { connection }
);

console.log("🚀 refund Worker listening to BullMQ queues");
