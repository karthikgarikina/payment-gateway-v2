import express from "express";
import { authenticate } from "../middleware/auth.js";
import { createOrder, getOrder } from "../controllers/order.controller.js";
import { prisma } from "../config/db.js";

const router = express.Router();

router.post("/api/v1/orders", authenticate, createOrder);
router.get("/api/v1/orders/:order_id", authenticate, getOrder);
router.get("/api/v1/orders/:order_id/public", async (req, res) => {
  const { order_id } = req.params;

  const order = await prisma.order.findFirst({
    where: { id: order_id },
    select: {
      id: true,
      amount: true,
      currency: true,
      status: true,
    },
  });

  if (!order) {
    return res.status(404).json({
      error: { code: "NOT_FOUND", description: "Order not found" },
    });
  }

  res.json(order);
});


export default router;
