import { apiCall } from "../hooks/useGeotabApi.js";

/**
 * Probe whether Safety Center API is available for this database.
 * Returns true if the API responds (even with empty data), false on error.
 */
export async function probeSafetyCenter(api) {
  try {
    const now = new Date();
    const recent = new Date(now);
    recent.setDate(recent.getDate() - 7);
    await apiCall(api, "Get", {
      typeName: "SafetyVehicleInsight",
      search: { fromDate: recent.toISOString() },
      resultsLimit: 1,
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Fetch SafetyDriverInsight records for the given date range.
 */
export async function fetchSafetyDriverInsights(api, fromISO, toISO) {
  const results = await apiCall(api, "Get", {
    typeName: "SafetyDriverInsight",
    search: { fromDate: fromISO, toDate: toISO },
  });
  return results || [];
}

/**
 * Fetch SafetyVehicleInsight records for the given date range.
 */
export async function fetchSafetyVehicleInsights(api, fromISO, toISO) {
  const results = await apiCall(api, "Get", {
    typeName: "SafetyVehicleInsight",
    search: { fromDate: fromISO, toDate: toISO },
  });
  return results || [];
}

/**
 * Aggregate daily Safety Center records into per-entity summaries and trends.
 *
 * @param {Array} records - Raw SafetyDriverInsight or SafetyVehicleInsight records
 * @param {"drivers"|"assets"} entityMode - Determines key field (driver.id vs device.id)
 * @returns {{ summaryByEntity: Map, trendByEntity: Map }}
 *   summaryByEntity: Map<entityId, { crashProbabilityKm, crashProbabilityMile, overallSafetyRank,
 *     harshAccelerationRank, harshBrakingRank, harshCorneringRank, speedingRank, seatbeltRank,
 *     collisionCount, areaRiskClassification, isEnrolled }>
 *   trendByEntity: Map<entityId, Array<{ date, overallSafetyRank, crashProbabilityKm }>>
 */
export function aggregateSafetyInsights(records, entityMode) {
  const byEntity = new Map();

  for (const rec of records) {
    const entityId =
      entityMode === "assets" ? rec.device?.id : rec.driver?.id;
    if (!entityId) continue;

    if (!byEntity.has(entityId)) {
      byEntity.set(entityId, []);
    }
    byEntity.get(entityId).push(rec);
  }

  const summaryByEntity = new Map();
  const trendByEntity = new Map();

  for (const [entityId, dailyRecords] of byEntity) {
    // Sort by date for trend
    dailyRecords.sort(
      (a, b) => new Date(a.dateTime || a.date) - new Date(b.dateTime || b.date)
    );

    // Build trend array
    const trend = dailyRecords.map((r) => ({
      date: (r.dateTime || r.date || "").slice(0, 10),
      overallSafetyRank: r.overallSafetyRank ?? null,
      crashProbabilityKm: r.crashProbabilityKm ?? null,
    }));
    trendByEntity.set(entityId, trend);

    // Aggregate averages across the period
    let sumCrashKm = 0,
      sumCrashMile = 0,
      sumRank = 0,
      sumAccel = 0,
      sumBrake = 0,
      sumCornering = 0,
      sumSpeeding = 0,
      sumSeatbelt = 0;
    let countCrashKm = 0,
      countCrashMile = 0,
      countRank = 0,
      countAccel = 0,
      countBrake = 0,
      countCornering = 0,
      countSpeeding = 0,
      countSeatbelt = 0;
    let totalCollisions = 0;
    const areaRiskCounts = {};
    let isEnrolled = false;

    for (const r of dailyRecords) {
      if (r.crashProbabilityKm != null) {
        sumCrashKm += r.crashProbabilityKm;
        countCrashKm++;
      }
      if (r.crashProbabilityMile != null) {
        sumCrashMile += r.crashProbabilityMile;
        countCrashMile++;
      }
      if (r.overallSafetyRank != null) {
        sumRank += r.overallSafetyRank;
        countRank++;
      }
      if (r.harshAccelerationRank != null) {
        sumAccel += r.harshAccelerationRank;
        countAccel++;
      }
      if (r.harshBrakingRank != null) {
        sumBrake += r.harshBrakingRank;
        countBrake++;
      }
      if (r.harshCorneringRank != null) {
        sumCornering += r.harshCorneringRank;
        countCornering++;
      }
      if (r.speedingRank != null) {
        sumSpeeding += r.speedingRank;
        countSpeeding++;
      }
      if (r.seatbeltRank != null) {
        sumSeatbelt += r.seatbeltRank;
        countSeatbelt++;
      }
      if (r.collisionCount != null) {
        totalCollisions += r.collisionCount;
      }
      if (r.areaRiskClassificationText) {
        const key = r.areaRiskClassificationText;
        areaRiskCounts[key] = (areaRiskCounts[key] || 0) + 1;
      }
      if (r.isEnrolled) {
        isEnrolled = true;
      }
    }

    // Find mode of area risk classification
    let areaRiskClassification = null;
    let maxCount = 0;
    for (const [key, count] of Object.entries(areaRiskCounts)) {
      if (count > maxCount) {
        maxCount = count;
        areaRiskClassification = key;
      }
    }

    summaryByEntity.set(entityId, {
      crashProbabilityKm: countCrashKm > 0 ? sumCrashKm / countCrashKm : null,
      crashProbabilityMile:
        countCrashMile > 0 ? sumCrashMile / countCrashMile : null,
      overallSafetyRank: countRank > 0 ? sumRank / countRank : null,
      harshAccelerationRank: countAccel > 0 ? sumAccel / countAccel : null,
      harshBrakingRank: countBrake > 0 ? sumBrake / countBrake : null,
      harshCorneringRank:
        countCornering > 0 ? sumCornering / countCornering : null,
      speedingRank: countSpeeding > 0 ? sumSpeeding / countSpeeding : null,
      seatbeltRank: countSeatbelt > 0 ? sumSeatbelt / countSeatbelt : null,
      collisionCount: totalCollisions,
      areaRiskClassification,
      isEnrolled,
    });
  }

  return { summaryByEntity, trendByEntity };
}
