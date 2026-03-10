import { useState, useMemo } from "react";
import { MAX_RULES } from "../../lib/constants.js";
import {
  assignDefaultColors,
  distributeWeightsEqually,
} from "../../hooks/useSettings.js";

export default function RulesTab({ settings, onUpdate, allRules }) {
  const [search, setSearch] = useState("");

  // Filter to non-stock rules that have a name
  const availableRules = useMemo(() => {
    return allRules
      .filter((r) => r.name && r.id)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [allRules]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return availableRules;
    return availableRules.filter((r) =>
      r.name.toLowerCase().includes(q)
    );
  }, [availableRules, search]);

  const { selectedRuleIds, ruleWeights } = settings;
  const weightSum = selectedRuleIds.reduce(
    (s, id) => s + (ruleWeights[id] || 0),
    0
  );

  function toggleRule(ruleId) {
    let nextIds;
    if (selectedRuleIds.includes(ruleId)) {
      nextIds = selectedRuleIds.filter((id) => id !== ruleId);
    } else {
      if (selectedRuleIds.length >= MAX_RULES) return;
      nextIds = [...selectedRuleIds, ruleId];
    }
    const nextWeights = distributeWeightsEqually(nextIds);
    const nextColors = assignDefaultColors(nextIds, settings.ruleColors);
    onUpdate({
      selectedRuleIds: nextIds,
      ruleWeights: nextWeights,
      ruleColors: nextColors,
    });
  }

  function handleWeightChange(ruleId, value) {
    const num = parseInt(value, 10);
    if (isNaN(num) || num < 0) return;
    onUpdate({
      ruleWeights: { ...ruleWeights, [ruleId]: Math.min(num, 100) },
    });
  }

  function handleDistributeEqually() {
    onUpdate({
      ruleWeights: distributeWeightsEqually(selectedRuleIds),
    });
  }

  return (
    <div>
      <input
        className="scorecard-rule-search"
        placeholder="Search rules…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div
        className={`scorecard-weight-sum ${
          Math.abs(weightSum - 100) < 0.01 ? "valid" : "invalid"
        }`}
        style={{ marginBottom: 8 }}
      >
        Weight Total: {Math.round(weightSum)}%
        {selectedRuleIds.length > 0 && (
          <button
            className="scorecard-btn scorecard-btn-sm scorecard-btn-outline"
            style={{ marginLeft: 12 }}
            onClick={handleDistributeEqually}
          >
            Distribute Equally
          </button>
        )}
      </div>

      <div className="scorecard-rule-list">
        {filtered.map((rule) => {
          const selected = selectedRuleIds.includes(rule.id);
          const atLimit =
            !selected && selectedRuleIds.length >= MAX_RULES;

          return (
            <div
              key={rule.id}
              className={`scorecard-rule-item ${selected ? "selected" : ""}`}
              style={{ opacity: atLimit ? 0.5 : 1 }}
            >
              <input
                type="checkbox"
                className="scorecard-rule-checkbox"
                checked={selected}
                disabled={atLimit}
                onChange={() => toggleRule(rule.id)}
              />
              <span className="scorecard-rule-name" title={rule.name}>
                {rule.name}
              </span>
              {selected && (
                <div className="scorecard-rule-weight">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={ruleWeights[rule.id] || 0}
                    onChange={(e) =>
                      handleWeightChange(rule.id, e.target.value)
                    }
                  />
                  <span style={{ fontSize: 11, marginLeft: 2 }}>%</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {selectedRuleIds.length > 0 && (
        <div
          style={{
            marginTop: 12,
            fontSize: 12,
            color: "#888",
          }}
        >
          {selectedRuleIds.length} of {MAX_RULES} rules selected
        </div>
      )}
    </div>
  );
}
