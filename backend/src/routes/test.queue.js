import express from "express";
import { paymentQueue } from "../queue/queues.js";

const router = express.Router();

router.post("/test/payment-job", async (req, res) => {
  await paymentQueue.add("test", { hello: "world" });
  res.json({ ok: true });
});

export default router;
