export default function NavTabs({
  activeView,
  onTabChange,
  activeDriverName,
}) {
  return (
    <div className="scorecard-tabs">
      <button
        className={`scorecard-tab ${activeView === "overview" ? "active" : ""}`}
        onClick={() => onTabChange("overview")}
      >
        Overview
      </button>
      <button
        className={`scorecard-tab ${activeView === "detail" ? "active" : ""}`}
        disabled={!activeDriverName}
        onClick={() => onTabChange("detail")}
      >
        Driver Detail
        {activeDriverName && (
          <span className="scorecard-tab-breadcrumb">
            {" "}
            — {activeDriverName}
          </span>
        )}
      </button>
    </div>
  );
}
