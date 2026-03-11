import { useState, useEffect, useCallback } from "react";
import { apiCall, apiMultiCallRetry } from "../../hooks/useGeotabApi.js";
import {
  buildDriverIntervals,
  assignTripsToDrivers,
  assignEventsToDrivers,
  buildDriverDistanceMap,
} from "../../lib/driverUtils.js";
import { buildDriverRows, buildTrendBuckets } from "../../lib/scoring.js";
import {
  probeSafetyCenter,
  fetchSafetyDriverInsights,
  aggregateSafetyInsights,
} from "../../lib/safetyCenter.js";
import { chunkDateRange } from "../../lib/dateUtils.js";
import { CHUNK_DAYS, RESULTS_LIMIT } from "../../lib/constants.js";
import DriveScorecard from "./DriveScorecard.jsx";
import DriveOfflineBanner from "./DriveOfflineBanner.jsx";

export default function DriveView({
  api,
  driveDriver,
  online,
  settings,
  allDrivers,
  allDevices,
  isMetric,
  onRegisterRefresh,
}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadDriveData = useCallback(async () => {
    if (!api || !driveDriver) return;

    setLoading(true);
    setError(null);

    try {
      const now = new Date();
      const sevenAgo = new Date(now);
      sevenAgo.setDate(sevenAgo.getDate() - 7);
      const fromISO = sevenAgo.toISOString();
      const toISO = now.toISOString();

      // Step 1: Fetch DriverChanges for all drivers (needed for fleet ranking)
      const driverChanges = await apiCall(api, "Get", {
        typeName: "DriverChange",
        search: {
          fromDate: fromISO,
          toDate: toISO,
          includeOverlappedChanges: true,
        },
        resultsLimit: RESULTS_LIMIT,
      });

      const intervals = buildDriverIntervals(driverChanges, fromISO, toISO);
      const driverIds = [...new Set(intervals.map((iv) => iv.driverId))];

      // Step 2: Fetch Trips
      const chunks = chunkDateRange(fromISO, toISO, CHUNK_DAYS);
      const allTrips = [];

      for (let i = 0; i < chunks.length; i++) {
        const trips = await apiCall(api, "Get", {
          typeName: "Trip",
          search: { fromDate: chunks[i].from, toDate: chunks[i].to },
          resultsLimit: RESULTS_LIMIT,
        });
        allTrips.push(...(trips || []));
      }

      const driverTrips = assignTripsToDrivers(allTrips, intervals);
      const driverDistanceMap = buildDriverDistanceMap(driverTrips);

      // Step 3: Fetch ExceptionEvents per rule
      const allEvents = [];
      for (const ruleId of settings.selectedRuleIds) {
        for (const chunk of chunks) {
          const [events] = await apiMultiCallRetry(api, [
            [
              "Get",
              {
                typeName: "ExceptionEvent",
                search: {
                  ruleSearch: { id: ruleId },
                  fromDate: chunk.from,
                  toDate: chunk.to,
                },
                resultsLimit: RESULTS_LIMIT,
              },
            ],
          ]);
          allEvents.push(...(events || []));
        }
      }

      const driverEventMap = assignEventsToDrivers(allEvents, intervals);

      // Step 4: Build all driver rows for fleet ranking
      const driverMap = {};
      for (const d of allDrivers) driverMap[d.id] = d;

      const driverRows = buildDriverRows({
        driverIds,
        driverDistanceMap,
        driverEventMap,
        selectedRuleIds: settings.selectedRuleIds,
        ruleWeights: settings.ruleWeights,
        thresholds: settings.thresholds,
        driverMap,
      });

      // Find logged-in driver's row
      const myRow = driverRows.find((r) => r.driverId === driveDriver.id);

      // Compute fleet rank
      const scoredRows = driverRows
        .filter((r) => r.totalScore !== null)
        .sort((a, b) => b.totalScore - a.totalScore);
      const fleetRank =
        myRow && myRow.totalScore !== null
          ? scoredRows.findIndex((r) => r.driverId === driveDriver.id) + 1
          : null;

      // Step 5: Safety Center (if available)
      let safetySummary = null;
      try {
        const scAvailable = await probeSafetyCenter(api);
        if (scAvailable) {
          const scRecords = await fetchSafetyDriverInsights(
            api,
            fromISO,
            toISO
          );
          const { summaryByEntity } = aggregateSafetyInsights(
            scRecords,
            "drivers"
          );
          safetySummary = summaryByEntity.get(driveDriver.id) || null;
        }
      } catch (err) {
        console.warn("Safety Center unavailable in Drive:", err);
      }

      // Step 6: Build trend buckets for this driver
      const myTrips = driverTrips[driveDriver.id] || [];
      const myEvents = driverEventMap[driveDriver.id] || {};

      const trendBuckets = buildTrendBuckets({
        driverId: driveDriver.id,
        driverEvents: myEvents,
        driverTrips: myTrips,
        selectedRuleIds: settings.selectedRuleIds,
        ruleWeights: settings.ruleWeights,
        thresholds: settings.thresholds,
        keyFn: (dateStr) => (dateStr || "").slice(0, 10),
      });

      const driverName = myRow
        ? myRow.driverName
        : `${driveDriver.firstName || ""} ${driveDriver.lastName || ""}`.trim();

      setData({
        driverName,
        totalScore: myRow?.totalScore ?? null,
        risk: myRow?.risk ?? "noActivity",
        safetySummary,
        trendBuckets,
        fleetRank,
        fleetTotal: scoredRows.length,
      });
    } catch (err) {
      console.error("Drive data load error:", err);
      setError(err.message || "Failed to load data.");
    } finally {
      setLoading(false);
    }
  }, [api, driveDriver, settings, allDrivers]);

  useEffect(() => {
    if (onRegisterRefresh) {
      onRegisterRefresh(loadDriveData);
    }
  }, [onRegisterRefresh, loadDriveData]);

  // Load data on mount
  useEffect(() => {
    if (settings.driveEnabled && online && api && driveDriver) {
      loadDriveData();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!settings.driveEnabled) {
    return (
      <div className="drive-disabled-message">
        <div className="drive-disabled-icon">&#x1F6C8;</div>
        <p>
          The Driver Scorecard has not been enabled for the Drive app by your
          administrator.
        </p>
        <p style={{ fontSize: 12, color: "#aaa", marginTop: 8 }}>
          An admin must enable Drive in the scorecard settings within MyGeotab.
        </p>
      </div>
    );
  }

  if (!settings.selectedRuleIds || settings.selectedRuleIds.length === 0) {
    return (
      <div className="drive-disabled-message">
        <div className="drive-disabled-icon">&#x1F6C8;</div>
        <p>No scoring rules have been configured yet.</p>
        <p style={{ fontSize: 12, color: "#aaa", marginTop: 8 }}>
          An admin must select rules in the scorecard settings within MyGeotab.
        </p>
      </div>
    );
  }

  if (!online) {
    return <DriveOfflineBanner onRetry={loadDriveData} />;
  }

  if (error) {
    return (
      <div className="drive-disabled-message">
        <p style={{ color: "#dc3545" }}>{error}</p>
        <button
          className="scorecard-btn scorecard-btn-primary"
          onClick={loadDriveData}
        >
          Retry
        </button>
      </div>
    );
  }

  if (loading && !data) {
    return (
      <div className="drive-loading">
        <div className="scorecard-spinner" />
        <div className="scorecard-loading-text">Loading your scorecard...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="drive-loading">
        <div className="scorecard-spinner" />
        <div className="scorecard-loading-text">Loading...</div>
      </div>
    );
  }

  return (
    <DriveScorecard
      driverName={data.driverName}
      totalScore={data.totalScore}
      risk={data.risk}
      safetySummary={data.safetySummary}
      trendBuckets={data.trendBuckets}
      fleetRank={data.fleetRank}
      fleetTotal={data.fleetTotal}
      thresholds={settings.thresholds}
      onRefresh={loadDriveData}
      loading={loading}
    />
  );
}
