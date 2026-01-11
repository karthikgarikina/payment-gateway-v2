import { Worker } from "bullmq";
import { connection } from "../queue/redis.js";

new Worker(
  "webhooks",
  async job => {
    console.log("webhook job received:", job.data);
  },
  { connection }
);
