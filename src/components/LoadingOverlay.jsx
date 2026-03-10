export default function LoadingOverlay({ visible, text, progress }) {
  if (!visible) return null;

  return (
    <div className="scorecard-loading" style={{ display: "flex" }}>
      <div className="scorecard-spinner" />
      <span className="scorecard-loading-text">{text || "Loading data…"}</span>
      <div className="scorecard-progress-bar-wrap">
        <div
          className="scorecard-progress-bar"
          style={{ width: Math.min(100, Math.round(progress || 0)) + "%" }}
        />
      </div>
    </div>
  );
}
