const BEHAVIOR_RANKS = [
  { key: "harshAccelerationRank", label: "Harsh Acceleration" },
  { key: "harshBrakingRank", label: "Harsh Braking" },
  { key: "harshCorneringRank", label: "Harsh Cornering" },
  { key: "speedingRank", label: "Speeding" },
  { key: "seatbeltRank", label: "Seatbelt" },
];

function rankColor(value) {
  if (value >= 80) return "#28a745";
  if (value >= 50) return "#ffc107";
  return "#dc3545";
}

export default function SafetyRankPanel({ summary, isMetric }) {
  if (!summary || !summary.isEnrolled) {
    return (
      <div className="scorecard-chart-card">
        <h3>Safety Center — Predictive Collision Risk</h3>
        <p style={{ color: "#aaa", fontSize: 13 }}>
          {summary
            ? "This driver is not enrolled in Safety Center."
            : "No Safety Center data available."}
        </p>
      </div>
    );
  }

  const crashProb = isMetric
    ? summary.crashProbabilityKm
    : summary.crashProbabilityMile;
  const unit = isMetric ? "km" : "mi";

  return (
    <div className="scorecard-chart-card">
      <h3>Safety Center — Predictive Collision Risk</h3>

      <div className="sc-crash-grid">
        <div className="sc-crash-cell">
          <div className="sc-crash-value">
            {crashProb != null ? crashProb.toFixed(4) : "-"}
          </div>
          <div className="sc-crash-label">
            Crash Probability ({unit})
          </div>
        </div>
        <div className="sc-crash-cell">
          <div className="sc-crash-value">
            {summary.overallSafetyRank != null
              ? summary.overallSafetyRank.toFixed(0)
              : "-"}
          </div>
          <div className="sc-crash-label">Safety Rank (percentile)</div>
        </div>
        <div className="sc-crash-cell">
          <div className="sc-crash-value">
            {summary.collisionCount ?? 0}
          </div>
          <div className="sc-crash-label">Collisions</div>
        </div>
      </div>

      <h4 style={{ fontSize: 13, fontWeight: 600, margin: "16px 0 8px" }}>
        Behavior Ranks
      </h4>
      {BEHAVIOR_RANKS.map((br) => {
        const val = summary[br.key];
        return (
          <div key={br.key} className="sc-rank-row">
            <span className="sc-rank-label">{br.label}</span>
            <div className="sc-rank-bar">
              <div
                className="sc-rank-fill"
                style={{
                  width: val != null ? `${val}%` : "0%",
                  background: val != null ? rankColor(val) : "#e0e0e0",
                }}
              />
            </div>
            <span className="sc-rank-value">
              {val != null ? val.toFixed(0) : "-"}
            </span>
          </div>
        );
      })}

      {summary.areaRiskClassification && (
        <div style={{ marginTop: 12, fontSize: 13 }}>
          Area Risk:{" "}
          <span className="scorecard-badge scorecard-badge-mild">
            {summary.areaRiskClassification}
          </span>
        </div>
      )}
    </div>
  );
}
