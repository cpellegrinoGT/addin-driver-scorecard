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
      const settings = record.data ? JSON.parse(record.data) : null;
      return { id: record.id, settings };
    }
  } catch (err) {
    console.warn("Failed to load AddInData settings:", err);
  }
  return { id: null, settings: null };
}

/**
 * Save settings to AddInData on the server.
 * Uses "Set" if existingId is provided, otherwise "Add".
 * Returns the record id.
 */
export async function saveSettingsToServer(api, settings, existingId) {
  const entity = {
    addInId: ADDIN_DATA_ID,
    data: JSON.stringify(settings),
  };

  if (existingId) {
    entity.id = existingId;
    await apiCall(api, "Set", { typeName: "AddInData", entity });
    return existingId;
  }

  const newId = await apiCall(api, "Add", { typeName: "AddInData", entity });
  return newId;
}
