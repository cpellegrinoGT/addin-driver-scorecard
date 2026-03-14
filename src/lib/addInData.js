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
 * Always Remove + Add to ensure groups are updated (Set does not update groups).
 * Uses security clearance groups so any user can read the record.
 * Returns the new record id.
 */
const ALL_CLEARANCES = [
  { id: "GroupEverythingSecurityId" },
  { id: "GroupSupervisorSecurityId" },
  { id: "GroupUserSecurityId" },
  { id: "GroupViewOnlySecurityId" },
  { id: "GroupDriveUserSecurityId" },
];

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
      data: JSON.stringify(settings),
      groups: ALL_CLEARANCES,
    },
  });
  return newId;
}
