import {
  forwardRef,
  useImperativeHandle,
  useReducer,
  useCallback,
  useRef,
  useEffect,
} from "react";
import GeotabContext from "../context/GeotabContext.js";
import { apiCall, apiMultiCall } from "../hooks/useGeotabApi.js";
import { useSettings, DEFAULT_SETTINGS } from "../hooks/useSettings.js";
import { useDataLoader } from "../hooks/useDataLoader.js";
import { buildGroupMap, getDescendantIds } from "../lib/groupUtils.js";
import { getDateRange } from "../lib/dateUtils.js";
import { UNKNOWN_DRIVER_ID } from "../lib/constants.js";
import { isDriveContext } from "../lib/driveUtils.js";
import Toolbar from "./Toolbar.jsx";
import NavTabs from "./NavTabs.jsx";
import LoadingOverlay from "./LoadingOverlay.jsx";
import OverviewPage from "./overview/OverviewPage.jsx";
import DetailPage from "./detail/DetailPage.jsx";
import SettingsPanel from "./settings/SettingsPanel.jsx";
import DriveView from "./drive/DriveView.jsx";
import "@geotab/zenith/dist/index.css";
import "../styles/scorecard.css";
import "../styles/print.css";

const initialState = {
  allRules: [],
  allGroups: [],
  allDevices: [],
  allDrivers: [],
  isMetric: false,
  _api: null,
  _pageState: null,

  fromDate: "",
  toDate: "",
  selectedGroupIds: [],

  activeView: "overview",
  activeDriverId: null,

  settingsPanelOpen: false,
  trendGranularity: "day",

  loading: false,
  loadingText: "",
  progress: 0,
  error: null,

  scorecardData: null,
  safetyCenterAvailable: false,

  // Drive app state
  isDrive: false,
  driveDriver: null,
  driveOnline: true,
};

function reducer(state, action) {
  switch (action.type) {
    case "SET_FOUNDATION":
      return { ...state, ...action.payload };
    case "SET_API":
      return { ...state, _api: action.api, _pageState: action.pageState };
    case "SET_DATES":
      return { ...state, fromDate: action.fromDate, toDate: action.toDate };
    case "SET_GROUPS":
      return { ...state, selectedGroupIds: action.groupIds };
    case "SET_ACTIVE_VIEW":
      return {
        ...state,
        activeView: action.view,
        activeDriverId: action.driverId || null,
      };
    case "SET_SETTINGS_OPEN":
      return { ...state, settingsPanelOpen: action.open };
    case "SET_TREND_GRANULARITY":
      return { ...state, trendGranularity: action.granularity };
    case "SET_LOADING":
      return {
        ...state,
        loading: action.loading,
        loadingText: action.text || "",
        progress: action.progress || 0,
        error: action.loading ? null : state.error,
      };
    case "SET_PROGRESS":
      return { ...state, loadingText: action.text, progress: action.progress };
    case "SET_SCORECARD_DATA":
      return {
        ...state,
        scorecardData: action.data,
        safetyCenterAvailable: action.data?.safetyCenterAvailable ?? false,
        loading: false,
      };
    case "SET_ERROR":
      return { ...state, error: action.error, loading: false };
    case "SET_DRIVE_CONTEXT":
      return {
        ...state,
        isDrive: true,
        driveDriver: action.driver,
      };
    case "SET_DRIVE_ONLINE":
      return { ...state, driveOnline: action.online };
    default:
      return state;
  }
}

const App = forwardRef(function App(props, ref) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [settings, updateSettings, syncFromServer, syncToServer] =
    useSettings();
  const { loadData, abort } = useDataLoader();
  const rawDataRef = useRef(null);
  const driveRefreshRef = useRef(null);

  const initializeFoundation = useCallback(async (api, pageState) => {
    dispatch({ type: "SET_API", api, pageState });
    try {
      const [[rules], [groups], [devices], [drivers]] = await Promise.all([
        apiMultiCall(api, [["Get", { typeName: "Rule" }]]),
        apiMultiCall(api, [["Get", { typeName: "Group" }]]),
        apiMultiCall(api, [["Get", { typeName: "Device" }]]),
        apiMultiCall(api, [
          ["Get", { typeName: "User", search: { isDriver: true } }],
        ]),
      ]);

      const [currentUserArr] = await apiMultiCall(api, [
        [
          "Get",
          {
            typeName: "User",
            search: { name: pageState.credentials?.userName },
          },
        ],
      ]);
      const isMetric = currentUserArr?.[0]?.isMetric ?? false;

      const now = new Date();
      const sevenAgo = new Date(now);
      sevenAgo.setDate(sevenAgo.getDate() - 7);

      dispatch({
        type: "SET_FOUNDATION",
        payload: {
          allRules: rules || [],
          allGroups: groups || [],
          allDevices: devices || [],
          allDrivers: (drivers || []).filter(
            (d) => d.id !== UNKNOWN_DRIVER_ID
          ),
          isMetric,
          _api: api,
          _pageState: pageState,
          fromDate: sevenAgo.toISOString().slice(0, 10),
          toDate: now.toISOString().slice(0, 10),
        },
      });

      // Sync settings from server (AddInData)
      const hadServerSettings = await syncFromServer(api);

      // If no server settings existed yet, push local settings up
      if (!hadServerSettings) {
        await syncToServer(api);
      }

      // Detect Drive context — flag set by shell.js based on addin registration name
      if (isDriveContext()) {
        const filteredDrivers = (drivers || []).filter(
          (d) => d.id !== UNKNOWN_DRIVER_ID
        );
        const currentDriver = filteredDrivers.find(
          (d) => d.name === pageState.credentials?.userName
        ) || currentUserArr?.[0] || null;
        dispatch({ type: "SET_DRIVE_CONTEXT", driver: currentDriver });
      }
    } catch (err) {
      console.error("Foundation load error:", err);
      dispatch({ type: "SET_ERROR", error: "Failed to load foundation data." });
    }
  }, [syncFromServer, syncToServer]);

  const handleApply = useCallback(async () => {
    if (!state._api) return;

    const weightSum = Object.values(settings.ruleWeights).reduce(
      (s, w) => s + w,
      0
    );
    if (Math.abs(weightSum - 100) > 0.01) {
      dispatch({
        type: "SET_ERROR",
        error: "Rule weights must sum to 100%.",
      });
      return;
    }

    dispatch({
      type: "SET_LOADING",
      loading: true,
      text: "Loading data…",
      progress: 0,
    });

    try {
      const groupMap = buildGroupMap(state.allGroups);
      let deviceIds = null;
      if (state.selectedGroupIds.length > 0) {
        const allDescIds = new Set();
        for (const gid of state.selectedGroupIds) {
          for (const did of getDescendantIds(gid, groupMap)) {
            allDescIds.add(did);
          }
        }
        deviceIds = state.allDevices
          .filter((d) =>
            d.groups?.some((g) => allDescIds.has(g.id))
          )
          .map((d) => d.id);
      }

      const result = await loadData({
        api: state._api,
        fromDate: state.fromDate,
        toDate: state.toDate,
        selectedRuleIds: settings.selectedRuleIds,
        ruleWeights: settings.ruleWeights,
        thresholds: settings.thresholds,
        allDrivers: state.allDrivers,
        allDevices: state.allDevices,
        deviceIds,
        entityMode: settings.entityMode,
        onProgress: (text, progress) =>
          dispatch({ type: "SET_PROGRESS", text, progress }),
      });

      rawDataRef.current = result.rawData;
      dispatch({ type: "SET_SCORECARD_DATA", data: result });
    } catch (err) {
      if (err.name === "AbortError") {
        dispatch({ type: "SET_LOADING", loading: false });
      } else {
        console.error("Data load error:", err);
        dispatch({
          type: "SET_ERROR",
          error: err.message || "Failed to load data.",
        });
      }
    }
  }, [state._api, state.fromDate, state.toDate, state.selectedGroupIds, state.allDrivers, state.allDevices, state.allGroups, settings, loadData]);

  // Sync settings to server when they change (MyGeotab only)
  const prevSettingsRef = useRef(settings);
  useEffect(() => {
    if (state._api && !state.isDrive && prevSettingsRef.current !== settings) {
      prevSettingsRef.current = settings;
      syncToServer(state._api);
    }
  }, [settings, state._api, state.isDrive, syncToServer]);

  useImperativeHandle(
    ref,
    () => ({
      isDrive: state.isDrive,
      initializeFoundation,
      updateApi(api, pageState) {
        dispatch({ type: "SET_API", api, pageState });
        // Update online state from pageState in Drive
        if (state.isDrive && pageState) {
          dispatch({
            type: "SET_DRIVE_ONLINE",
            online: pageState.online !== false,
          });
        }
      },
      refreshDriveData() {
        if (driveRefreshRef.current) driveRefreshRef.current();
      },
      abort() {
        abort();
        dispatch({ type: "SET_LOADING", loading: false });
      },
    }),
    [initializeFoundation, abort, state.isDrive]
  );

  // Add drive-mode class to root element
  useEffect(() => {
    const root = document.getElementById("scorecard-root");
    if (root) {
      if (state.isDrive) {
        root.classList.add("drive-mode");
      } else {
        root.classList.remove("drive-mode");
      }
    }
  }, [state.isDrive]);

  // Drive app render
  if (state.isDrive) {
    return (
      <GeotabContext.Provider
        value={{ api: state._api, pageState: state._pageState }}
      >
        <DriveView
          api={state._api}
          driveDriver={state.driveDriver}
          online={state.driveOnline}
          settings={settings}
          allDrivers={state.allDrivers}
          allDevices={state.allDevices}
          isMetric={state.isMetric}
          onRegisterRefresh={(fn) => {
            driveRefreshRef.current = fn;
          }}
        />
      </GeotabContext.Provider>
    );
  }

  // MyGeotab render (unchanged)
  const entityLabel = settings.entityMode === "assets" ? "Asset" : "Driver";

  const driverMap = {};
  if (settings.entityMode === "assets") {
    for (const d of state.allDevices) driverMap[d.id] = d;
  } else {
    for (const d of state.allDrivers) driverMap[d.id] = d;
  }

  return (
    <GeotabContext.Provider
      value={{ api: state._api, pageState: state._pageState }}
    >
      <div id="scorecard-container">
        <Toolbar
          fromDate={state.fromDate}
          toDate={state.toDate}
          allGroups={state.allGroups}
          selectedGroupIds={state.selectedGroupIds}
          onDateChange={(from, to) =>
            dispatch({ type: "SET_DATES", fromDate: from, toDate: to })
          }
          onGroupChange={(ids) =>
            dispatch({ type: "SET_GROUPS", groupIds: ids })
          }
          onApply={handleApply}
          onSettingsClick={() =>
            dispatch({ type: "SET_SETTINGS_OPEN", open: true })
          }
          loading={state.loading}
          settings={settings}
        />

        {state.error && (
          <div className="scorecard-error-banner">{state.error}</div>
        )}

        <div id="scorecard-content">
          <LoadingOverlay
            visible={state.loading}
            text={state.loadingText}
            progress={state.progress}
          />

          {state.scorecardData && (
            <>
              <NavTabs
                activeView={state.activeView}
                onTabChange={(view) =>
                  dispatch({
                    type: "SET_ACTIVE_VIEW",
                    view,
                    driverId: view === "overview" ? null : state.activeDriverId,
                  })
                }
                entityLabel={entityLabel}
                activeDriverName={
                  state.activeDriverId
                    ? (() => {
                        const d = driverMap[state.activeDriverId];
                        if (!d) return state.activeDriverId;
                        return settings.entityMode === "assets"
                          ? d.name || d.id
                          : `${d.firstName || ""} ${d.lastName || ""}`.trim();
                      })()
                    : null
                }
              />

              {state.activeView === "overview" && (
                <OverviewPage
                  data={state.scorecardData}
                  settings={settings}
                  allRules={state.allRules}
                  allDrivers={state.allDrivers}
                  allGroups={state.allGroups}
                  isMetric={state.isMetric}
                  rawData={rawDataRef.current}
                  trendGranularity={state.trendGranularity}
                  entityLabel={entityLabel}
                  safetyCenterData={state.scorecardData?.safetyCenterData}
                  showSafety={settings.showSafety}
                  onGranularityChange={(g) =>
                    dispatch({
                      type: "SET_TREND_GRANULARITY",
                      granularity: g,
                    })
                  }
                  onDriverClick={(driverId) =>
                    dispatch({
                      type: "SET_ACTIVE_VIEW",
                      view: "detail",
                      driverId,
                    })
                  }
                />
              )}

              {state.activeView === "detail" && state.activeDriverId && (
                <DetailPage
                  data={state.scorecardData}
                  driverId={state.activeDriverId}
                  settings={settings}
                  allRules={state.allRules}
                  allDrivers={state.allDrivers}
                  isMetric={state.isMetric}
                  trendGranularity={state.trendGranularity}
                  entityLabel={entityLabel}
                  safetyCenterData={state.scorecardData?.safetyCenterData}
                  showSafety={settings.showSafety}
                  onGranularityChange={(g) =>
                    dispatch({
                      type: "SET_TREND_GRANULARITY",
                      granularity: g,
                    })
                  }
                  onBack={() =>
                    dispatch({
                      type: "SET_ACTIVE_VIEW",
                      view: "overview",
                    })
                  }
                  rawData={rawDataRef.current}
                  fromDate={state.fromDate}
                  toDate={state.toDate}
                />
              )}
            </>
          )}

          {!state.loading && !state.scorecardData && !state.error && (
            <div className="scorecard-empty">
              Select date range and rules, then click <strong>Apply</strong> to
              generate the scorecard.
            </div>
          )}
        </div>

        {state.settingsPanelOpen && (
          <SettingsPanel
            settings={settings}
            onUpdate={updateSettings}
            allRules={state.allRules}
            safetyCenterAvailable={state.safetyCenterAvailable}
            onClose={() =>
              dispatch({ type: "SET_SETTINGS_OPEN", open: false })
            }
          />
        )}
      </div>
    </GeotabContext.Provider>
  );
});

export default App;
