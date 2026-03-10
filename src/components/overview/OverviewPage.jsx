import { useMemo } from "react";
import KpiTiles from "./KpiTiles.jsx";
import RiskDonut from "./RiskDonut.jsx";
import TopBottomTable from "./TopBottomTable.jsx";
import DriverTable from "./DriverTable.jsx";
import TrendChart from "../detail/TrendChart.jsx";
import {
  getTopPerformers,
  getBottomPerformers,
  buildFleetTrendBuckets,
} from "../../lib/scoring.js";
import { getKeyFn } from "../../lib/dateUtils.js";

export default function OverviewPage({
  data,
  settings,
  allRules,
  allDrivers,
  allGroups,
  isMetric,
  onDriverClick,
  rawData,
  trendGranularity,
  onGranularityChange,
  showPcr,
  entityLabel,
}) {
  const { driverRows, riskDistribution, dateRange } = data;

  const scoredRows = driverRows.filter((r) => r.totalScore !== null);
  const fleetScore =
    scoredRows.length > 0
      ? scoredRows.reduce((s, r) => s + r.totalScore, 0) / scoredRows.length
      : null;
  const totalDistance = driverRows.reduce((s, r) => s + r.distanceKm, 0);
  const highRiskCount = riskDistribution.high || 0;

  const top5 = getTopPerformers(driverRows, 5);
  const bottom5 = getBottomPerformers(driverRows, 5);

  const ruleMap = {};
  for (const r of allRules) ruleMap[r.id] = r;

  const fleetTrendBuckets = useMemo(() => {
    if (!rawData) return [];
    return buildFleetTrendBuckets({
      rawData,
      selectedRuleIds: settings.selectedRuleIds,
      ruleWeights: settings.ruleWeights,
      thresholds: settings.thresholds,
      keyFn: getKeyFn(trendGranularity),
    });
  }, [rawData, settings, trendGranularity]);

  return (
    <div>
      <KpiTiles
        fleetScore={fleetScore}
        driversScored={scoredRows.length}
        highRiskCount={highRiskCount}
        totalDistance={totalDistance}
        isMetric={isMetric}
        entityLabel={entityLabel}
      />

      <div className="scorecard-charts-row">
        <div className="scorecard-chart-card" style={{ flex: "0 0 280px" }}>
          <h3>Risk Distribution</h3>
          <RiskDonut distribution={riskDistribution} />
        </div>
        <div className="scorecard-top-bottom" style={{ flex: 1 }}>
          <TopBottomTable
            title="Top 5 Performers"
            rows={top5}
            onDriverClick={onDriverClick}
          />
          <TopBottomTable
            title="Bottom 5 Performers"
            rows={bottom5}
            onDriverClick={onDriverClick}
          />
        </div>
      </div>

      <div className="scorecard-chart-card" style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
          <h3 style={{ margin: 0 }}>Fleet Score Trend</h3>
          <div className="scorecard-trend-controls" style={{ marginBottom: 0 }}>
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
        </div>
        <TrendChart
          buckets={fleetTrendBuckets}
          thresholds={settings.thresholds}
          showPcr={showPcr}
        />
      </div>

      <DriverTable
        driverRows={driverRows}
        settings={settings}
        ruleMap={ruleMap}
        isMetric={isMetric}
        onDriverClick={onDriverClick}
        showPcr={showPcr}
        entityLabel={entityLabel}
      />
    </div>
  );
}
