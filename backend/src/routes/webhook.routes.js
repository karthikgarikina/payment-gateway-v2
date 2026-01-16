import express from "express";
import { listWebhookLogs, retryWebhook } from "../controllers/webhook.controller.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

router.get("/webhooks", authenticate, listWebhookLogs);
router.post(
  "/webhooks/:webhook_id/retry",
  authenticate,
  retryWebhook
);
export default router;
