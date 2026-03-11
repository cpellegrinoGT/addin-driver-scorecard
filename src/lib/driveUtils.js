/**
 * Detect whether the addin is running inside Geotab Drive.
 * In Drive, pageState includes a `device` property for the current vehicle.
 */
export function isDriveContext(pageState) {
  return !!(pageState?.device);
}
