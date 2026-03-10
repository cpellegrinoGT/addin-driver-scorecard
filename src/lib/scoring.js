import { DEFAULT_THRESHOLDS, RISK_LABELS } from "./constants.js";

/**
 * Per-rule score = MAX(100 - (eventCount * 1000 / distanceKm), 0)
 */
export function computeRuleScore(eventCount, distanceKm) {
  if (distanceKm <= 0) return null;
  return Math.max(100 - (eventCount * 1000) / distanceKm, 0);
}

/**
 * Total score = SUM(ruleScore[i] * weight[i] / 100)
 * Rules with null scores (no activity) are excluded and weights renormalized.
 */
export function computeTotalScore(ruleScores, ruleWeights) {
  let totalWeight = 0;
  let weightedSum = 0;

  for (const ruleId of Object.keys(ruleScores)) {
    const score = ruleScores[ruleId];
    const weight = ruleWeights[ruleId] || 0;
    if (score !== null && weight > 0) {
      weightedSum += score * weight;
      totalWeight += weight;
    }
  }

  if (totalWeight === 0) return null;
  return weightedSum / totalWeight;
}

/**
 * Classify a total score into a risk tier.
 */
export function classifyRisk(score, thresholds) {
  const t = thresholds || DEFAULT_THRESHOLDS;
  if (score === null) return "noActivity";
  if (score >= t.low) return "low";
  if (score >= t.mild) return "mild";
  if (score >= t.medium) return "medium";
  return "high";
}

/**
 * Build one DriverRow per driver.
 */
export function buildDriverRows({
  driverIds,
  driverDistanceMap,
  driverEventMap,
  selectedRuleIds,
  ruleWeights,
  thresholds,
  driverMap,
}) {
  return driverIds.map((driverId) => {
    const distanceKm = driverDistanceMap[driverId] || 0;
    const ruleScores = {};

    for (const ruleId of selectedRuleIds) {
      const events = driverEventMap[driverId]?.[ruleId] || [];
      ruleScores[ruleId] = computeRuleScore(events.length, distanceKm);
    }

    const totalScore = computeTotalScore(ruleScores, ruleWeights);
    const risk = classifyRisk(totalScore, thresholds);
    const driver = driverMap[driverId];

    return {
      driverId,
      driverName: driver
        ? `${driver.firstName || ""} ${driver.lastName || ""}`.trim()
        : driverId,
      distanceKm,
      ruleScores,
      totalScore,
      risk,
      eventCounts: Object.fromEntries(
        selectedRuleIds.map((ruleId) => [
          ruleId,
          (driverEventMap[driverId]?.[ruleId] || []).length,
        ])
      ),
    };
  });
}

/**
 * Count drivers in each risk tier.
 */
export function buildRiskDistribution(driverRows) {
  const dist = { low: 0, mild: 0, medium: 0, high: 0, noActivity: 0 };
  for (const row of driverRows) {
    dist[row.risk] = (dist[row.risk] || 0) + 1;
  }
  return dist;
}

/**
 * Build trend buckets for a specific driver.
 * Groups events/trips by time bucket and computes scores per bucket.
 */
export function buildTrendBuckets({
  driverId,
  driverEvents,
  driverTrips,
  selectedRuleIds,
  ruleWeights,
  thresholds,
  keyFn,
}) {
  const buckets = {};

  // Bucket trips by date
  for (const trip of driverTrips) {
    const key = keyFn(trip.start || trip.dateTime);
    if (!buckets[key]) {
      buckets[key] = { distanceKm: 0, events: {} };
      for (const ruleId of selectedRuleIds) {
        buckets[key].events[ruleId] = 0;
      }
    }
    buckets[key].distanceKm += trip.distance || 0;
  }

  // Bucket events by date
  for (const ruleId of selectedRuleIds) {
    const events = driverEvents[ruleId] || [];
    for (const evt of events) {
      const key = keyFn(evt.activeFrom || evt.dateTime);
      if (!buckets[key]) {
        buckets[key] = { distanceKm: 0, events: {} };
        for (const rid of selectedRuleIds) {
          buckets[key].events[rid] = 0;
        }
      }
      buckets[key].events[ruleId] = (buckets[key].events[ruleId] || 0) + 1;
    }
  }

  // Compute score per bucket
  const sortedKeys = Object.keys(buckets).sort();
  return sortedKeys.map((key) => {
    const b = buckets[key];
    const ruleScores = {};
    for (const ruleId of selectedRuleIds) {
      ruleScores[ruleId] = computeRuleScore(
        b.events[ruleId] || 0,
        b.distanceKm
      );
    }
    const totalScore = computeTotalScore(ruleScores, ruleWeights);
    return {
      key,
      distanceKm: b.distanceKm,
      ruleScores,
      totalScore,
      risk: classifyRisk(totalScore, thresholds),
    };
  });
}

export function getTopPerformers(driverRows, count = 5) {
  return [...driverRows]
    .filter((r) => r.totalScore !== null)
    .sort((a, b) => b.totalScore - a.totalScore)
    .slice(0, count);
}

export function getBottomPerformers(driverRows, count = 5) {
  return [...driverRows]
    .filter((r) => r.totalScore !== null)
    .sort((a, b) => a.totalScore - b.totalScore)
    .slice(0, count);
}
