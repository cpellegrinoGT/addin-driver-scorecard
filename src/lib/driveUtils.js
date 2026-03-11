/**
 * Detect whether the addin is running inside Geotab Drive.
 * The flag is set by shell.js based on which addin name was called:
 * driverScorecard (MyGeotab) vs driverScorecardDriveAppLink (Drive).
 */
export function isDriveContext() {
  return !!window.__scorecardDriveMode;
}
