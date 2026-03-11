import { useState, useCallback, useRef } from "react";
import {
  DEFAULT_THRESHOLDS,
  RULE_PALETTE,
  SETTINGS_STORAGE_KEY,
  VIEWS_STORAGE_KEY,
} from "../lib/constants.js";
import {
  loadSettingsFromServer,
  saveSettingsToServer,
} from "../lib/addInData.js";

export const DEFAULT_SETTINGS = {
  selectedRuleIds: [],
  ruleWeights: {},
  ruleColors: {},
  thresholds: { ...DEFAULT_THRESHOLDS },
  savedViews: [],
  entityMode: "drivers", // "drivers" | "assets"
  showSafety: true,
  driveEnabled: false,
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
        entityMode: stored.entityMode || "drivers",
        showSafety: stored.showSafety !== undefined ? stored.showSafety : true,
        driveEnabled: stored.driveEnabled || false,
      };
    }
    return { ...DEFAULT_SETTINGS };
  });

  const addInDataIdRef = useRef(null);
  const settingsRef = useRef(settings);

  const updateSettings = useCallback((patch) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };

      // Persist settings (excluding savedViews which has its own key)
      const { savedViews, ...rest } = next;
      saveToStorage(SETTINGS_STORAGE_KEY, rest);
      if (patch.savedViews !== undefined) {
        saveToStorage(VIEWS_STORAGE_KEY, next.savedViews);
      }

      settingsRef.current = next;
      return next;
    });
  }, []);

  const syncFromServer = useCallback(async (api) => {
    const { id, settings: serverSettings } = await loadSettingsFromServer(api);
    if (id) addInDataIdRef.current = id;
    if (serverSettings) {
      setSettings((prev) => {
        const merged = { ...prev, ...serverSettings };
        // Restore savedViews from localStorage — they're not stored in AddInData
        merged.savedViews = prev.savedViews;
        const { savedViews, ...rest } = merged;
        saveToStorage(SETTINGS_STORAGE_KEY, rest);
        settingsRef.current = merged;
        return merged;
      });
      return true;
    }
    return false;
  }, []);

  const syncToServer = useCallback(async (api) => {
    try {
      const { savedViews, ...toSync } = settingsRef.current;
      const newId = await saveSettingsToServer(
        api,
        toSync,
        addInDataIdRef.current
      );
      if (newId) addInDataIdRef.current = newId;
    } catch (err) {
      console.warn("Failed to sync settings to server:", err);
    }
  }, []);

  return [settings, updateSettings, syncFromServer, syncToServer];
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
