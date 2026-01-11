import { Worker } from "bullmq";
import { connection } from "../queue/redis.js";

new Worker(
  "payments",
  async job => {
    console.log("payment job received:", job.data);
  },
  { connection }
);
