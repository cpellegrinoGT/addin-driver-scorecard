import { apiCall } from "../hooks/useGeotabApi.js";
import { ADDIN_DATA_ID } from "./constants.js";

/**
 * Load settings from AddInData on the server.
 * Returns { id, settings } or { id: null, settings: null }.
 */
export async function loadSettingsFromServer(api) {
  try {
    console.log("[AddInData] Attempting Get with search:", { addInId: ADDIN_DATA_ID });
    let results;
    try {
      results = await apiCall(api, "Get", {
        typeName: "AddInData",
        search: { addInId: ADDIN_DATA_ID },
      });
    } catch (searchErr) {
      // addInId search may fail on some server versions — fall back to unfiltered Get
      console.warn("[AddInData] Search by addInId failed, trying unfiltered Get:", searchErr.message);
      const all = await apiCall(api, "Get", { typeName: "AddInData" });
      results = (all || []).filter((r) => r.addInId === ADDIN_DATA_ID);
    }

    console.log("[AddInData] Get results:", results?.length ?? 0, "records");
    if (results && results.length > 0) {
      const record = results[0];
      console.log("[AddInData] Record id:", record.id, "groups:", record.groups);
      const settings = record.data ? JSON.parse(record.data) : null;
      return { id: record.id, settings };
    }
  } catch (err) {
    console.warn("[AddInData] Failed to load:", err);
  }
  return { id: null, settings: null };
}

/**
 * Save settings to AddInData on the server.
 * Always Remove + Add to ensure groups are updated (Set does not update groups).
 * Uses GroupCompanyId (org root) so any user on the database can read the record.
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
    data: JSON.stringify(settings),
  };
  console.log("[AddInData] Adding record (no groups):");
  const newId = await apiCall(api, "Add", {
    typeName: "AddInData",
    entity,
  });
  console.log("[AddInData] Created record:", newId);
  return newId;
}
