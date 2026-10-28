import React, { useState } from "react";
import Plotly from "plotly.js-dist-min";
import createPlotlyComponent from "react-plotly.js/factory";
import { PieChart, BarChart2, Layers } from "lucide-react";
import { formatINR, formatPercent } from "../../utils/format";

const Plot = createPlotlyComponent(Plotly);

/**
 * Category Breakdown Chart:
 * Offers Treemap, Stacked Bar, and Horizontal Bar visualization of cash inflows and outflows by category.
 */
export default function CategoryBreakdownChart({
  categoryData = [],
  loading = false,
  title = "Inflows & Outflows by Category",
  subtitle = "Category composition, relative volume share, and count breakdown"
}) {
  const [viewMode, setViewMode] = useState("stacked"); // "stacked" | "treemap" | "bar"

  if (loading) {
    return (
      <div className="bg-navy-900/70 border border-navy-800 rounded-xl p-5 h-96 flex items-center justify-center animate-pulse">
        <div className="flex flex-col items-center gap-2 text-slate-500">
          <Layers className="h-8 w-8 text-teal-500/50 animate-bounce" />
          <p className="text-xs">Aggregating category composition...</p>
        </div>
      </div>
    );
  }

  const inflows = categoryData.filter((c) => c.transaction_type === "inflow");
  const outflows = categoryData.filter((c) => c.transaction_type === "outflow");

  const totalInflow = inflows.reduce((acc, c) => acc + c.total_amount_inr, 0);
  const totalOutflow = outflows.reduce((acc, c) => acc + c.total_amount_inr, 0);
  const totalFlow = totalInflow + totalOutflow;

  // Palettes for categories
  const inflowPalette = ["#F59E0B", "#D97706", "#B45309", "#FBBF24", "#FDE68A", "#92400E"];
  const outflowPalette = ["#F43F5E", "#E11D48", "#BE123C", "#FB7185", "#EA580C", "#C2410C", "#EC4899", "#8B5CF6"];

  // 1. Treemap Trace with single root for valid d3-hierarchy
  const labels = [
    "Total Cash Flow",
    "Cash Inflows",
    ...inflows.map((i) => i.category),
    "Cash Outflows",
    ...outflows.map((o) => o.category)
  ];
  const parents = [
    "",
    "Total Cash Flow",
    ...inflows.map(() => "Cash Inflows"),
    "Total Cash Flow",
    ...outflows.map(() => "Cash Outflows")
  ];
  const values = [
    totalFlow,
    totalInflow,
    ...inflows.map((i) => i.total_amount_inr),
    totalOutflow,
    ...outflows.map((o) => o.total_amount_inr)
  ];
  const colors = [
    "#08090D",
    "#B45309",
    ...inflows.map((_, idx) => inflowPalette[idx % inflowPalette.length]),
    "#9F1239",
    ...outflows.map((_, idx) => outflowPalette[idx % outflowPalette.length])
  ];

  const treemapTrace = {
    type: "treemap",
    labels: labels,
    parents: parents,
    values: values,
    marker: {
      colors: colors,
      pad: { t: 25, l: 5, r: 5, b: 5 }
    },
    textinfo: "label+value+percent parent",
    texttemplate: "<b>%{label}</b><br>₹%{value:,.0f}<br>(%{percentParent:.1%})",
    hoverinfo: "label+value+percent parent",
    hovertemplate: "<b>%{label}</b><br>Amount: ₹%{value:,.2f}<br>Share: %{percentParent:.1%}<extra></extra>",
    textfont: {
      family: "Inter, sans-serif",
      size: 11,
      color: "#FFFFFF"
    }
  };

  // 2. Stacked Bar Traces (Inflows & Outflows stacked by category)
  const stackedTraces = [
    ...inflows.map((item, idx) => ({
      type: "bar",
      name: `${item.category} (Inflow)`,
      x: ["Cash Inflows"],
      y: [item.total_amount_inr],
      text: formatINR(item.total_amount_inr, true),
      textposition: "inside",
      insidetextanchor: "middle",
      showlegend: false,
      marker: { color: inflowPalette[idx % inflowPalette.length] },
      hovertemplate: `<b>${item.category}</b> (Inflow)<br>Amount: ₹%{y:,.2f}<br>Share: ${item.share_pct}%<extra></extra>`,
      textfont: { family: "Inter, sans-serif", size: 10, color: "#FFFFFF" }
    })),
    ...outflows.map((item, idx) => ({
      type: "bar",
      name: `${item.category} (Outflow)`,
      x: ["Cash Outflows"],
      y: [item.total_amount_inr],
      text: formatINR(item.total_amount_inr, true),
      textposition: "inside",
      insidetextanchor: "middle",
      showlegend: false,
      marker: { color: outflowPalette[idx % outflowPalette.length] },
      hovertemplate: `<b>${item.category}</b> (Outflow)<br>Amount: ₹%{y:,.2f}<br>Share: ${item.share_pct}%<extra></extra>`,
      textfont: { family: "Inter, sans-serif", size: 10, color: "#FFFFFF" }
    }))
  ];

  // 3. Horizontal Comparative Bar Traces
  const barTraceInflow = {
    type: "bar",
    name: "Inflow",
    orientation: "h",
    y: inflows.map((i) => i.category).reverse(),
    x: inflows.map((i) => i.total_amount_inr).reverse(),
    marker: { color: "#F59E0B" },
    text: inflows.map((i) => formatINR(i.total_amount_inr, true)).reverse(),
    textposition: "auto",
    hoverinfo: "x+y",
    hovertemplate: "<b>%{y}</b><br>Inflow: ₹%{x:,.2f}<extra></extra>"
  };

  const barTraceOutflow = {
    type: "bar",
    name: "Outflow",
    orientation: "h",
    y: outflows.map((o) => o.category).reverse(),
    x: outflows.map((o) => o.total_amount_inr).reverse(),
    marker: { color: "#F43F5E" },
    text: outflows.map((o) => formatINR(o.total_amount_inr, true)).reverse(),
    textposition: "auto",
    hoverinfo: "x+y",
    hovertemplate: "<b>%{y}</b><br>Outflow: ₹%{x:,.2f}<extra></extra>"
  };

  const layout = {
    autosize: true,
    height: 380,
    margin: {
      l: viewMode === "treemap" ? 10 : (viewMode === "bar" ? 120 : 60),
      r: 20,
      t: 20,
      b: viewMode === "stacked" ? 40 : 35
    },
    paper_bgcolor: "transparent",
    plot_bgcolor: "transparent",
    font: {
      family: "Inter, sans-serif",
      color: "#94A3B8"
    },
    barmode: viewMode === "stacked" ? "stack" : "group",
    xaxis: viewMode === "treemap" ? undefined : {
      type: "category",
      tickfont: { size: 11, color: "#E2E8F0" },
      gridcolor: "rgba(255, 255, 255, 0.06)",
      ...(viewMode === "bar" ? { tickprefix: "₹", type: "linear" } : {})
    },
    yaxis: viewMode === "treemap" ? undefined : {
      tickfont: { size: 10, color: "#94A3B8" },
      automargin: true,
      gridcolor: "rgba(255, 255, 255, 0.06)",
      ...(viewMode === "stacked" ? { tickprefix: "₹" } : {})
    },
    showlegend: viewMode === "bar",
    legend: {
      orientation: "h",
      x: 0,
      y: 1.15,
      font: { color: "#94A3B8", size: 10 }
    }
  };

  const config = {
    responsive: true,
    displayModeBar: false
  };

  let chartTraces = [treemapTrace];
  if (viewMode === "stacked") {
    chartTraces = stackedTraces;
  } else if (viewMode === "bar") {
    chartTraces = [barTraceInflow, barTraceOutflow];
  }

  return (
    <div className="bg-navy-900/70 border border-navy-800 rounded-xl p-5 space-y-4 backdrop-blur-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-navy-800/80 gap-2">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-amber-400" />
            <h3 className="text-sm font-semibold text-white tracking-wide">{title}</h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 bg-navy-950 p-1 rounded-lg border border-navy-800">
          <button
            onClick={() => setViewMode("stacked")}
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              viewMode === "stacked" ? "bg-amber-500 text-navy-950 font-semibold" : "text-slate-400 hover:text-white"
            }`}
          >
            <Layers className="h-3 w-3" />
            <span>Stacked Bar</span>
          </button>
          <button
            onClick={() => setViewMode("treemap")}
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              viewMode === "treemap" ? "bg-amber-500 text-navy-950 font-semibold" : "text-slate-400 hover:text-white"
            }`}
          >
            <PieChart className="h-3 w-3" />
            <span>Treemap</span>
          </button>
          <button
            onClick={() => setViewMode("bar")}
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              viewMode === "bar" ? "bg-amber-500 text-navy-950 font-semibold" : "text-slate-400 hover:text-white"
            }`}
          >
            <BarChart2 className="h-3 w-3" />
            <span>Horizontal</span>
          </button>
        </div>
      </div>

      <div className="w-full">
        <Plot
          key={viewMode}
          data={chartTraces}
          layout={layout}
          config={config}
          style={{ width: "100%", height: "100%" }}
          useResizeHandler={true}
        />
      </div>
    </div>
  );
}
