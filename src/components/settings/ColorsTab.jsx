export default function ColorsTab({ settings, onUpdate, allRules }) {
  const ruleMap = {};
  for (const r of allRules) ruleMap[r.id] = r;

  function handleColorChange(ruleId, color) {
    onUpdate({
      ruleColors: { ...settings.ruleColors, [ruleId]: color },
    });
  }

  if (settings.selectedRuleIds.length === 0) {
    return (
      <p style={{ fontSize: 13, color: "#888" }}>
        No rules selected. Select rules in the Rules tab first.
      </p>
    );
  }

  return (
    <div>
      <p style={{ fontSize: 13, color: "#666", marginTop: 0 }}>
        Customize the color used for each rule in charts and tables.
      </p>

      {settings.selectedRuleIds.map((ruleId) => (
        <div key={ruleId} className="scorecard-color-row">
          <input
            type="color"
            className="scorecard-color-input"
            value={settings.ruleColors[ruleId] || "#4a90d9"}
            onChange={(e) => handleColorChange(ruleId, e.target.value)}
          />
          <span className="scorecard-color-name">
            {ruleMap[ruleId]?.name || ruleId}
          </span>
        </div>
      ))}
    </div>
  );
}
