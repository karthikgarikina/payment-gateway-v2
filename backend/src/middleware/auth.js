import { prisma } from "../config/db.js";

export async function authenticate(req, res, next) {
  try {
    const apiKey = req.header("X-Api-Key");
    const apiSecret = req.header("X-Api-Secret");

    if (!apiKey || !apiSecret) {
      return res.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          description: "Missing API credentials",
        },
      });
    }

    const merchant = await prisma.merchant.findFirst({
      where: {
        api_key: apiKey,
        api_secret: apiSecret,
      },
    });

    if (!merchant) {
      return res.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          description: "Invalid API credentials",
        },
      });
    }

    req.merchant = merchant;
    next();
  } catch (err) {
    console.error("Auth error:", err);
    return res.status(500).json({
      error: {
        code: "INTERNAL_ERROR",
        description: "Authentication failed",
      },
    });
  }
}
