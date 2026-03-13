import { useState, useMemo } from "react";
import DriverTableRow from "./DriverTableRow.jsx";
import { PAGE_SIZE } from "../../lib/constants.js";
import { exportCsv, buildScorecardCsvRows } from "../../lib/exportCsv.js";

export default function DriverTable({
  driverRows,
  settings,
  ruleMap,
  isMetric,
  onDriverClick,
  entityLabel,
  safetyCenterData,
  showSafety,
}) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState("totalScore");
  const [sortDir, setSortDir] = useState("desc");
  const [page, setPage] = useState(0);

  const ruleColumns = settings.selectedRuleIds
    .map((id) => ({
      id,
      name: ruleMap[id]?.name || id,
      color: settings.ruleColors[id] || "#4a90d9",
    }));

  const scActive = showSafety && safetyCenterData?.summaryByEntity;

  function getScSummary(driverId) {
    return scActive ? safetyCenterData.summaryByEntity.get(driverId) : null;
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return driverRows;
    return driverRows.filter((r) =>
      r.driverName.toLowerCase().includes(q)
    );
  }, [driverRows, search]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let av, bv;
      if (sortKey === "driverName") {
        return sortDir === "asc"
          ? a.driverName.localeCompare(b.driverName)
          : b.driverName.localeCompare(a.driverName);
      } else if (sortKey === "distanceKm") {
        av = a.distanceKm;
        bv = b.distanceKm;
      } else if (sortKey === "totalScore") {
        av = a.totalScore ?? -1;
        bv = b.totalScore ?? -1;
      } else if (sortKey === "sc_rank") {
        av = getScSummary(a.driverId)?.overallSafetyRank ?? -1;
        bv = getScSummary(b.driverId)?.overallSafetyRank ?? -1;
      } else if (sortKey === "sc_crash") {
        av = getScSummary(a.driverId)?.crashProbabilityKm ?? -1;
        bv = getScSummary(b.driverId)?.crashProbabilityKm ?? -1;
      } else if (sortKey.startsWith("rule_")) {
        const ruleId = sortKey.slice(5);
        av = a.ruleScores?.[ruleId] ?? -1;
        bv = b.ruleScores?.[ruleId] ?? -1;
      } else {
        av = 0;
        bv = 0;
      }
      return sortDir === "asc" ? av - bv : bv - av;
    });
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const safePageIndex = Math.min(page, totalPages - 1);
  const pageRows = sorted.slice(
    safePageIndex * PAGE_SIZE,
    (safePageIndex + 1) * PAGE_SIZE
  );

  function handleSort(key) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
    setPage(0);
  }

  function indicator(key) {
    if (sortKey !== key) return "";
    return sortDir === "asc" ? " ▲" : " ▼";
  }

  function handleExportCsv() {
    const { headers, rows } = buildScorecardCsvRows(
      driverRows,
      settings.selectedRuleIds,
      ruleMap,
      isMetric,
      entityLabel,
      scActive ? safetyCenterData : null,
      showSafety
    );
    const filename = entityLabel === "Asset" ? "asset_scorecard.csv" : "driver_scorecard.csv";
    exportCsv(filename, headers, rows);
  }

  return (
    <div>
      <div className="scorecard-table-header">
        <h3>All {entityLabel === "Asset" ? "Assets" : "Drivers"} ({filtered.length})</h3>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input
            className="scorecard-search"
            placeholder={`Search ${entityLabel === "Asset" ? "assets" : "drivers"}…`}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
          />
          <button
            className="scorecard-btn scorecard-btn-outline scorecard-btn-sm"
            onClick={handleExportCsv}
            title="Export to CSV"
          >
            CSV
          </button>
          <button
            className="scorecard-btn scorecard-btn-outline scorecard-btn-sm"
            onClick={() => window.print()}
            title="Print / Save as PDF"
          >
            Print
          </button>
        </div>
      </div>

      <div className="scorecard-table-wrap">
        <table className="scorecard-table">
          <thead>
            <tr>
              <th onClick={() => handleSort("driverName")}>
                {entityLabel || "Driver"}
                <span className="scorecard-sort-indicator">
                  {indicator("driverName")}
                </span>
              </th>
              <th onClick={() => handleSort("totalScore")}>
                Score
                <span className="scorecard-sort-indicator">
                  {indicator("totalScore")}
                </span>
              </th>
              <th>Risk</th>
              <th onClick={() => handleSort("distanceKm")}>
                {isMetric ? "Distance (km)" : "Distance (mi)"}
                <span className="scorecard-sort-indicator">
                  {indicator("distanceKm")}
                </span>
              </th>
              {ruleColumns.map((rc) => (
                <th
                  key={rc.id}
                  onClick={() => handleSort(`rule_${rc.id}`)}
                  title={rc.name}
                >
                  {rc.name.length > 20
                    ? rc.name.slice(0, 18) + "…"
                    : rc.name}
                  <span className="scorecard-sort-indicator">
                    {indicator(`rule_${rc.id}`)}
                  </span>
                </th>
              ))}
              {scActive && (
                <>
                  <th onClick={() => handleSort("sc_rank")}>
                    Safety Rank
                    <span className="scorecard-info-wrap">
                      <span className="scorecard-info-icon">i</span>
                      <span className="scorecard-info-tooltip">
                        Overall safety ranking from Geotab Safety Center, combining
                        acceleration, braking, cornering, speeding, and seatbelt
                        behaviors. Scale: 0 (worst) to 100 (best).
                      </span>
                    </span>
                    <span className="scorecard-sort-indicator">
                      {indicator("sc_rank")}
                    </span>
                  </th>
                  <th onClick={() => handleSort("sc_crash")}>
                    Crash Prob.
                    <span className="scorecard-info-wrap">
                      <span className="scorecard-info-icon">i</span>
                      <span className="scorecard-info-tooltip">
                        Predicted likelihood of a crash per kilometer driven, based
                        on driving behavior patterns analyzed by Geotab Safety Center.
                      </span>
                    </span>
                    <span className="scorecard-sort-indicator">
                      {indicator("sc_crash")}
                    </span>
                  </th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {pageRows.map((row) => (
              <DriverTableRow
                key={row.driverId}
                row={row}
                ruleColumns={ruleColumns}
                isMetric={isMetric}
                onDriverClick={onDriverClick}
                scSummary={getScSummary(row.driverId)}
                scActive={!!scActive}
              />
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="scorecard-pagination">
          <button
            className="scorecard-page-btn"
            disabled={safePageIndex === 0}
            onClick={() => setPage((p) => p - 1)}
          >
            ← Prev
          </button>
          <span className="scorecard-page-info">
            Page {safePageIndex + 1} of {totalPages}
          </span>
          <button
            className="scorecard-page-btn"
            disabled={safePageIndex >= totalPages - 1}
            onClick={() => setPage((p) => p + 1)}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
