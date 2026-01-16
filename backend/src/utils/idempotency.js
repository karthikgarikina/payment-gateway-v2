import { prisma } from "../config/db.js";

const EXPIRY_MS = 24 * 60 * 60 * 1000;

export async function getIdempotentResponse(merchantId, key) {
  const record = await prisma.idempotencyKey.findUnique({
    where: {
      key_merchant_id: {
        key,
        merchant_id: merchantId,
      },
    },
  });

  if (!record) return null;

  if (record.expires_at < new Date()) {
    await prisma.idempotencyKey.delete({
      where: {
        key_merchant_id: {
          key,
          merchant_id: merchantId,
        },
      },
    });
    return null;
  }

  return record.response;
}

export async function storeIdempotentResponse(merchantId, key, response) {
  await prisma.idempotencyKey.create({
    data: {
      key,
      merchant_id: merchantId,
      response,
      expires_at: new Date(Date.now() + EXPIRY_MS),
    },
  });
}
