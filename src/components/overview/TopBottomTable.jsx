import { RISK_COLORS } from "../../lib/constants.js";

export default function TopBottomTable({ title, rows, onDriverClick }) {
  return (
    <div className="scorecard-top-bottom-card">
      <h3>{title}</h3>
      {rows.length === 0 ? (
        <div style={{ color: "#888", fontSize: 13, padding: "8px 0" }}>
          No scored drivers
        </div>
      ) : (
        <table className="scorecard-mini-table">
          <tbody>
            {rows.map((row, i) => (
              <tr key={row.driverId}>
                <td className="scorecard-mini-rank">{i + 1}</td>
                <td
                  className="scorecard-mini-name"
                  onClick={() => onDriverClick(row.driverId)}
                >
                  {row.driverName}
                </td>
                <td
                  className="scorecard-mini-score"
                  style={{ color: RISK_COLORS[row.risk] }}
                >
                  {row.totalScore !== null ? row.totalScore.toFixed(1) : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
