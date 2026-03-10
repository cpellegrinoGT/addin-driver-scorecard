import { formatNumber } from "../../lib/dateUtils.js";

export default function KpiTiles({
  fleetScore,
  driversScored,
  highRiskCount,
  totalDistance,
  isMetric,
}) {
  const distLabel = isMetric ? "km" : "mi";
  const distValue = isMetric ? totalDistance : totalDistance * 0.621371;

  return (
    <div className="scorecard-kpi-row">
      <div className="scorecard-kpi">
        <div className="scorecard-kpi-value">
          {fleetScore !== null ? fleetScore.toFixed(1) : "-"}
        </div>
        <div className="scorecard-kpi-label">Fleet Score</div>
      </div>
      <div className="scorecard-kpi">
        <div className="scorecard-kpi-value">{driversScored}</div>
        <div className="scorecard-kpi-label">Drivers Scored</div>
      </div>
      <div className="scorecard-kpi">
        <div className="scorecard-kpi-value">{highRiskCount}</div>
        <div className="scorecard-kpi-label">High Risk</div>
      </div>
      <div className="scorecard-kpi">
        <div className="scorecard-kpi-value">
          {formatNumber(Math.round(distValue))}
        </div>
        <div className="scorecard-kpi-label">Fleet Distance ({distLabel})</div>
      </div>
    </div>
  );
}
