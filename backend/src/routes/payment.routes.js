import express from "express";
import { authenticate } from "../middleware/auth.js";
import {
  createPayment,
  getPayment,
  listPayments,
  createPublicPayment,
  getPublicPayment,
} from "../controllers/payment.controller.js";

const router = express.Router();

/* ===== PUBLIC (CHECKOUT) ===== */
router.post("/public", createPublicPayment);
router.get("/:payment_id/public", getPublicPayment);

/* ===== MERCHANT (DASHBOARD) ===== */
router.post("/", authenticate, createPayment);
router.get("/", authenticate, listPayments);
router.get("/:payment_id", authenticate, getPayment);

export default router;
