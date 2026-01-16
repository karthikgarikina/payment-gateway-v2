import { webhookQueue } from "./queues.js";

export async function enqueueWebhook({ merchantId, event, payload }) {
  await webhookQueue.add("deliver-webhook", {
    merchantId,
    event,
    payload,
  });
}
