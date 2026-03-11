import { useRef, useEffect } from "react";
import {
  Chart,
  LineElement,
  LineController,
  PointElement,
  CategoryScale,
  LinearScale,
  Filler,
} from "chart.js";
import { RISK_COLORS, RISK_LABELS } from "../../lib/constants.js";
import InfoTooltip from "./InfoTooltip.jsx";

Chart.register(
  LineElement,
  LineController,
  PointElement,
  CategoryScale,
  LinearScale,
  Filler
);

const BEHAVIOR_RANKS = [
  { key: "harshAccelerationRank", label: "Acceleration" },
  { key: "harshBrakingRank", label: "Braking" },
  { key: "harshCorneringRank", label: "Cornering" },
  { key: "speedingRank", label: "Speeding" },
  { key: "seatbeltRank", label: "Seatbelt" },
];

function rankColor(value) {
  if (value >= 0.80) return "#28a745";
  if (value >= 0.50) return "#ffc107";
  return "#dc3545";
}

export default function DriveScorecard({
  driverName,
  totalScore,
  risk,
  safetySummary,
  trendBuckets,
  fleetRank,
  fleetTotal,
  thresholds,
  onRefresh,
  loading,
  dateRange,
  onDateRangeChange,
}) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current || !trendBuckets || trendBuckets.length === 0) return;

    if (chartRef.current) chartRef.current.destroy();

    const labels = trendBuckets.map((b) => b.key);
    const scores = trendBuckets.map((b) => b.totalScore);

    chartRef.current = new Chart(canvasRef.current, {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            data: scores,
            borderColor: "#4a90d9",
            backgroundColor: "rgba(74,144,217,0.1)",
            fill: true,
            tension: 0.3,
            pointRadius: 2,
            pointBackgroundColor: "#4a90d9",
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { enabled: false } },
        scales: {
          y: { min: 0, max: 100, display: false },
          x: { display: false },
        },
      },
    });

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, [trendBuckets]);

  const scoreColor = RISK_COLORS[risk] || RISK_COLORS.noActivity;
  const riskLabel = RISK_LABELS[risk] || "No Activity";

  // Compute trend direction from trendBuckets
  let trendArrow = null;
  if (trendBuckets && trendBuckets.length >= 2) {
    const scored = trendBuckets.filter((b) => b.totalScore != null);
    if (scored.length >= 2) {
      const mid = Math.floor(scored.length / 2);
      const firstHalf = scored.slice(0, mid);
      const secondHalf = scored.slice(mid);
      const avg = (arr) => arr.reduce((s, b) => s + b.totalScore, 0) / arr.length;
      const diff = avg(secondHalf) - avg(firstHalf);
      if (diff > 2) {
        trendArrow = { symbol: "\u2191", color: "#28a745", label: "Trending up" };
      } else if (diff < -2) {
        trendArrow = { symbol: "\u2193", color: "#dc3545", label: "Trending down" };
      } else {
        trendArrow = { symbol: "\u2014", color: "#888", label: "Stable" };
      }
    }
  }

  return (
    <div className="drive-scorecard">
      {/* Date Range Toggle */}
      {onDateRangeChange && (
        <div className="drive-date-toggle">
          <button
            className={`drive-date-btn ${dateRange === "7" ? "active" : ""}`}
            onClick={() => onDateRangeChange("7")}
            disabled={loading}
          >
            Last 7 Days
          </button>
          <button
            className={`drive-date-btn ${dateRange === "30" ? "active" : ""}`}
            onClick={() => onDateRangeChange("30")}
            disabled={loading}
          >
            Last 30 Days
          </button>
        </div>
      )}

      {/* Card 1 — Score Hero */}
      <div className="drive-card">
        <div className="drive-card-driver-name">
          {driverName}
          <InfoTooltip
            text="Your overall safety score based on weighted rule violations per distance driven. Higher is better."
            position="below"
          />
        </div>
        <div className="drive-card-score" style={{ color: scoreColor }}>
          {totalScore != null ? Math.round(totalScore) : "-"}
          {trendArrow && (
            <span
              className="drive-trend-arrow"
              style={{ color: trendArrow.color }}
              title={trendArrow.label}
            >
              {trendArrow.symbol}
            </span>
          )}
        </div>
        <span className={`scorecard-badge scorecard-badge-${risk}`}>
          {riskLabel}
        </span>
        {thresholds && (
          <div className="drive-risk-legend">
            <div className="drive-risk-legend-item">
              <span className="drive-risk-dot" style={{ background: RISK_COLORS.low }} />
              Low Risk: {thresholds.low}&ndash;100
            </div>
            <div className="drive-risk-legend-item">
              <span className="drive-risk-dot" style={{ background: RISK_COLORS.mild }} />
              Mild Risk: {thresholds.mild}&ndash;{thresholds.low - 1}
            </div>
            <div className="drive-risk-legend-item">
              <span className="drive-risk-dot" style={{ background: RISK_COLORS.medium }} />
              Medium Risk: {thresholds.medium}&ndash;{thresholds.mild - 1}
            </div>
            <div className="drive-risk-legend-item">
              <span className="drive-risk-dot" style={{ background: RISK_COLORS.high }} />
              High Risk: &lt;{thresholds.medium}
            </div>
          </div>
        )}
      </div>

      {/* Card 2 — Behavior Ranks */}
      {safetySummary && (
        <div className="drive-card">
          <div className="drive-card-title">
            Behavior Ranks
            <InfoTooltip
              text="How you rank across key driving behaviors based on Safety Center data. Higher percentages indicate safer driving."
              position="below"
            />
          </div>
          {BEHAVIOR_RANKS.map((br) => {
            const val = safetySummary[br.key];
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
        </div>
      )}

      {/* Card 3 — Score Trend */}
      {trendBuckets && trendBuckets.length > 0 && (
        <div className="drive-card">
          <div className="drive-card-title">
            Score Trend (Last {dateRange || "7"} Days)
            <InfoTooltip
              text="Your daily safety score over the selected period, showing how your driving performance changes over time."
              position="below"
            />
          </div>
          <div style={{ height: 100 }}>
            <canvas ref={canvasRef} />
          </div>
        </div>
      )}

      {/* Card 4 — Fleet Ranking */}
      {fleetRank != null && fleetTotal != null && (
        <div className="drive-card">
          <div className="drive-card-title">
            Fleet Ranking
            <InfoTooltip
              text="Where you stand among all scored drivers in your fleet."
              position="below"
            />
          </div>
          <div className="drive-fleet-rank">
            You rank <strong>#{fleetRank}</strong> out of{" "}
            <strong>{fleetTotal}</strong> drivers
          </div>
          {fleetTotal > 0 && (
            <div className="drive-fleet-percentile">
              Top {Math.max(1, Math.round((fleetRank / fleetTotal) * 100))}%
            </div>
          )}
        </div>
      )}

      {/* Card 5 — Crash Probability */}
      {safetySummary && safetySummary.crashProbabilityKm != null && (
        <div className="drive-card">
          <div className="drive-card-title">
            Crash Probability
            <InfoTooltip
              text="Your predicted crash risk based on driving patterns, compared to fleet benchmark and best-in-class drivers."
              position="above"
            />
          </div>
          <div className="drive-crash-grid">
            <div className="drive-crash-stat">
              <div className="drive-crash-value">
                {(safetySummary.crashProbabilityKm * 100).toFixed(1)}%
              </div>
              <div className="drive-crash-label">Your Risk</div>
            </div>
            {safetySummary.crashProbabilityBenchmarkKm != null && (
              <div className="drive-crash-stat">
                <div className="drive-crash-value" style={{ color: "#888" }}>
                  {(safetySummary.crashProbabilityBenchmarkKm * 100).toFixed(1)}%
                </div>
                <div className="drive-crash-label">Benchmark</div>
              </div>
            )}
            {safetySummary.crashProbabilityBestInClassKm != null && (
              <div className="drive-crash-stat">
                <div className="drive-crash-value" style={{ color: "#28a745" }}>
                  {(safetySummary.crashProbabilityBestInClassKm * 100).toFixed(1)}%
                </div>
                <div className="drive-crash-label">Best in Class</div>
              </div>
            )}
          </div>
          {safetySummary.predictedCrashes != null && (
            <div className="drive-crash-predicted">
              {safetySummary.predictedCrashes.toFixed(1)} predicted crashes per
              1M km
            </div>
          )}
        </div>
      )}

      {/* Refresh button */}
      <button
        className="scorecard-btn scorecard-btn-primary drive-refresh-btn"
        onClick={onRefresh}
        disabled={loading}
      >
        {loading ? "Loading..." : "Refresh"}
      </button>
    </div>
  );
}
