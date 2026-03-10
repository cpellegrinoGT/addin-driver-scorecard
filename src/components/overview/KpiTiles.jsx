import { formatNumber } from "../../lib/dateUtils.js";

export default function KpiTiles({
  fleetScore,
  driversScored,
  highRiskCount,
  totalDistance,
  isMetric,
  entityLabel,
  showSafety,
  fleetCrashProbability,
}) {
  const distLabel = isMetric ? "km" : "mi";
  const distValue = isMetric ? totalDistance : totalDistance * 0.621371;

  return (
    <div className="scorecard-kpi-row">
      <div className="scorecard-kpi">
        <div className="scorecard-kpi-value">
          {fleetScore !== null ? fleetScore.toFixed(1) : "-"}
          <span className="scorecard-info-wrap">
            <span className="scorecard-info-icon">i</span>
            <span className="scorecard-info-tooltip">
              <strong>How scores are calculated</strong>
              <br /><br />
              <strong>Per-rule score:</strong>
              <br />
              MAX(100 &minus; (events &times; 1000 &divide; distance in km), 0)
              <br /><br />
              <strong>Total score:</strong>
              <br />
              Weighted average of all rule scores. Rules where a driver has no
              activity are excluded and weights are renormalized.
              <br /><br />
              <strong>Risk tiers (default):</strong>
              <br />
              Low &ge; 95 &nbsp;|&nbsp; Mild &ge; 75 &nbsp;|&nbsp; Medium &ge; 60 &nbsp;|&nbsp; High &lt; 60
              <br /><br />
              Thresholds and weights are configurable in Settings.
            </span>
          </span>
        </div>
        <div className="scorecard-kpi-label">Fleet Score</div>
      </div>
      <div className="scorecard-kpi">
        <div className="scorecard-kpi-value">{driversScored}</div>
        <div className="scorecard-kpi-label">{entityLabel === "Asset" ? "Assets" : "Drivers"} Scored</div>
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
      {showSafety && fleetCrashProbability != null && (
        <div className="scorecard-kpi">
          <div className="scorecard-kpi-value">
            {Math.round(fleetCrashProbability).toLocaleString()}
            <span className="scorecard-info-wrap">
              <span className="scorecard-info-icon">i</span>
              <span className="scorecard-info-tooltip">
                <strong>Predictive Collision Risk</strong>
                <br /><br />
                Average crash probability across enrolled{" "}
                {entityLabel === "Asset" ? "assets" : "drivers"}, sourced from
                Geotab Safety Center. Data has a 2-3 day lag.
              </span>
            </span>
          </div>
          <div className="scorecard-kpi-label">
            Fleet Crash Prob. ({isMetric ? "km" : "mi"})
          </div>
        </div>
      )}
    </div>
  );
}
