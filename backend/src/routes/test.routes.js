import express from "express";
import { prisma } from "../config/db.js";

const router = express.Router();

router.get("/api/v1/test/merchant", async (req, res) => {
  const merchant = await prisma.merchant.findFirst({
    where: { email: "test@example.com" },
  });

  if (!merchant) return res.sendStatus(404);

  res.json({
    id: merchant.id,
    email: merchant.email,
    api_key: merchant.api_key,
    seeded: true,
  });
});

export default router;
