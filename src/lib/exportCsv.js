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
  isMetric,
  entityLabel,
  safetyCenterData,
  showSafety
) {
  const entityCol = entityLabel === "Asset" ? "Asset" : "Driver";
  const headers = [
    entityCol,
    "Total Score",
    "Risk",
    isMetric ? "Distance (km)" : "Distance (mi)",
  ];

  for (const ruleId of selectedRuleIds) {
    const name = ruleMap[ruleId]?.name || ruleId;
    headers.push(`${name} Score`);
    headers.push(`${name} Events`);
  }

  const scActive = showSafety && safetyCenterData?.summaryByEntity;
  if (scActive) {
    headers.push(
      "Safety Rank",
      "Crash Prob",
      "Collisions",
      "Accel Rank",
      "Braking Rank",
      "Cornering Rank",
      "Speeding Rank",
      "Seatbelt Rank"
    );
  }

  const rows = driverRows.map((row) => {
    const distance = isMetric
      ? row.distanceKm
      : row.distanceKm * 0.621371;

    const obj = {
      [entityCol]: row.driverName,
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

    if (scActive) {
      const sc = safetyCenterData.summaryByEntity.get(row.driverId);
      obj["Safety Rank"] =
        sc?.overallSafetyRank != null ? sc.overallSafetyRank.toFixed(0) : "";
      obj["Crash Prob"] =
        sc?.crashProbabilityKm != null
          ? Math.round(sc.crashProbabilityKm)
          : "";
      obj["Collisions"] = sc?.collisionCount ?? "";
      obj["Accel Rank"] =
        sc?.harshAccelerationRank != null
          ? sc.harshAccelerationRank.toFixed(0)
          : "";
      obj["Braking Rank"] =
        sc?.harshBrakingRank != null ? sc.harshBrakingRank.toFixed(0) : "";
      obj["Cornering Rank"] =
        sc?.harshCorneringRank != null
          ? sc.harshCorneringRank.toFixed(0)
          : "";
      obj["Speeding Rank"] =
        sc?.speedingRank != null ? sc.speedingRank.toFixed(0) : "";
      obj["Seatbelt Rank"] =
        sc?.seatbeltRank != null ? sc.seatbeltRank.toFixed(0) : "";
    }

    return obj;
  });

  return { headers, rows };
}

export function buildDriverDetailCsvRows(driverRow, ruleMap, isMetric, scSummary) {
  const headers = ["Rule", "Score", "Events", "Weight (%)"];
  const rows = Object.keys(driverRow.ruleScores).map((ruleId) => {
    const score = driverRow.ruleScores[ruleId];
    return {
      Rule: ruleMap[ruleId]?.name || ruleId,
      Score: score !== null ? score.toFixed(1) : "",
      Events: driverRow.eventCounts[ruleId] || 0,
      "Weight (%)": "",
    };
  });

  const distance = isMetric
    ? driverRow.distanceKm
    : driverRow.distanceKm * 0.621371;

  rows.push({
    Rule: "TOTAL",
    Score: driverRow.totalScore !== null ? driverRow.totalScore.toFixed(1) : "",
    Events: "",
    "Weight (%)": "",
  });

  rows.push({
    Rule: isMetric ? "Distance (km)" : "Distance (mi)",
    Score: Math.round(distance),
    Events: "",
    "Weight (%)": "",
  });

  if (scSummary) {
    rows.push({ Rule: "", Score: "", Events: "", "Weight (%)": "" });
    rows.push({
      Rule: "SAFETY CENTER",
      Score: "",
      Events: "",
      "Weight (%)": "",
    });
    rows.push({
      Rule: "Safety Rank",
      Score: scSummary.overallSafetyRank != null ? scSummary.overallSafetyRank.toFixed(0) : "",
      Events: "",
      "Weight (%)": "",
    });
    rows.push({
      Rule: "Crash Prob",
      Score: scSummary.crashProbabilityKm != null ? Math.round(scSummary.crashProbabilityKm) : "",
      Events: "",
      "Weight (%)": "",
    });
    rows.push({
      Rule: "Collisions",
      Score: scSummary.collisionCount ?? 0,
      Events: "",
      "Weight (%)": "",
    });
    rows.push({
      Rule: "Accel Rank",
      Score: scSummary.harshAccelerationRank != null ? scSummary.harshAccelerationRank.toFixed(0) : "",
      Events: "",
      "Weight (%)": "",
    });
    rows.push({
      Rule: "Braking Rank",
      Score: scSummary.harshBrakingRank != null ? scSummary.harshBrakingRank.toFixed(0) : "",
      Events: "",
      "Weight (%)": "",
    });
    rows.push({
      Rule: "Cornering Rank",
      Score: scSummary.harshCorneringRank != null ? scSummary.harshCorneringRank.toFixed(0) : "",
      Events: "",
      "Weight (%)": "",
    });
    rows.push({
      Rule: "Speeding Rank",
      Score: scSummary.speedingRank != null ? scSummary.speedingRank.toFixed(0) : "",
      Events: "",
      "Weight (%)": "",
    });
    rows.push({
      Rule: "Seatbelt Rank",
      Score: scSummary.seatbeltRank != null ? scSummary.seatbeltRank.toFixed(0) : "",
      Events: "",
      "Weight (%)": "",
    });
  }

  return { headers, rows };
}
