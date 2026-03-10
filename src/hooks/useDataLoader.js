import { useRef, useCallback } from "react";
import { apiCall, apiMultiCallRetry } from "./useGeotabApi.js";
import { chunkDateRange } from "../lib/dateUtils.js";
import {
  buildDriverIntervals,
  assignTripsToDrivers,
  assignEventsToDrivers,
  buildDriverDistanceMap,
} from "../lib/driverUtils.js";
import {
  buildDriverRows,
  buildRiskDistribution,
} from "../lib/scoring.js";
import { CHUNK_DAYS, MULTI_CALL_BATCH, RESULTS_LIMIT } from "../lib/constants.js";

export function useDataLoader() {
  const abortRef = useRef(null);

  const abort = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
  }, []);

  const loadData = useCallback(
    async ({
      api,
      fromDate,
      toDate,
      selectedRuleIds,
      ruleWeights,
      thresholds,
      allDrivers,
      allDevices,
      deviceIds,
      entityMode,
      onProgress,
    }) => {
      abort();
      const controller = new AbortController();
      abortRef.current = controller;
      const signal = controller.signal;

      function checkAbort() {
        if (signal.aborted) throw new DOMException("Aborted", "AbortError");
      }

      const fromISO = new Date(fromDate).toISOString();
      const toISO = new Date(toDate + "T23:59:59").toISOString();

      // Step 1: Fetch DriverChanges or build device intervals (10%)
      let filteredIntervals;
      let filteredDriverIds;

      if (entityMode === "assets") {
        // Asset mode: skip DriverChange, build one interval per device
        onProgress("Building asset intervals…", 5);
        checkAbort();

        const devList = deviceIds
          ? allDevices.filter((d) => deviceIds.includes(d.id))
          : allDevices;

        filteredIntervals = devList.map((dev) => ({
          driverId: dev.id,
          deviceId: dev.id,
          from: fromISO,
          to: toISO,
        }));
        filteredDriverIds = devList.map((d) => d.id);
      } else {
        // Driver mode: fetch DriverChange records
        onProgress("Fetching driver assignments…", 5);
        checkAbort();

        const driverChanges = await apiCall(api, "Get", {
          typeName: "DriverChange",
          search: {
            fromDate: fromISO,
            toDate: toISO,
            includeOverlappedChanges: true,
          },
          resultsLimit: RESULTS_LIMIT,
        });
        checkAbort();

        const intervals = buildDriverIntervals(driverChanges, fromISO, toISO);

        // If group filtering, filter intervals by allowed devices
        filteredIntervals = intervals;
        if (deviceIds) {
          const deviceSet = new Set(deviceIds);
          filteredIntervals = intervals.filter((iv) =>
            deviceSet.has(iv.deviceId)
          );
        }

        filteredDriverIds = [
          ...new Set(filteredIntervals.map((iv) => iv.driverId)),
        ];
      }

      onProgress("Fetching driver assignments…", 10);

      // Step 2: Fetch Trips (10-40%)
      onProgress("Fetching trips…", 12);
      checkAbort();

      const chunks = chunkDateRange(fromISO, toISO, CHUNK_DAYS);
      const allTrips = [];

      for (let i = 0; i < chunks.length; i++) {
        checkAbort();
        const chunk = chunks[i];
        const trips = await apiCall(api, "Get", {
          typeName: "Trip",
          search: { fromDate: chunk.from, toDate: chunk.to },
          resultsLimit: RESULTS_LIMIT,
        });
        allTrips.push(...(trips || []));

        const pct = 12 + ((i + 1) / chunks.length) * 28;
        onProgress(
          `Fetching trips… (${i + 1}/${chunks.length})`,
          Math.round(pct)
        );

        if (i < chunks.length - 1) {
          await new Promise((r) => setTimeout(r, 200));
        }
      }
      checkAbort();

      const driverTrips = assignTripsToDrivers(allTrips, filteredIntervals);
      const driverDistanceMap = buildDriverDistanceMap(driverTrips);

      // Step 3: Fetch ExceptionEvents per rule (40-90%)
      onProgress("Fetching exception events…", 42);
      checkAbort();

      const allEvents = [];
      const totalRuleChunks = selectedRuleIds.length * chunks.length;
      let completedRuleChunks = 0;

      for (const ruleId of selectedRuleIds) {
        for (let i = 0; i < chunks.length; i++) {
          checkAbort();

          // Batch multiple rule+chunk combos into multiCall
          const calls = [
            [
              "Get",
              {
                typeName: "ExceptionEvent",
                search: {
                  ruleSearch: { id: ruleId },
                  fromDate: chunks[i].from,
                  toDate: chunks[i].to,
                },
                resultsLimit: RESULTS_LIMIT,
              },
            ],
          ];

          const [events] = await apiMultiCallRetry(api, calls);
          allEvents.push(...(events || []));

          completedRuleChunks++;
          const pct = 42 + (completedRuleChunks / totalRuleChunks) * 48;
          onProgress(
            `Fetching events… (${completedRuleChunks}/${totalRuleChunks})`,
            Math.round(pct)
          );

          if (completedRuleChunks < totalRuleChunks) {
            await new Promise((r) => setTimeout(r, 150));
          }
        }
      }
      checkAbort();

      // Step 4: Build scorecard (90-100%)
      onProgress("Computing scores…", 92);

      const driverEventMap = assignEventsToDrivers(
        allEvents,
        filteredIntervals
      );

      // Build entity name map (driver names or device names depending on mode)
      const driverMap = {};
      if (entityMode === "assets") {
        for (const d of allDevices) {
          driverMap[d.id] = { firstName: d.name || d.id, lastName: "" };
        }
      } else {
        for (const d of allDrivers) driverMap[d.id] = d;
      }

      const driverRows = buildDriverRows({
        driverIds: filteredDriverIds,
        driverDistanceMap,
        driverEventMap,
        selectedRuleIds,
        ruleWeights,
        thresholds,
        driverMap,
      });

      const riskDistribution = buildRiskDistribution(driverRows);

      onProgress("Done", 100);

      return {
        driverRows,
        riskDistribution,
        dateRange: { from: fromDate, to: toDate },
        rawData: {
          driverTrips,
          driverEventMap,
          intervals: filteredIntervals,
        },
      };
    },
    [abort]
  );

  return { loadData, abort };
}
