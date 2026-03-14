import { apiCall } from "../hooks/useGeotabApi.js";
import { ADDIN_DATA_ID } from "./constants.js";

/**
 * Load settings from AddInData on the server.
 * Returns { id, settings } or { id: null, settings: null }.
 */
export async function loadSettingsFromServer(api) {
  try {
    console.log("[AddInData] Attempting Get with search:", { addInId: ADDIN_DATA_ID });
    const results = await apiCall(api, "Get", {
      typeName: "AddInData",
      search: { addInId: ADDIN_DATA_ID },
    });

    console.log("[AddInData] Get results:", results?.length ?? 0, "records");
    if (results && results.length > 0) {
      const record = results[0];
      console.log("[AddInData] Record id:", record.id, "groups:", record.groups);
      const settings = record.details ?? null;
      return { id: record.id, settings };
    }
  } catch (err) {
    console.warn("[AddInData] Failed to load:", err);
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
    console.log("[AddInData] Removing old record:", existingId);
    await apiCall(api, "Remove", {
      typeName: "AddInData",
      entity: { id: existingId },
    });
  }

  const entity = {
    addInId: ADDIN_DATA_ID,
    details: settings,
  };
  console.log("[AddInData] Adding record (no groups, using details)");
  const newId = await apiCall(api, "Add", {
    typeName: "AddInData",
    entity,
  });
  console.log("[AddInData] Created record:", newId);
  return newId;
}
