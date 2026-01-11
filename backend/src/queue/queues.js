import { Queue } from "bullmq";
import { connection } from "./redis.js";

export const paymentQueue = new Queue("payments", { connection });
export const webhookQueue = new Queue("webhooks", { connection });
export const refundQueue  = new Queue("refunds",  { connection });
