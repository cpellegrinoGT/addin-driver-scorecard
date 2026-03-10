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
} from "chart.js";

Chart.register(
  LineElement,
  LineController,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Filler
);

export default function SafetyTrendChart({ trendData }) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    if (chartRef.current) chartRef.current.destroy();

    if (!trendData || trendData.length === 0) return;

    const labels = trendData.map((d) => d.date);
    const ranks = trendData.map((d) => d.overallSafetyRank);

    chartRef.current = new Chart(canvasRef.current, {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: "Safety Rank",
            data: ranks,
            borderColor: "#17a2b8",
            backgroundColor: "rgba(23,162,184,0.1)",
            fill: true,
            tension: 0.3,
            pointRadius: 3,
            pointBackgroundColor: "#17a2b8",
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) =>
                ctx.raw != null
                  ? `Safety Rank: ${Number(ctx.raw).toFixed(0)}`
                  : "No data",
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
    });

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, [trendData]);

  if (!trendData || trendData.length === 0) {
    return null;
  }

  return (
    <div className="scorecard-chart-card">
      <h3>Safety Rank Trend</h3>
      <div style={{ height: 200 }}>
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
}
