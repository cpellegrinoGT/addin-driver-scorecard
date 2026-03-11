import { useRef, useEffect } from "react";
import { Chart, ArcElement, DoughnutController, Tooltip, Legend } from "chart.js";
import { RISK_COLORS, RISK_LABELS } from "../../lib/constants.js";

Chart.register(ArcElement, DoughnutController, Tooltip, Legend);

const TIERS = ["low", "mild", "medium", "high"];

export default function RiskDonut({ distribution, entityMode }) {
  const centerLabel = entityMode === "assets" ? "Assets" : "Drivers";
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const data = TIERS.map((t) => distribution[t] || 0);
    const total = data.reduce((a, b) => a + b, 0);

    if (chartRef.current) {
      chartRef.current.destroy();
    }

    chartRef.current = new Chart(canvasRef.current, {
      type: "doughnut",
      data: {
        labels: TIERS.map((t) => RISK_LABELS[t]),
        datasets: [
          {
            data,
            backgroundColor: TIERS.map((t) => RISK_COLORS[t]),
            borderWidth: 2,
            borderColor: "#fff",
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        cutout: "65%",
        plugins: {
          legend: {
            position: "bottom",
            labels: { font: { size: 11 }, padding: 12 },
          },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const pct =
                  total > 0
                    ? ((ctx.raw / total) * 100).toFixed(1) + "%"
                    : "0%";
                return `${ctx.label}: ${ctx.raw} (${pct})`;
              },
            },
          },
        },
      },
      plugins: [
        {
          id: "centerText",
          afterDraw(chart) {
            const { ctx, chartArea } = chart;
            const cx = (chartArea.left + chartArea.right) / 2;
            const cy = (chartArea.top + chartArea.bottom) / 2;
            ctx.save();
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.font = "bold 22px Roboto, sans-serif";
            ctx.fillStyle = "#333";
            ctx.fillText(total, cx, cy - 8);
            ctx.font = "11px Roboto, sans-serif";
            ctx.fillStyle = "#888";
            ctx.fillText(centerLabel, cx, cy + 12);
            ctx.restore();
          },
        },
      ],
    });

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, [distribution, centerLabel]);

  return (
    <div style={{ maxWidth: 240, margin: "0 auto" }}>
      <canvas ref={canvasRef} />
    </div>
  );
}
