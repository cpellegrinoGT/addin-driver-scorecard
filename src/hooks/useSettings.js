import { useState, useCallback } from "react";
import {
  DEFAULT_THRESHOLDS,
  RULE_PALETTE,
  SETTINGS_STORAGE_KEY,
  VIEWS_STORAGE_KEY,
} from "../lib/constants.js";

export const DEFAULT_SETTINGS = {
  selectedRuleIds: [],
  ruleWeights: {},
  ruleColors: {},
  thresholds: { ...DEFAULT_THRESHOLDS },
  savedViews: [],
  showPcr: false,
  entityMode: "drivers", // "drivers" | "assets"
};

function loadFromStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveToStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // localStorage full or unavailable
  }
}

export function useSettings() {
  const [settings, setSettings] = useState(() => {
    const stored = loadFromStorage(SETTINGS_STORAGE_KEY, null);
    if (stored) {
      return {
        selectedRuleIds: stored.selectedRuleIds || [],
        ruleWeights: stored.ruleWeights || {},
        ruleColors: stored.ruleColors || {},
        thresholds: stored.thresholds || { ...DEFAULT_THRESHOLDS },
        savedViews: loadFromStorage(VIEWS_STORAGE_KEY, []),
        showPcr: stored.showPcr !== undefined ? stored.showPcr : false,
        entityMode: stored.entityMode || "drivers",
      };
    }
    return { ...DEFAULT_SETTINGS };
  });

  const updateSettings = useCallback((patch) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };

      // Persist settings (excluding savedViews which has its own key)
      const { savedViews, ...rest } = next;
      saveToStorage(SETTINGS_STORAGE_KEY, rest);
      if (patch.savedViews !== undefined) {
        saveToStorage(VIEWS_STORAGE_KEY, next.savedViews);
      }

      return next;
    });
  }, []);

  return [settings, updateSettings];
}

export function assignDefaultColors(ruleIds, existingColors) {
  const colors = { ...existingColors };
  ruleIds.forEach((id, i) => {
    if (!colors[id]) {
      colors[id] = RULE_PALETTE[i % RULE_PALETTE.length];
    }
  });
  return colors;
}

export function distributeWeightsEqually(ruleIds) {
  const n = ruleIds.length;
  if (n === 0) return {};
  const base = Math.floor(100 / n);
  const remainder = 100 - base * n;
  const weights = {};
  ruleIds.forEach((id, i) => {
    weights[id] = base + (i < remainder ? 1 : 0);
  });
  return weights;
}
