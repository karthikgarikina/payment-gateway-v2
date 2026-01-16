export function getRetryDelay(attempt) {
  const testMode = process.env.WEBHOOK_RETRY_INTERVALS_TEST === "true";

  if (testMode) {
    const testDelays = [0, 5000, 10000, 15000, 20000];
    return testDelays[attempt - 1] ?? null;
  }

  const prodDelays = [
    0,                  // immediate
    60 * 1000,          // 1 min
    5 * 60 * 1000,      // 5 min
    30 * 60 * 1000,     // 30 min
    2 * 60 * 60 * 1000 // 2 hrs
  ];

  return prodDelays[attempt - 1] ?? null;
}
