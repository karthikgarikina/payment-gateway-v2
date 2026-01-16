import { Worker } from "bullmq";
import { prisma } from "../config/db.js";
import { connection } from "../queue/redis.js";
import { webhookQueue } from "../queue/queues.js";

new Worker(
  "payments",
  async (job) => {
    const { paymentId } = job.data;

    console.log("Processing payment:", paymentId);

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) return;

    // ----- delay -----
    let delay = 5000 + Math.random() * 5000;
    let success =
      payment.method === "upi"
        ? Math.random() < 0.9
        : Math.random() < 0.95;

    if (process.env.TEST_MODE === "true") {
      delay = Number(process.env.TEST_PROCESSING_DELAY || 1000);
      success = process.env.TEST_PAYMENT_SUCCESS !== "false";
    }

    await new Promise((r) => setTimeout(r, delay));

    // ----- update payment -----
    const updatedPayment = await prisma.payment.update({
      where: { id: payment.id },
      data: success
        ? { status: "success" }
        : {
            status: "failed",
            error_code: "PAYMENT_FAILED",
            error_description: "Payment could not be completed",
          },
    });

    console.log("Payment updated:", paymentId);

    // ----- enqueue webhook (NO LOG CREATION HERE) -----
    await webhookQueue.add("deliver-webhook", {
      merchantId: updatedPayment.merchant_id,
      event:
        updatedPayment.status === "success"
          ? "payment.success"
          : "payment.failed",
      payload: {
        payment: updatedPayment,
      },
    });
  },
  { connection }
);

console.log("🚀 payment Worker listening to BullMQ queues");
