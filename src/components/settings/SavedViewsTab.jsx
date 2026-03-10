import { useState } from "react";

export default function SavedViewsTab({ settings, onUpdate }) {
  const [viewName, setViewName] = useState("");

  function handleSave() {
    const name = viewName.trim();
    if (!name) return;

    const snapshot = {
      name,
      timestamp: new Date().toISOString(),
      selectedRuleIds: [...settings.selectedRuleIds],
      ruleWeights: { ...settings.ruleWeights },
      ruleColors: { ...settings.ruleColors },
      thresholds: { ...settings.thresholds },
    };

    const existing = settings.savedViews || [];
    // Replace if same name exists
    const filtered = existing.filter((v) => v.name !== name);
    onUpdate({ savedViews: [...filtered, snapshot] });
    setViewName("");
  }

  function handleLoad(view) {
    onUpdate({
      selectedRuleIds: view.selectedRuleIds,
      ruleWeights: view.ruleWeights,
      ruleColors: view.ruleColors,
      thresholds: view.thresholds,
    });
  }

  function handleDelete(viewName) {
    const filtered = (settings.savedViews || []).filter(
      (v) => v.name !== viewName
    );
    onUpdate({ savedViews: filtered });
  }

  const views = settings.savedViews || [];

  return (
    <div>
      <p style={{ fontSize: 13, color: "#666", marginTop: 0 }}>
        Save your current rule selection, weights, colors, and thresholds as a
        named view for quick recall.
      </p>

      <div className="scorecard-save-view-form">
        <input
          type="text"
          placeholder="View name"
          value={viewName}
          onChange={(e) => setViewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSave()}
        />
        <button
          className="scorecard-btn scorecard-btn-primary scorecard-btn-sm"
          onClick={handleSave}
          disabled={!viewName.trim()}
        >
          Save
        </button>
      </div>

      {views.length === 0 ? (
        <p style={{ fontSize: 13, color: "#888" }}>No saved views yet.</p>
      ) : (
        views.map((view) => (
          <div key={view.name} className="scorecard-saved-view-item">
            <span className="scorecard-saved-view-name">{view.name}</span>
            <span className="scorecard-saved-view-meta">
              {view.selectedRuleIds.length} rules
            </span>
            <button
              className="scorecard-btn scorecard-btn-sm scorecard-btn-outline"
              onClick={() => handleLoad(view)}
            >
              Load
            </button>
            <button
              className="scorecard-btn scorecard-btn-sm scorecard-btn-danger"
              onClick={() => handleDelete(view.name)}
            >
              Delete
            </button>
          </div>
        ))
      )}
    </div>
  );
}
