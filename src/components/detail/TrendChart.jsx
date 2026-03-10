import { useRef, useEffect } from "react";
import {
  Chart,
  LineElement,
  LineController,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Filler,
  Legend,
} from "chart.js";
import { RISK_COLORS, PCR_COLOR } from "../../lib/constants.js";

Chart.register(
  LineElement,
  LineController,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Filler,
  Legend
);

export default function TrendChart({ buckets, thresholds, showPcr }) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    if (chartRef.current) chartRef.current.destroy();

    const labels = buckets.map((b) => b.key);
    const scores = buckets.map((b) => b.totalScore);

    const datasets = [
      {
        label: "Safety Score",
        data: scores,
        borderColor: "#4a90d9",
        backgroundColor: "rgba(74,144,217,0.1)",
        fill: true,
        tension: 0.3,
        pointRadius: 3,
        pointBackgroundColor: "#4a90d9",
      },
    ];

    if (showPcr) {
      const pcrScores = buckets.map((b) => b.pcrScore ?? null);
      datasets.push({
        label: "PCR (Collision Risk)",
        data: pcrScores,
        borderColor: PCR_COLOR,
        backgroundColor: "rgba(220,53,69,0.05)",
        fill: false,
        tension: 0.3,
        pointRadius: 3,
        pointBackgroundColor: PCR_COLOR,
        borderDash: [5, 3],
      });
    }

    chartRef.current = new Chart(canvasRef.current, {
      type: "line",
      data: { labels, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: showPcr,
            position: "top",
            labels: { font: { size: 11 }, boxWidth: 14, padding: 12 },
          },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                if (ctx.raw === null) return `${ctx.dataset.label}: No data`;
                return `${ctx.dataset.label}: ${ctx.raw.toFixed(1)}`;
              },
            },
          },
        },
        scales: {
          y: {
            min: 0,
            max: 100,
            ticks: { font: { size: 11 } },
            grid: { color: "#f0f0f0" },
          },
          x: {
            ticks: { font: { size: 10 }, maxRotation: 45 },
            grid: { display: false },
          },
        },
      },
      plugins: [
        {
          id: "thresholdLines",
          afterDraw(chart) {
            const { ctx, scales } = chart;
            const yScale = scales.y;
            const xScale = scales.x;

            const lines = [
              { value: thresholds.low, color: RISK_COLORS.low, label: "Low" },
              {
                value: thresholds.mild,
                color: RISK_COLORS.mild,
                label: "Mild",
              },
              {
                value: thresholds.medium,
                color: RISK_COLORS.medium,
                label: "Med",
              },
            ];

            ctx.save();
            for (const line of lines) {
              const y = yScale.getPixelForValue(line.value);
              ctx.strokeStyle = line.color;
              ctx.lineWidth = 1;
              ctx.setLineDash([4, 4]);
              ctx.beginPath();
              ctx.moveTo(xScale.left, y);
              ctx.lineTo(xScale.right, y);
              ctx.stroke();
              ctx.setLineDash([]);

              ctx.fillStyle = line.color;
              ctx.font = "10px Roboto, sans-serif";
              ctx.textAlign = "right";
              ctx.fillText(line.label, xScale.right, y - 3);
            }
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
  }, [buckets, thresholds, showPcr]);

  if (buckets.length === 0) {
    return (
      <div style={{ color: "#888", fontSize: 13, padding: "16px 0" }}>
        No trend data available for this period.
      </div>
    );
  }

  return (
    <div style={{ height: 200 }}>
      <canvas ref={canvasRef} />
    </div>
  );
}
