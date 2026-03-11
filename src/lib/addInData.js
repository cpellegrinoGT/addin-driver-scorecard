import { apiCall } from "../hooks/useGeotabApi.js";
import { ADDIN_DATA_ID } from "./constants.js";
import { getSortedGroups } from "./groupUtils.js";

const COMPANY_GROUP = { id: "GroupCompanyId" };

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

    console.log("[AddInData] loadSettingsFromServer results:", results?.length ?? 0, results?.[0]?.groups);

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
 * Tags the record with all org groups so users at any scope level can read it.
 * Returns the record id.
 */
export async function saveSettingsToServer(api, settings, existingId, allGroups) {
  const broadcastGroups = [
    COMPANY_GROUP,
    ...getSortedGroups(allGroups || []).map((g) => ({ id: g.id })),
  ];

  console.log("[AddInData] saveSettingsToServer — existingId:", existingId, "broadcastGroups:", broadcastGroups.length);

  // Remove the old record first so we can re-create with updated groups.
  // Set may not update the groups field on an existing AddInData record.
  if (existingId) {
    try {
      await apiCall(api, "Remove", { typeName: "AddInData", entity: { id: existingId } });
    } catch (err) {
      console.warn("[AddInData] Remove failed (may not exist):", err);
    }
  }

  const entity = {
    addInId: ADDIN_DATA_ID,
    data: JSON.stringify(settings),
    groups: broadcastGroups,
  };

  const newId = await apiCall(api, "Add", { typeName: "AddInData", entity });
  console.log("[AddInData] Added new record:", newId);
  return newId;
}
