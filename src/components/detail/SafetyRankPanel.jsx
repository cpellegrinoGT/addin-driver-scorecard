const BEHAVIOR_RANKS = [
  { key: "harshAccelerationRank", label: "Harsh Acceleration" },
  { key: "harshBrakingRank", label: "Harsh Braking" },
  { key: "harshCorneringRank", label: "Harsh Cornering" },
  { key: "speedingRank", label: "Speeding" },
  { key: "seatbeltRank", label: "Seatbelt" },
];

function rankColor(value) {
  if (value >= 0.80) return "#28a745";
  if (value >= 0.50) return "#ffc107";
  return "#dc3545";
}

export default function SafetyRankPanel({ summary, isMetric }) {
  if (!summary) {
    return (
      <div className="scorecard-chart-card">
        <h3>Safety Center — Predictive Collision Risk</h3>
        <p style={{ color: "#aaa", fontSize: 13 }}>
          No Safety Center data available.
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
            {crashProb != null ? (crashProb * 100).toFixed(1) + "%" : "-"}
          </div>
          <div className="sc-crash-label">Crash Probability</div>
          {summary.crashProbabilityBenchmarkKm != null && (
            <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>
              Benchmark: {(summary.crashProbabilityBenchmarkKm * 100).toFixed(1)}%
              {summary.crashProbabilityBestInClassKm != null && (
                <> · Best: {(summary.crashProbabilityBestInClassKm * 100).toFixed(1)}%</>
              )}
            </div>
          )}
        </div>
        <div className="sc-crash-cell">
          <div className="sc-crash-value">
            {summary.overallSafetyRank != null
              ? (summary.overallSafetyRank * 100).toFixed(0)
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
        {summary.predictedCrashes != null && (
          <div className="sc-crash-cell">
            <div className="sc-crash-value">
              {summary.predictedCrashes.toFixed(1)}
            </div>
            <div className="sc-crash-label">Predicted Crashes (per 1M km)</div>
          </div>
        )}
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
                  width: val != null ? `${val * 100}%` : "0%",
                  background: val != null ? rankColor(val) : "#e0e0e0",
                }}
              />
            </div>
            <span className="sc-rank-value">
              {val != null ? (val * 100).toFixed(0) : "-"}
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
