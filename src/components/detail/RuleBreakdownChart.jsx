import { useRef, useEffect } from "react";
import {
  Chart,
  BarElement,
  BarController,
  CategoryScale,
  LinearScale,
  Tooltip,
} from "chart.js";

Chart.register(BarElement, BarController, CategoryScale, LinearScale, Tooltip);

export default function RuleBreakdownChart({
  ruleScores,
  eventCounts,
  ruleColumns,
}) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    if (chartRef.current) chartRef.current.destroy();

    const labels = ruleColumns.map((rc) =>
      rc.name.length > 25 ? rc.name.slice(0, 23) + "…" : rc.name
    );
    const data = ruleColumns.map((rc) => ruleScores[rc.id] ?? 0);
    const colors = ruleColumns.map((rc) => rc.color);

    chartRef.current = new Chart(canvasRef.current, {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            data,
            backgroundColor: colors.map((c) => c + "cc"),
            borderColor: colors,
            borderWidth: 1,
            borderRadius: 4,
          },
        ],
      },
      options: {
        indexAxis: "y",
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const rc = ruleColumns[ctx.dataIndex];
                const count = eventCounts[rc.id] || 0;
                return `Score: ${ctx.raw.toFixed(1)} (${count} events)`;
              },
            },
          },
        },
        scales: {
          x: {
            min: 0,
            max: 100,
            ticks: { font: { size: 11 } },
            grid: { color: "#f0f0f0" },
          },
          y: {
            ticks: { font: { size: 11 } },
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
  }, [ruleScores, eventCounts, ruleColumns]);

  const height = Math.max(120, ruleColumns.length * 32 + 40);

  return (
    <div style={{ height }}>
      <canvas ref={canvasRef} />
    </div>
  );
}
