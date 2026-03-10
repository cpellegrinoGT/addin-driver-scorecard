import { RISK_LABELS } from "../../lib/constants.js";

export default function DriverTableRow({
  row,
  ruleColumns,
  isMetric,
  onDriverClick,
}) {
  const distance = isMetric
    ? row.distanceKm
    : row.distanceKm * 0.621371;

  return (
    <tr>
      <td>
        <span
          className="scorecard-driver-link"
          onClick={() => onDriverClick(row.driverId)}
        >
          {row.driverName}
        </span>
      </td>
      <td className="scorecard-score-cell">
        {row.totalScore !== null ? row.totalScore.toFixed(1) : "-"}
      </td>
      <td>
        <span className={`scorecard-badge scorecard-badge-${row.risk}`}>
          {RISK_LABELS[row.risk]}
        </span>
      </td>
      <td style={{ textAlign: "right" }}>
        {row.distanceKm > 0
          ? Math.round(distance).toLocaleString()
          : "-"}
      </td>
      {ruleColumns.map((rc) => {
        const score = row.ruleScores[rc.id];
        const count = row.eventCounts[rc.id] || 0;
        return (
          <td key={rc.id} style={{ textAlign: "right" }}>
            {score !== null ? (
              <>
                <span
                  className="scorecard-rule-score-bar"
                  style={{
                    background: rc.color,
                    opacity: 0.3 + (score / 100) * 0.7,
                  }}
                />
                {score.toFixed(1)}
                <span
                  style={{
                    fontSize: 11,
                    color: "#999",
                    marginLeft: 4,
                  }}
                >
                  ({count})
                </span>
              </>
            ) : (
              "-"
            )}
          </td>
        );
      })}
    </tr>
  );
}
