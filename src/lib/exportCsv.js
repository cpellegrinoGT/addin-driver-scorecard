function escapeCell(val) {
  const str = val == null ? "" : String(val);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

export function exportCsv(filename, headers, rows) {
  const headerLine = headers.map(escapeCell).join(",");
  const dataLines = rows.map((row) =>
    headers.map((h) => escapeCell(row[h])).join(",")
  );
  const csv = [headerLine, ...dataLines].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function buildScorecardCsvRows(
  driverRows,
  selectedRuleIds,
  ruleMap,
  isMetric
) {
  const headers = [
    "Driver",
    "Total Score",
    "Risk",
    isMetric ? "Distance (km)" : "Distance (mi)",
  ];

  for (const ruleId of selectedRuleIds) {
    const name = ruleMap[ruleId]?.name || ruleId;
    headers.push(`${name} Score`);
    headers.push(`${name} Events`);
  }

  const rows = driverRows.map((row) => {
    const distance = isMetric
      ? row.distanceKm
      : row.distanceKm * 0.621371;

    const obj = {
      Driver: row.driverName,
      "Total Score":
        row.totalScore !== null ? row.totalScore.toFixed(1) : "",
      Risk: row.risk === "noActivity" ? "No Activity" : row.risk,
    };
    obj[headers[3]] = Math.round(distance);

    for (const ruleId of selectedRuleIds) {
      const name = ruleMap[ruleId]?.name || ruleId;
      const score = row.ruleScores[ruleId];
      obj[`${name} Score`] = score !== null ? score.toFixed(1) : "";
      obj[`${name} Events`] = row.eventCounts[ruleId] || 0;
    }

    return obj;
  });

  return { headers, rows };
}
