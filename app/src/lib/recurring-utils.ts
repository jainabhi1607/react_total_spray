/** Advance a date by period: 1=years, 2=months, 3=weeks */
export function advanceDate(date: Date, period: number, range: number): Date {
  const next = new Date(date);
  if (period === 1) next.setFullYear(next.getFullYear() + range);
  else if (period === 2) next.setMonth(next.getMonth() + range);
  else if (period === 3) next.setDate(next.getDate() + range * 7);
  return next;
}
