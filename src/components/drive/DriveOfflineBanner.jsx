export default function DriveOfflineBanner({ onRetry }) {
  return (
    <div className="drive-offline-banner">
      <div className="drive-offline-icon">&#x26A0;</div>
      <p className="drive-offline-text">
        No connection — please connect to view your scorecard.
      </p>
      <button className="scorecard-btn scorecard-btn-primary" onClick={onRetry}>
        Retry
      </button>
    </div>
  );
}
