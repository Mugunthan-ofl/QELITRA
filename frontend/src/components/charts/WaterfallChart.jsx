import React from "react";
import Plotly from "plotly.js-dist-min";
import createPlotlyComponent from "react-plotly.js/factory";
import { BarChart3, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { formatINR } from "../../utils/format";

const Plot = createPlotlyComponent(Plotly);

/**
 * Plotly Waterfall chart of cash movement:
 * Opening balance -> Inflows by category -> Outflows by category -> Closing balance
 */
export default function WaterfallChart({
  waterfallData = null,
  loading = false,
  title = "Cash Movement Waterfall Bridge",
  subtitle = "Reconciles opening cash reserve to closing balance across category flows"
}) {
  if (loading) {
    return (
      <div className="bg-navy-900/70 border border-navy-800 rounded-xl p-5 h-96 flex items-center justify-center animate-pulse">
        <div className="flex flex-col items-center gap-2 text-slate-500">
          <BarChart3 className="h-8 w-8 text-teal-500/50 animate-bounce" />
          <p className="text-xs">Computing cash bridge reconciliation...</p>
        </div>
      </div>
    );
  }

  const items = waterfallData?.items || [];
  const summary = waterfallData?.summary || {};

  if (!items || items.length === 0) {
    return (
      <div className="bg-navy-900/70 border border-navy-800 rounded-xl p-5 h-96 flex items-center justify-center">
        <p className="text-sm text-slate-500">No cash flow movements recorded for the selected range.</p>
      </div>
    );
  }

  // Build Plotly Waterfall trace arrays
  const xLabels = items.map((it) => it.label);
  const yValues = items.map((it) => it.amount);
  const measures = items.map((it) => it.measure); // 'absolute', 'relative', 'total'
  const textStrings = items.map((it) => {
    const val = it.raw_amount !== undefined ? it.raw_amount : Math.abs(it.amount);
    return formatINR(val, true);
  });

  const trace = {
    type: "waterfall",
    orientation: "v",
    measure: measures,
    x: xLabels,
    y: yValues,
    text: textStrings,
    textposition: "outside",
    textfont: {
      family: "Inter, sans-serif",
      size: 10,
      color: "#94A3B8"
    },
    connector: {
      line: {
        color: "rgba(148, 163, 184, 0.25)",
        width: 1,
        dash: "dot"
      }
    },
    decreasing: {
      marker: {
        color: "#F43F5E", // Rose for outflows
        line: { color: "#E11D48", width: 1 }
      }
    },
    increasing: {
      marker: {
        color: "#10B981", // Emerald for positive inflows
        line: { color: "#059669", width: 1 }
      }
    },
    totals: {
      marker: {
        color: "#F59E0B", // Champagne Gold for opening / closing totals
        line: { color: "#D97706", width: 1 }
      }
    },
    hoverinfo: "x+y+text",
    hovertemplate: "<b>%{x}</b><br>Amount: ₹%{y:,.2f}<extra></extra>"
  };

  const layout = {
    autosize: true,
    height: 380,
    margin: { l: 60, r: 25, t: 30, b: 85 },
    paper_bgcolor: "transparent",
    plot_bgcolor: "transparent",
    font: {
      family: "Inter, sans-serif",
      color: "#94A3B8"
    },
    xaxis: {
      type: "category",
      tickangle: -30,
      tickfont: { size: 10, color: "#94A3B8" },
      gridcolor: "rgba(255, 255, 255, 0.04)"
    },
    yaxis: {
      title: { text: "Cash Movement (INR)", font: { size: 11, color: "#64748B" } },
      tickprefix: "₹",
      tickfont: { size: 10, color: "#94A3B8" },
      gridcolor: "rgba(255, 255, 255, 0.06)",
      zerolinecolor: "rgba(255, 255, 255, 0.15)"
    },
    showlegend: false
  };

  const config = {
    responsive: true,
    displayModeBar: false
  };

  return (
    <div className="bg-navy-900/70 border border-navy-800 rounded-xl p-5 space-y-4 backdrop-blur-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-navy-800/80 gap-2">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-teal-400" />
            <h3 className="text-sm font-semibold text-white tracking-wide">{title}</h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
        </div>

        {/* Quick Summary Badges */}
        <div className="flex flex-wrap items-center gap-2 text-[11px]">
          <div className="px-2.5 py-1 rounded bg-blue-500/10 border border-blue-500/20 text-blue-400 font-mono">
            Open: {formatINR(summary.opening_cash_inr, true)}
          </div>
          <div className="px-2.5 py-1 rounded bg-teal-500/10 border border-teal-500/20 text-teal-400 font-mono">
            +Inflows: {formatINR(summary.total_inflows_inr, true)}
          </div>
          <div className="px-2.5 py-1 rounded bg-rose-500/10 border border-rose-500/20 text-rose-400 font-mono">
            -Outflows: {formatINR(summary.total_outflows_inr, true)}
          </div>
          <div className="px-2.5 py-1 rounded bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 font-mono font-semibold">
            Close: {formatINR(summary.closing_cash_inr, true)}
          </div>
        </div>
      </div>

      <div className="w-full">
        <Plot
          data={[trace]}
          layout={layout}
          config={config}
          style={{ width: "100%", height: "100%" }}
          useResizeHandler={true}
        />
      </div>
    </div>
  );
}
