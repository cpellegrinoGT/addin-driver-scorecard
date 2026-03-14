import { useState, useCallback, useRef } from "react";
import {
  DEFAULT_THRESHOLDS,
  RULE_PALETTE,
  SETTINGS_STORAGE_KEY,
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
        ...DEFAULT_SETTINGS,
        ...stored,
      };
    }
    return { ...DEFAULT_SETTINGS };
  });

  const addInDataIdRef = useRef(null);
  const settingsRef = useRef(settings);

  const updateSettings = useCallback((patch) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };

      saveToStorage(SETTINGS_STORAGE_KEY, next);

      settingsRef.current = next;
      return next;
    });
  }, []);

  const syncFromServer = useCallback(async (api, { ignoreLocal = false } = {}) => {
    const { id, settings: serverSettings } = await loadSettingsFromServer(api);
    if (id) addInDataIdRef.current = id;
    if (serverSettings) {
      setSettings((prev) => {
        if (ignoreLocal) {
          // Non-admin: server is sole source of truth, skip localStorage
          const next = { ...DEFAULT_SETTINGS, ...serverSettings };
          settingsRef.current = next;
          return next;
        }
        // Admin: merge server into local state, persist to localStorage
        const merged = { ...prev, ...serverSettings };
        saveToStorage(SETTINGS_STORAGE_KEY, merged);
        settingsRef.current = merged;
        return merged;
      });
      return true;
    }
    if (ignoreLocal) {
      // Non-admin with no server record: use defaults
      setSettings(() => {
        const next = { ...DEFAULT_SETTINGS };
        settingsRef.current = next;
        return next;
      });
    }
    return false;
  }, []);

  const syncToServer = useCallback(async (api) => {
    try {
      const newId = await saveSettingsToServer(
        api,
        settingsRef.current,
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
