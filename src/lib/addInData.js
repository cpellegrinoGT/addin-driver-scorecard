import { apiCall } from "../hooks/useGeotabApi.js";
import { ADDIN_DATA_ID } from "./constants.js";

/**
 * Load settings from AddInData on the server.
 * Returns { id, settings } or { id: null, settings: null }.
 */
export async function loadSettingsFromServer(api) {
  try {
    const results = await apiCall(api, "Get", {
      typeName: "AddInData",
      search: { addInId: ADDIN_DATA_ID },
    });

    if (results && results.length > 0) {
      const record = results[0];
      const settings = record.details ?? null;
      return { id: record.id, settings };
    }
  } catch (err) {
    console.warn("Failed to load AddInData settings:", err);
  }
  return { id: null, settings: null };
}

/**
 * Save settings to AddInData on the server.
 * Always Remove + Add to ensure a clean record.
 * Groups omitted so any authenticated user on the database can read it.
 * Uses `details` (not legacy `data`) for the settings payload.
 * Returns the new record id.
 */
export async function saveSettingsToServer(api, settings, existingId) {
  if (existingId) {
    await apiCall(api, "Remove", {
      typeName: "AddInData",
      entity: { id: existingId },
    });
  }

  const newId = await apiCall(api, "Add", {
    typeName: "AddInData",
    entity: {
      addInId: ADDIN_DATA_ID,
      details: settings,
    },
  });
  return newId;
}
