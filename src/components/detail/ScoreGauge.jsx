import { RISK_COLORS } from "../../lib/constants.js";

export default function ScoreGauge({ score, risk }) {
  const radius = 70;
  const stroke = 12;
  const center = 90;
  const circumference = Math.PI * radius; // half circle

  const pct = score !== null ? Math.min(score, 100) / 100 : 0;
  const dashOffset = circumference * (1 - pct);
  const color = RISK_COLORS[risk] || "#6c757d";

  return (
    <svg width={180} height={120} viewBox="0 0 180 120">
      {/* Background arc */}
      <path
        d={`M ${center - radius} ${center} A ${radius} ${radius} 0 0 1 ${
          center + radius
        } ${center}`}
        fill="none"
        stroke="#e0e0e0"
        strokeWidth={stroke}
        strokeLinecap="round"
      />
      {/* Score arc */}
      <path
        d={`M ${center - radius} ${center} A ${radius} ${radius} 0 0 1 ${
          center + radius
        } ${center}`}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={dashOffset}
        style={{ transition: "stroke-dashoffset 0.5s ease" }}
      />
      {/* Score text */}
      <text
        x={center}
        y={center - 10}
        textAnchor="middle"
        fontSize="28"
        fontWeight="700"
        fill={color}
      >
        {score !== null ? score.toFixed(1) : "-"}
      </text>
      <text
        x={center}
        y={center + 12}
        textAnchor="middle"
        fontSize="11"
        fill="#888"
      >
        out of 100
      </text>
    </svg>
  );
}
