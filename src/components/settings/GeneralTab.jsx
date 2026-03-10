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
    </div>
  );
}
