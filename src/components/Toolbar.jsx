import { useState, useRef, useEffect, useMemo } from "react";
import { getSortedGroups } from "../lib/groupUtils.js";
import { dayKey } from "../lib/dateUtils.js";

const PRESETS = [
  { id: "7days", label: "Last 7 Days" },
  { id: "30days", label: "Last 30 Days" },
  { id: "custom", label: "Custom" },
];

function getPresetDates(presetId) {
  const now = new Date();
  if (presetId === "7days") {
    const d = new Date(now);
    d.setDate(d.getDate() - 7);
    return { from: dayKey(d), to: dayKey(now) };
  }
  if (presetId === "30days") {
    const d = new Date(now);
    d.setDate(d.getDate() - 30);
    return { from: dayKey(d), to: dayKey(now) };
  }
  return null;
}

function detectPreset(fromDate, toDate) {
  for (const p of PRESETS) {
    if (p.id === "custom") continue;
    const dates = getPresetDates(p.id);
    if (dates && dates.from === fromDate && dates.to === toDate) return p.id;
  }
  return "custom";
}

export default function Toolbar({
  fromDate,
  toDate,
  allGroups,
  selectedGroupIds,
  onDateChange,
  onGroupChange,
  onApply,
  onSettingsClick,
  loading,
  settings,
}) {
  const [groupDropdownOpen, setGroupDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const activePreset = useMemo(
    () => detectPreset(fromDate, toDate),
    [fromDate, toDate]
  );

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setGroupDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const sortedGroups = getSortedGroups(allGroups);

  const weightSum = Object.values(settings.ruleWeights).reduce(
    (s, w) => s + w,
    0
  );
  const weightsValid = Math.abs(weightSum - 100) < 0.01;
  const hasRules = settings.selectedRuleIds.length > 0;
  const applyDisabled = loading || !hasRules || !weightsValid;

  function handlePreset(presetId) {
    const dates = getPresetDates(presetId);
    if (dates) {
      onDateChange(dates.from, dates.to);
    }
  }

  return (
    <div id="scorecard-toolbar">
      <div className="scorecard-toolbar-row">
        <div className="scorecard-preset-group">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              className={`scorecard-preset-btn ${
                activePreset === p.id ? "active" : ""
              }`}
              onClick={() => handlePreset(p.id)}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="scorecard-field">
          <label htmlFor="scorecard-from">From</label>
          <input
            id="scorecard-from"
            type="date"
            value={fromDate}
            onChange={(e) => onDateChange(e.target.value, toDate)}
          />
        </div>
        <div className="scorecard-field">
          <label htmlFor="scorecard-to">To</label>
          <input
            id="scorecard-to"
            type="date"
            value={toDate}
            onChange={(e) => onDateChange(fromDate, e.target.value)}
          />
        </div>

        <div className="scorecard-field" ref={dropdownRef}>
          <label>Groups</label>
          <div
            className="scorecard-multiselect-trigger"
            onClick={() => setGroupDropdownOpen(!groupDropdownOpen)}
          >
            {selectedGroupIds.length === 0
              ? "All Groups"
              : `${selectedGroupIds.length} selected`}
            <span className="scorecard-caret">▾</span>
          </div>
          {groupDropdownOpen && (
            <div className="scorecard-dropdown">
              <div
                className="scorecard-dropdown-item"
                onClick={() => {
                  onGroupChange([]);
                  setGroupDropdownOpen(false);
                }}
              >
                <span className={selectedGroupIds.length === 0 ? "scorecard-check-on" : "scorecard-check-off"}>
                  {selectedGroupIds.length === 0 ? "✓" : ""}
                </span>
                All Groups
              </div>
              {sortedGroups.map((g) => {
                const selected = selectedGroupIds.includes(g.id);
                return (
                  <div
                    key={g.id}
                    className="scorecard-dropdown-item"
                    onClick={() => {
                      if (selected) {
                        onGroupChange(
                          selectedGroupIds.filter((id) => id !== g.id)
                        );
                      } else {
                        onGroupChange([...selectedGroupIds, g.id]);
                      }
                    }}
                  >
                    <span className={selected ? "scorecard-check-on" : "scorecard-check-off"}>
                      {selected ? "✓" : ""}
                    </span>
                    {g.name}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="scorecard-toolbar-actions">
          <button
            id="scorecard-apply"
            className="scorecard-btn scorecard-btn-primary"
            disabled={applyDisabled}
            onClick={onApply}
            title={
              !hasRules
                ? "Select rules in Settings first"
                : !weightsValid
                ? `Weights sum to ${Math.round(weightSum)}% (must be 100%)`
                : ""
            }
          >
            Apply
          </button>
          <button
            className="scorecard-btn scorecard-btn-outline"
            onClick={onSettingsClick}
          >
            Settings
          </button>
        </div>
      </div>

      {!hasRules && (
        <div className="scorecard-warning-banner">
          No rules selected. Click <strong>Settings</strong> to choose rules and assign weights.
        </div>
      )}
      {hasRules && !weightsValid && (
        <div className="scorecard-warning-banner">
          Rule weights sum to <strong>{Math.round(weightSum)}%</strong> — they must total 100%.
          Adjust in <strong>Settings</strong>.
        </div>
      )}
    </div>
  );
}
