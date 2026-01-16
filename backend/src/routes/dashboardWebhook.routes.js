import express from "express";
import {
  getWebhookConfig,
  updateWebhookConfig,
  rotateWebhookSecret,
  sendTestWebhook,
} from "../controllers/dashboardWebhook.controller.js";

import { authenticate } from "../middleware/auth.js";

const router = express.Router();

router.get(
  "/dashboard/webhook",
  authenticate,
  getWebhookConfig
);

router.post(
  "/dashboard/webhook",
  authenticate,
  updateWebhookConfig
);

router.post(
  "/dashboard/webhook/rotate-secret",
  authenticate,
  rotateWebhookSecret
);

router.post(
  "/dashboard/webhook/test",
  authenticate,
  sendTestWebhook
);

export default router;
