/**
 * Detect whether the addin is running inside Geotab Drive.
 */
export function isDriveContext(api) {
  return !!(api?.mobile?.exists?.());
}

/**
 * Get the currently logged-in driver from the Drive mobile API.
 * Returns the first driver object or null.
 */
export function getDriveCurrentDriver(api) {
  return new Promise((resolve) => {
    try {
      api.mobile.user.get((drivers) => {
        resolve(drivers && drivers.length > 0 ? drivers[0] : null);
      });
    } catch {
      resolve(null);
    }
  });
}
