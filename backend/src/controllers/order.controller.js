import { prisma } from "../config/db.js";
import { generateOrderId } from "../utils/idGenerator.js";

export async function createOrder(req, res) {
  const { amount, currency = "INR", receipt, notes } = req.body;

  if (!Number.isInteger(amount) || amount < 100) {
    return res.status(400).json({
      error: {
        code: "BAD_REQUEST_ERROR",
        description: "amount must be at least 100",
      },
    });
  }

  let orderId;
  while (true) {
    orderId = generateOrderId();
    const exists = await prisma.order.findUnique({ where: { id: orderId } });
    if (!exists) break;
  }

  const order = await prisma.order.create({
    data: {
      id: orderId,
      merchant_id: req.merchant.id,
      amount,
      currency,
      receipt,
      notes,
      status: "created",
    },
  });

  return res.status(201).json({
    id: order.id,
    merchant_id: order.merchant_id,
    amount: order.amount,
    currency: order.currency,
    receipt: order.receipt,
    notes: order.notes,
    status: order.status,
    created_at: order.created_at,
  });
}

export async function getOrder(req, res) {
  const { order_id } = req.params;

  const order = await prisma.order.findFirst({
    where: {
      id: order_id,
      merchant_id: req.merchant.id,
    },
  });

  if (!order) {
    return res.status(404).json({
      error: {
        code: "NOT_FOUND_ERROR",
        description: "Order not found",
      },
    });
  }

  return res.status(200).json(order);
}
