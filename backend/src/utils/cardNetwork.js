export function detectCardNetwork(number) {
  const clean = number.replace(/[\s-]/g, "");

  if (/^4/.test(clean)) return "visa";
  if (/^5[1-5]/.test(clean)) return "mastercard";
  if (/^3[47]/.test(clean)) return "amex";
  if (/^(60|65|8[1-9])/.test(clean)) return "rupay";

  return "unknown";
}
