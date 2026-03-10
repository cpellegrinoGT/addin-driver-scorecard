export default function GeneralTab({ settings, onUpdate }) {
  return (
    <div>
      <div className="scorecard-settings-section">
        <h4>Entity Mode</h4>
        <p style={{ fontSize: 12, color: "#888", marginBottom: 12 }}>
          Choose whether to score by <strong>drivers</strong> (using driver
          assignments) or by <strong>assets</strong> (using devices directly).
          Click Apply after changing.
        </p>
        <div className="scorecard-entity-toggle">
          <button
            className={`scorecard-entity-btn ${
              settings.entityMode === "drivers" ? "active" : ""
            }`}
            onClick={() => onUpdate({ entityMode: "drivers" })}
          >
            Drivers
          </button>
          <button
            className={`scorecard-entity-btn ${
              settings.entityMode === "assets" ? "active" : ""
            }`}
            onClick={() => onUpdate({ entityMode: "assets" })}
          >
            Assets
          </button>
        </div>
      </div>

      <div className="scorecard-settings-section" style={{ marginTop: 24 }}>
        <h4>Predictive Collision Risk (PCR)</h4>
        <p style={{ fontSize: 12, color: "#888", marginBottom: 12 }}>
          Displays a derived collision risk index (0-100) alongside safety
          scores. Computed as: PCR = 100 - Safety Score. Higher values
          indicate greater collision risk.
        </p>
        <label className="scorecard-checkbox-label">
          <input
            type="checkbox"
            checked={settings.showPcr}
            onChange={(e) => onUpdate({ showPcr: e.target.checked })}
          />
          <span>Show PCR score and risk column</span>
        </label>
      </div>
    </div>
  );
}
