import { paymentQueue, webhookQueue, refundQueue } from "../queue/queues.js";

export async function jobStatus(req, res) {
  const payments = await paymentQueue.getJobCounts();
  const webhooks = await webhookQueue.getJobCounts();
  const refunds = await refundQueue.getJobCounts();

  res.json({
    pending: payments.waiting + webhooks.waiting + refunds.waiting,
    processing: payments.active + webhooks.active + refunds.active,
    completed: payments.completed + webhooks.completed + refunds.completed,
    failed: payments.failed + webhooks.failed + refunds.failed,
    worker_status: "running",
  });
}
