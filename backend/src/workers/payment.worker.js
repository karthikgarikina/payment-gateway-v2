import { Worker } from "bullmq";
import { prisma } from "../config/db.js";
import { connection } from "../queue/redis.js";

new Worker(
  "payments",
  async (job) => {
    const { paymentId } = job.data;

    console.log("Processing payment:", paymentId);

    let delay = 5000;
    let success = Math.random() < 0.9;

    if (process.env.TEST_MODE === "true") {
      delay = Number(process.env.TEST_PROCESSING_DELAY || 1000);
      success = process.env.TEST_PAYMENT_SUCCESS !== "false";
    }

    await new Promise((r) => setTimeout(r, delay));

    await prisma.payment.update({
      where: { id: paymentId },
      data: success
        ? { status: "success" }
        : {
            status: "failed",
            error_code: "PAYMENT_FAILED",
            error_description: "Payment could not be completed",
          },
    });

    console.log("Payment updated:", paymentId);
  },
  { connection }
);
