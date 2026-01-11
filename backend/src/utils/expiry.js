export function isValidExpiry(month, year) {
  const m = parseInt(month, 10);
  if (m < 1 || m > 12) return false;

  let y = parseInt(year, 10);
  if (year.length === 2) y += 2000;

  const now = new Date();
  const exp = new Date(y, m - 1, 1);
  exp.setMonth(exp.getMonth() + 1);

  return exp >= now;
}
