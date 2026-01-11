import crypto from "crypto";

export function generateOrderId() {
  return "order_" + crypto.randomBytes(8).toString("hex");
}
