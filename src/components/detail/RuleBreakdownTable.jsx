export default function RuleBreakdownTable({
  ruleScores,
  eventCounts,
  ruleColumns,
  ruleWeights,
  onRuleClick,
}) {
  return (
    <table className="scorecard-breakdown-table">
      <thead>
        <tr>
          <th>Rule</th>
          <th style={{ textAlign: "right" }}>Score</th>
          <th style={{ textAlign: "right" }}>Events</th>
          <th style={{ textAlign: "right" }}>Weight</th>
          <th style={{ width: 40 }}></th>
        </tr>
      </thead>
      <tbody>
        {ruleColumns.map((rc) => {
          const score = ruleScores[rc.id];
          const count = eventCounts[rc.id] || 0;
          const weight = ruleWeights[rc.id] || 0;
          return (
            <tr key={rc.id}>
              <td>
                <span
                  className="scorecard-rule-color-dot"
                  style={{ background: rc.color }}
                />
                <span
                  className="scorecard-breakdown-rule-name"
                  onClick={() => onRuleClick(rc.id)}
                  title={`View ${rc.name} exceptions`}
                >
                  {rc.name}
                </span>
              </td>
              <td style={{ textAlign: "right", fontWeight: 600 }}>
                {score !== null ? score.toFixed(1) : "-"}
              </td>
              <td style={{ textAlign: "right" }}>{count}</td>
              <td style={{ textAlign: "right", color: "#888" }}>
                {weight}%
              </td>
              <td style={{ textAlign: "center" }}>
                <button
                  className="scorecard-exception-link"
                  onClick={() => onRuleClick(rc.id)}
                  title={`View exceptions for ${rc.name}`}
                >
                  →
                </button>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
