import { Worker } from "bullmq";
import { connection } from "../queue/redis.js";

new Worker(
  "refunds",
  async job => {
    console.log("refund job received:", job.data);
  },
  { connection }
);
