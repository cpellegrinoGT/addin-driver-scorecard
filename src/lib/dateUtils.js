export function dayKey(d) {
  const dt = typeof d === "string" ? new Date(d) : d;
  return dt.toISOString().slice(0, 10);
}

export function weekKey(d) {
  const dt = typeof d === "string" ? new Date(d) : new Date(d);
  const day = dt.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(dt);
  monday.setDate(monday.getDate() + diff);
  return monday.toISOString().slice(0, 10);
}

export function monthKey(d) {
  const dt = typeof d === "string" ? new Date(d) : d;
  return dt.toISOString().slice(0, 7);
}

export function formatDate(d) {
  const dt = typeof d === "string" ? new Date(d) : d;
  return `${dt.getMonth() + 1}/${dt.getDate()}/${dt.getFullYear()}`;
}

export function formatPct(n) {
  return (n * 100).toFixed(1) + "%";
}

export function formatNumber(n, decimals = 0) {
  return n.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function getDateRange(preset, fromDate, toDate) {
  const now = new Date();
  now.setHours(23, 59, 59, 999);

  switch (preset) {
    case "yesterday": {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      return { from: dayKey(y), to: dayKey(now) };
    }
    case "7days": {
      const d = new Date(now);
      d.setDate(d.getDate() - 7);
      return { from: dayKey(d), to: dayKey(now) };
    }
    case "30days": {
      const d = new Date(now);
      d.setDate(d.getDate() - 30);
      return { from: dayKey(d), to: dayKey(now) };
    }
    case "custom":
      return { from: fromDate, to: toDate };
    default:
      return { from: fromDate, to: toDate };
  }
}

export function autoSelectGranularity(fromDate, toDate) {
  const from = new Date(fromDate);
  const to = new Date(toDate);
  const days = (to - from) / (1000 * 60 * 60 * 24);
  if (days <= 14) return "day";
  if (days <= 60) return "week";
  return "month";
}

export function chunkDateRange(fromDate, toDate, chunkDays) {
  const chunks = [];
  let start = new Date(fromDate);
  const end = new Date(toDate);

  while (start < end) {
    const chunkEnd = new Date(start);
    chunkEnd.setDate(chunkEnd.getDate() + chunkDays);
    if (chunkEnd > end) {
      chunks.push({ from: start.toISOString(), to: end.toISOString() });
    } else {
      chunks.push({
        from: start.toISOString(),
        to: chunkEnd.toISOString(),
      });
    }
    start = chunkEnd;
  }

  return chunks;
}

export function getKeyFn(granularity) {
  switch (granularity) {
    case "day":
      return dayKey;
    case "week":
      return weekKey;
    case "month":
      return monthKey;
    default:
      return dayKey;
  }
}
