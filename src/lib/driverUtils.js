import { UNKNOWN_DRIVER_ID } from "./constants.js";

/**
 * Convert DriverChange[] into intervals: { driverId, deviceId, from, to }
 * Each interval represents when a driver was assigned to a device.
 */
export function buildDriverIntervals(driverChanges, fromDate, toDate) {
  // Filter out UnknownDriver
  const changes = driverChanges.filter(
    (dc) => dc.driver?.id && dc.driver.id !== UNKNOWN_DRIVER_ID
  );

  // Group by device
  const byDevice = {};
  for (const dc of changes) {
    const devId = dc.device?.id;
    if (!devId) continue;
    if (!byDevice[devId]) byDevice[devId] = [];
    byDevice[devId].push(dc);
  }

  const intervals = [];
  const periodStart = new Date(fromDate);
  const periodEnd = new Date(toDate);

  for (const [deviceId, deviceChanges] of Object.entries(byDevice)) {
    // Sort by dateTime ascending
    deviceChanges.sort(
      (a, b) => new Date(a.dateTime) - new Date(b.dateTime)
    );

    for (let i = 0; i < deviceChanges.length; i++) {
      const dc = deviceChanges[i];
      const start = new Date(dc.dateTime);
      const end =
        i + 1 < deviceChanges.length
          ? new Date(deviceChanges[i + 1].dateTime)
          : periodEnd;

      // Clamp to period
      const clampedStart = start < periodStart ? periodStart : start;
      const clampedEnd = end > periodEnd ? periodEnd : end;

      if (clampedStart < clampedEnd) {
        intervals.push({
          driverId: dc.driver.id,
          deviceId,
          from: clampedStart.toISOString(),
          to: clampedEnd.toISOString(),
        });
      }
    }
  }

  return intervals;
}

/**
 * Assign trips to drivers based on driver intervals.
 * Returns Map<driverId, Trip[]>
 */
export function assignTripsToDrivers(trips, intervals) {
  const result = {};

  // Build interval lookup by device
  const intervalsByDevice = {};
  for (const iv of intervals) {
    if (!intervalsByDevice[iv.deviceId]) intervalsByDevice[iv.deviceId] = [];
    intervalsByDevice[iv.deviceId].push(iv);
  }

  for (const trip of trips) {
    const deviceId = trip.device?.id;
    if (!deviceId) continue;
    const deviceIntervals = intervalsByDevice[deviceId];
    if (!deviceIntervals) continue;

    const tripStart = new Date(trip.start || trip.dateTime);

    // Find the interval that contains this trip's start time
    for (const iv of deviceIntervals) {
      if (tripStart >= new Date(iv.from) && tripStart < new Date(iv.to)) {
        if (!result[iv.driverId]) result[iv.driverId] = [];
        result[iv.driverId].push(trip);
        break;
      }
    }
  }

  return result;
}

/**
 * Assign events to drivers based on driver intervals.
 * Returns Map<driverId, Map<ruleId, Event[]>>
 */
export function assignEventsToDrivers(events, intervals) {
  const result = {};

  const intervalsByDevice = {};
  for (const iv of intervals) {
    if (!intervalsByDevice[iv.deviceId]) intervalsByDevice[iv.deviceId] = [];
    intervalsByDevice[iv.deviceId].push(iv);
  }

  for (const evt of events) {
    const deviceId = evt.device?.id;
    const ruleId = evt.rule?.id;
    if (!deviceId || !ruleId) continue;

    const deviceIntervals = intervalsByDevice[deviceId];
    if (!deviceIntervals) continue;

    const evtTime = new Date(evt.activeFrom || evt.dateTime);

    for (const iv of deviceIntervals) {
      if (evtTime >= new Date(iv.from) && evtTime < new Date(iv.to)) {
        if (!result[iv.driverId]) result[iv.driverId] = {};
        if (!result[iv.driverId][ruleId]) result[iv.driverId][ruleId] = [];
        result[iv.driverId][ruleId].push(evt);
        break;
      }
    }
  }

  return result;
}

/**
 * Build distance map from driver-assigned trips.
 * Returns Map<driverId, totalDistanceKm>
 */
export function buildDriverDistanceMap(driverTrips) {
  const result = {};
  for (const [driverId, trips] of Object.entries(driverTrips)) {
    result[driverId] = trips.reduce(
      (sum, trip) => sum + (trip.distance || 0),
      0
    );
  }
  return result;
}
