import { RISK_LABELS, RISK_COLORS, PCR_RISK_LABELS, PCR_RISK_COLORS } from "../../lib/constants.js";
import { formatDate } from "../../lib/dateUtils.js";

export default function DetailHeader({
  driverRow,
  fromDate,
  toDate,
  isMetric,
  onBack,
  showPcr,
  entityLabel,
}) {
  const distance = isMetric
    ? driverRow.distanceKm
    : driverRow.distanceKm * 0.621371;
  const distLabel = isMetric ? "km" : "mi";

  return (
    <div className="scorecard-detail-header">
      <button className="scorecard-back-btn" onClick={onBack}>
        ← Back
      </button>
      <div>
        <div className="scorecard-detail-name">{driverRow.driverName}</div>
        <div className="scorecard-detail-period">
          {formatDate(fromDate)} — {formatDate(toDate)} | {Math.round(distance).toLocaleString()} {distLabel}
        </div>
      </div>
      <div style={{ marginLeft: "auto", textAlign: "right" }}>
        <div
          className="scorecard-detail-score"
          style={{ color: RISK_COLORS[driverRow.risk] }}
        >
          {driverRow.totalScore !== null
            ? driverRow.totalScore.toFixed(1)
            : "-"}
        </div>
        <span
          className={`scorecard-badge scorecard-badge-${driverRow.risk}`}
        >
          {RISK_LABELS[driverRow.risk]}
        </span>
        {showPcr && driverRow.pcrScore !== null && (
          <div style={{ marginTop: 6 }}>
            <span style={{ fontSize: 13, color: "#666", marginRight: 6 }}>
              PCR: {driverRow.pcrScore.toFixed(1)}
            </span>
            <span
              className={`scorecard-badge scorecard-badge-pcr-${driverRow.pcrRisk}`}
            >
              {PCR_RISK_LABELS[driverRow.pcrRisk] || "-"}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
