import express from "express";
import { createRefund, getRefund } from "../controllers/refund.controller.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

router.post(
  "/payments/:payment_id/refunds",
  authenticate,
  createRefund
);

router.get("/refunds/:refund_id", authenticate, getRefund);

export default router;
