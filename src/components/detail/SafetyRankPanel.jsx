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
            {crashProb != null ? (crashProb * 100000).toFixed(2) : "-"}
          </div>
          <div className="sc-crash-label">
            Crash Prob. (per 100K {unit})
          </div>
        </div>
        <div className="sc-crash-cell">
          <div className="sc-crash-value sc-crash-benchmark">~3.00</div>
          <div className="sc-crash-label">Benchmark (50th pct)</div>
        </div>
        <div className="sc-crash-cell">
          <div className="sc-crash-value sc-crash-best">~1.50</div>
          <div className="sc-crash-label">Best-in-Class (80th pct)</div>
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

      <div style={{ display: "flex", gap: 16, marginTop: 12, fontSize: 13 }}>
        <span>
          Collisions:{" "}
          <strong>{summary.collisionCount ?? 0}</strong>
        </span>
        {summary.areaRiskClassification && (
          <span>
            Area Risk:{" "}
            <span className="scorecard-badge scorecard-badge-mild">
              {summary.areaRiskClassification}
            </span>
          </span>
        )}
      </div>
    </div>
  );
}
