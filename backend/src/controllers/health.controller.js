import { prisma } from "../config/db.js";

export async function healthCheck(req, res) {
  let dbStatus = "disconnected";

  try {
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = "connected";
  } catch (e) {
    dbStatus = "disconnected";
  }

  return res.status(200).json({
    status: "healthy",
    database: dbStatus,
    timestamp: new Date().toISOString(),
  });
}
