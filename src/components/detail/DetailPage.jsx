import DetailHeader from "./DetailHeader.jsx";
import ScoreGauge from "./ScoreGauge.jsx";
import RuleBreakdownChart from "./RuleBreakdownChart.jsx";
import TrendChart from "./TrendChart.jsx";
import { buildTrendBuckets } from "../../lib/scoring.js";
import { getKeyFn } from "../../lib/dateUtils.js";
import { useMemo } from "react";

export default function DetailPage({
  data,
  driverId,
  settings,
  allRules,
  allDrivers,
  isMetric,
  trendGranularity,
  onGranularityChange,
  onBack,
  rawData,
  fromDate,
  toDate,
}) {
  const driverRow = data.driverRows.find((r) => r.driverId === driverId);
  if (!driverRow) {
    return (
      <div>
        <button className="scorecard-back-btn" onClick={onBack}>
          ← Back to Overview
        </button>
        <p style={{ color: "#888", padding: 20 }}>Driver not found.</p>
      </div>
    );
  }

  const driverMap = {};
  for (const d of allDrivers) driverMap[d.id] = d;

  const ruleMap = {};
  for (const r of allRules) ruleMap[r.id] = r;

  const ruleColumns = settings.selectedRuleIds.map((id) => ({
    id,
    name: ruleMap[id]?.name || id,
    color: settings.ruleColors[id] || "#4a90d9",
  }));

  const trendBuckets = useMemo(() => {
    if (!rawData) return [];
    const driverTrips = rawData.driverTrips[driverId] || [];
    const driverEvents = rawData.driverEventMap[driverId] || {};
    return buildTrendBuckets({
      driverId,
      driverEvents,
      driverTrips,
      selectedRuleIds: settings.selectedRuleIds,
      ruleWeights: settings.ruleWeights,
      thresholds: settings.thresholds,
      keyFn: getKeyFn(trendGranularity),
    });
  }, [driverId, rawData, settings, trendGranularity]);

  return (
    <div>
      <DetailHeader
        driverRow={driverRow}
        fromDate={fromDate}
        toDate={toDate}
        isMetric={isMetric}
        onBack={onBack}
      />

      <div className="scorecard-detail-grid">
        <div className="scorecard-gauge-wrap">
          <ScoreGauge
            score={driverRow.totalScore}
            risk={driverRow.risk}
          />
        </div>

        <div className="scorecard-detail-charts">
          <div className="scorecard-chart-card">
            <h3>Rule Breakdown</h3>
            <RuleBreakdownChart
              ruleScores={driverRow.ruleScores}
              eventCounts={driverRow.eventCounts}
              ruleColumns={ruleColumns}
            />
          </div>

          <div className="scorecard-chart-card">
            <h3>Score Trend</h3>
            <div className="scorecard-trend-controls">
              {["day", "week", "month"].map((g) => (
                <button
                  key={g}
                  className={`scorecard-trend-btn ${
                    trendGranularity === g ? "active" : ""
                  }`}
                  onClick={() => onGranularityChange(g)}
                >
                  {g.charAt(0).toUpperCase() + g.slice(1)}
                </button>
              ))}
            </div>
            <TrendChart
              buckets={trendBuckets}
              thresholds={settings.thresholds}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
