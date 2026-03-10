import KpiTiles from "./KpiTiles.jsx";
import RiskDonut from "./RiskDonut.jsx";
import TopBottomTable from "./TopBottomTable.jsx";
import DriverTable from "./DriverTable.jsx";
import { getTopPerformers, getBottomPerformers } from "../../lib/scoring.js";

export default function OverviewPage({
  data,
  settings,
  allRules,
  allDrivers,
  allGroups,
  isMetric,
  onDriverClick,
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

  return (
    <div>
      <KpiTiles
        fleetScore={fleetScore}
        driversScored={scoredRows.length}
        highRiskCount={highRiskCount}
        totalDistance={totalDistance}
        isMetric={isMetric}
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

      <DriverTable
        driverRows={driverRows}
        settings={settings}
        ruleMap={ruleMap}
        isMetric={isMetric}
        onDriverClick={onDriverClick}
      />
    </div>
  );
}
