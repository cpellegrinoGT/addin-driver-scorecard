export default function GeneralTab({ settings, onUpdate, safetyCenterAvailable }) {
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
        <h4>Safety Center</h4>
        {safetyCenterAvailable ? (
          <>
            <p style={{ fontSize: 12, color: "#888", marginBottom: 12 }}>
              Show or hide Predictive Collision Risk data from Safety Center.
            </p>
            <div className="scorecard-entity-toggle">
              <button
                className={`scorecard-entity-btn ${
                  settings.showSafety ? "active" : ""
                }`}
                onClick={() => onUpdate({ showSafety: true })}
              >
                Show
              </button>
              <button
                className={`scorecard-entity-btn ${
                  !settings.showSafety ? "active" : ""
                }`}
                onClick={() => onUpdate({ showSafety: false })}
              >
                Hide
              </button>
            </div>
          </>
        ) : (
          <p style={{ fontSize: 12, color: "#aaa" }}>
            Safety Center is not available for this database.
          </p>
        )}
      </div>
    </div>
  );
}
