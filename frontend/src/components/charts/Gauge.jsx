import React from "react";
import Plotly from "plotly.js-dist-min";
import createPlotlyComponent from "react-plotly.js/factory";
import { Gauge as GaugeIcon } from "lucide-react";

const Plot = createPlotlyComponent(Plotly);

export default function Gauge({
  value = 10.78,
  minThreshold = 750000.0,
  title = "Liquidity Buffer Multiplier",
  subtitle = "Current Cash / Policy Minimum Threshold"
}) {
  const numVal = Number(value) || 0;

  // Determine status color & text
  const isCritical = numVal < 1.0;
  const isWarning = numVal >= 1.0 && numVal < 1.5;
  const statusLabel = isCritical ? "Critical Deficit" : isWarning ? "Warning Buffer" : "Optimal Reserve";
  const statusColor = isCritical ? "#F43F5E" : isWarning ? "#F59E0B" : "#D97706";

  const data = [
    {
      type: "indicator",
      mode: "gauge+number",
      value: numVal,
      number: {
        suffix: "x",
        font: { size: 28, color: "#FFFFFF", family: "Inter, sans-serif" },
      },
      title: {
        text: `<b>${statusLabel}</b><br><span style="font-size:11px;color:#94A3B8">Target: ≥ 1.50x</span>`,
        font: { size: 13, color: statusColor, family: "Inter, sans-serif" },
      },
      gauge: {
        axis: {
          range: [0, 15],
          tickwidth: 1,
          tickcolor: "#334155",
          tickfont: { size: 10, color: "#94A3B8", family: "Inter, sans-serif" },
          tickmode: "linear",
          tick0: 0,
          dtick: 3,
        },
        bar: { color: statusColor, thickness: 0.28 },
        bgcolor: "#08090D",
        borderwidth: 1,
        bordercolor: "#212635",
        steps: [
          { range: [0, 1.0], color: "rgba(244, 63, 94, 0.25)" },      // Critical (Red)
          { range: [1.0, 1.5], color: "rgba(245, 158, 11, 0.25)" },    // Warning (Amber)
          { range: [1.5, 15.0], color: "rgba(217, 119, 6, 0.25)" },   // Safe (Champagne Gold)
        ],
        threshold: {
          line: { color: "#F43F5E", width: 3 },
          thickness: 0.8,
          value: 1.0, // Minimum reserve threshold is 1.0x
        },
      },
    },
  ];

  const layout = {
    autosize: true,
    height: 220,
    margin: { t: 30, r: 25, l: 25, b: 15 },
    paper_bgcolor: "transparent",
    plot_bgcolor: "transparent",
    font: { color: "#F8FAFC", family: "Inter, sans-serif" },
  };

  const config = {
    responsive: true,
    displayModeBar: false,
  };

  return (
    <div className="bg-navy-900/70 border border-navy-800 rounded-xl p-5 space-y-2 flex flex-col justify-between">
      <div className="flex items-center justify-between border-b border-navy-800 pb-3">
        <div className="flex items-center gap-2">
          <GaugeIcon className="h-4 w-4 text-teal-400" />
          <h3 className="text-sm font-semibold text-white">{title}</h3>
        </div>
        <span
          className="text-[11px] font-mono px-2 py-0.5 rounded-full border font-semibold"
          style={{
            backgroundColor: `${statusColor}15`,
            borderColor: `${statusColor}40`,
            color: statusColor,
          }}
        >
          {numVal.toFixed(2)}x
        </span>
      </div>

      <div className="w-full flex items-center justify-center">
        <Plot data={data} layout={layout} config={config} style={{ width: "100%", height: "220px" }} />
      </div>

      <div className="pt-2 border-t border-navy-800 flex items-center justify-between text-[11px] text-slate-400">
        <span>Policy Min: ₹{(minThreshold / 1e5).toFixed(2)}L</span>
        <span className="text-slate-500">{subtitle}</span>
      </div>
    </div>
  );
}
