import { RISK_COLORS, RISK_LABELS } from "../../lib/constants.js";

export default function ThresholdsTab({ settings, onUpdate }) {
  const { thresholds } = settings;

  function handleChange(key, value) {
    const num = parseInt(value, 10);
    if (isNaN(num) || num < 0 || num > 100) return;
    onUpdate({
      thresholds: { ...thresholds, [key]: num },
    });
  }

  const orderingError =
    thresholds.low <= thresholds.mild
      ? "Low Risk threshold must be greater than Mild Risk threshold."
      : thresholds.mild <= thresholds.medium
        ? "Mild Risk threshold must be greater than Medium Risk threshold."
        : null;

  return (
    <div>
      <p style={{ fontSize: 13, color: "#666", marginTop: 0 }}>
        Configure the score thresholds for each risk tier. Scores at or above
        the threshold are classified into that tier.
      </p>

      <div className="scorecard-threshold-row">
        <span
          className="scorecard-threshold-label"
          style={{ color: RISK_COLORS.low }}
        >
          {RISK_LABELS.low}
        </span>
        <input
          className="scorecard-threshold-input"
          type="number"
          min="0"
          max="100"
          value={thresholds.low}
          onChange={(e) => handleChange("low", e.target.value)}
        />
        <span className="scorecard-threshold-desc">
          Score ≥ {thresholds.low}
        </span>
      </div>

      <div className="scorecard-threshold-row">
        <span
          className="scorecard-threshold-label"
          style={{ color: RISK_COLORS.mild }}
        >
          {RISK_LABELS.mild}
        </span>
        <input
          className="scorecard-threshold-input"
          type="number"
          min="0"
          max="100"
          value={thresholds.mild}
          onChange={(e) => handleChange("mild", e.target.value)}
        />
        <span className="scorecard-threshold-desc">
          {thresholds.mild} ≤ Score &lt; {thresholds.low}
        </span>
      </div>

      <div className="scorecard-threshold-row">
        <span
          className="scorecard-threshold-label"
          style={{ color: RISK_COLORS.medium }}
        >
          {RISK_LABELS.medium}
        </span>
        <input
          className="scorecard-threshold-input"
          type="number"
          min="0"
          max="100"
          value={thresholds.medium}
          onChange={(e) => handleChange("medium", e.target.value)}
        />
        <span className="scorecard-threshold-desc">
          {thresholds.medium} ≤ Score &lt; {thresholds.mild}
        </span>
      </div>

      <div className="scorecard-threshold-row">
        <span
          className="scorecard-threshold-label"
          style={{ color: RISK_COLORS.high }}
        >
          {RISK_LABELS.high}
        </span>
        <span style={{ fontSize: 13, color: "#666" }}>
          Score &lt; {thresholds.medium}
        </span>
      </div>

      {orderingError && (
        <p style={{ color: "#dc3545", fontSize: 13, marginTop: 4 }}>
          {orderingError}
        </p>
      )}
    </div>
  );
}
