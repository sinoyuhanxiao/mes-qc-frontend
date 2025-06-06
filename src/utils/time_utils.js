// src/utils/timeUtil.js
export function convertDateRangeToUtc(dateRange) {
  if (!Array.isArray(dateRange) || dateRange.length !== 2) return [];

  // automatically reset the time from 00:00 to 23:59
  const start = new Date(dateRange[0]);
  start.setHours(0, 0, 0, 0);

  const end = new Date(dateRange[1]);
  end.setHours(23, 59, 59, 999);

  return [start.toISOString(), end.toISOString()];
}

