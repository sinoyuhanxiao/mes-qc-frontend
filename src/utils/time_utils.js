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

export function formatClientTime(utcDateTime) {
  if (!utcDateTime) return "-";

  // 只在不含时区信息的时间戳后加 Z，避免重复加导致 Invalid Date
  const dateStr = /Z|[+-]\d{2}:?\d{2}/.test(utcDateTime) ? utcDateTime : utcDateTime + "Z";

  const utcDate = new Date(dateStr);
  if (isNaN(utcDate.getTime())) return "Invalid Date";

  return utcDate.toLocaleString("zh-CN", {
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  }).replace(/\//g, "-");
}

