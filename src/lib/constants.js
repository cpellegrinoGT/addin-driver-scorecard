export const MAX_RULES = 12;
export const MULTI_CALL_BATCH = 20;
export const CHUNK_DAYS = 14;
export const PAGE_SIZE = 25;
export const RESULTS_LIMIT = 50000;

export const UNKNOWN_DRIVER_ID = "UnknownDriverId";

export const DEFAULT_THRESHOLDS = {
  low: 95,
  mild: 75,
  medium: 60,
};

export const RISK_LABELS = {
  low: "Low Risk",
  mild: "Mild Risk",
  medium: "Medium Risk",
  high: "High Risk",
  noActivity: "No Activity",
};

export const RISK_COLORS = {
  low: "#28a745",
  mild: "#ffc107",
  medium: "#fd7e14",
  high: "#dc3545",
  noActivity: "#6c757d",
};

export const RULE_PALETTE = [
  "#4a90d9",
  "#e74c3c",
  "#2ecc71",
  "#f39c12",
  "#9b59b6",
  "#1abc9c",
  "#e67e22",
  "#3498db",
  "#e91e63",
  "#00bcd4",
  "#8bc34a",
  "#ff5722",
];

export const SETTINGS_STORAGE_KEY = "driverScorecard_settings";
export const VIEWS_STORAGE_KEY = "driverScorecard_savedViews";

export const ADDIN_DATA_ID = "driverScorecard";
export const DRIVE_CACHE_KEY = "driverScorecard_driveCache";
