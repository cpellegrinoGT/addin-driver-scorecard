import { useState, useRef, useEffect } from "react";
import { getSortedGroups } from "../lib/groupUtils.js";

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

  const groupMap = {};
  for (const g of allGroups) groupMap[g.id] = g;

  return (
    <div id="scorecard-toolbar">
      <div className="scorecard-toolbar-row">
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
