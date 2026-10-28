import React, { useMemo } from "react";
import Plotly from "plotly.js-dist-min";
import createPlotlyComponent from "react-plotly.js/factory";
import {
  Activity,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  RotateCw,
  Sparkles,
  Info,
} from "lucide-react";
import { formatINR } from "../../utils/format";

const Plot = createPlotlyComponent(Plotly);

export default function MonteCarloFanChart({
  monteCarloResult,
  loading = false,
  onRerunSimulations,
  title = "Monte Carlo Stochastic Liquidity Fan Chart",
}) {
  const {
    breach_probability_pct = 0,
    simulations_count = 1000,
    projection_horizon = 90,
    minimum_cash_threshold = 750000,
    dates = [],
    percentiles = {},
    baseline_path = [],
    stressed_deterministic_path = [],
    ending_cash_stats = {},
    volatility_assumptions = {},
  } = monteCarloResult || {};

  const { p5 = [], p25 = [], p50 = [], p75 = [], p95 = [] } = percentiles;

  // Determine Risk Category based on breach probability
  const riskMeta = useMemo(() => {
    const prob = Number(breach_probability_pct);
    if (prob === 0) {
      return {
        level: "Zero Breach Risk",
        color: "text-emerald-400",
        bg: "bg-emerald-500/15 border-emerald-500/30",
        badge: "Solvent in 100% of Simulations",
        icon: ShieldCheck,
      };
    }
    if (prob <= 10) {
      return {
        level: "Low Risk (<10%)",
        color: "text-teal-400",
        bg: "bg-teal-500/15 border-teal-500/30",
        badge: "Minor tail risk detected",
        icon: ShieldCheck,
      };
    }
    if (prob <= 30) {
      return {
        level: "Moderate Risk (10-30%)",
        color: "text-amber-400",
        bg: "bg-amber-500/15 border-amber-500/30",
        badge: "Material solvency vulnerability",
        icon: AlertTriangle,
      };
    }
    if (prob <= 70) {
      return {
        level: "Elevated Risk (30-70%)",
        color: "text-orange-400",
        bg: "bg-orange-500/15 border-orange-500/30",
        badge: "High probability of liquidity strain",
        icon: ShieldAlert,
      };
    }
    return {
      level: "Imminent Breach (>70%)",
      color: "text-rose-400",
      bg: "bg-rose-500/20 border-rose-500/40",
      badge: "Severe insolvency risk",
      icon: ShieldAlert,
    };
  }, [breach_probability_pct]);

  // Build Plotly Traces
  const traces = useMemo(() => {
    if (!dates.length || !p5.length) return [];

    const thresholdLine = new Array(dates.length).fill(minimum_cash_threshold);

    return [
      // 1. Outer Upper Band (95th percentile)
      {
        x: dates,
        y: p95,
        type: "scatter",
        mode: "lines",
        line: { width: 0, color: "rgba(45, 212, 191, 0)" },
        hoverinfo: "skip",
        showlegend: false,
        name: "p95",
      },
      // 2. Outer Lower Band (5th percentile) filled up to 95th
      {
        x: dates,
        y: p5,
        type: "scatter",
        mode: "lines",
        fill: "tonexty",
        fillcolor: "rgba(20, 184, 166, 0.12)",
        line: { width: 0, color: "rgba(45, 212, 191, 0)" },
        name: "90% Fan Band (p5–p95)",
        hoverinfo: "y",
      },
      // 3. Inner Upper Band (75th percentile)
      {
        x: dates,
        y: p75,
        type: "scatter",
        mode: "lines",
        line: { width: 0, color: "rgba(45, 212, 191, 0)" },
        hoverinfo: "skip",
        showlegend: false,
        name: "p75",
      },
      // 4. Inner Lower Band (25th percentile) filled up to 75th
      {
        x: dates,
        y: p25,
        type: "scatter",
        mode: "lines",
        fill: "tonexty",
        fillcolor: "rgba(20, 184, 166, 0.28)",
        line: { width: 0, color: "rgba(45, 212, 191, 0)" },
        name: "50% Fan Band (p25–p75)",
        hoverinfo: "y",
      },
      // 5. Stochastic Median (50th percentile)
      {
        x: dates,
        y: p50,
        type: "scatter",
        mode: "lines",
        line: { color: "#2DD4BF", width: 2.5 },
        name: "Median Path (p50)",
      },
      // 6. Deterministic Stressed Path
      {
        x: dates,
        y: stressed_deterministic_path,
        type: "scatter",
        mode: "lines",
        line: { color: "#F43F5E", width: 2, dash: "dot" },
        name: "Deterministic Stressed",
      },
      // 7. Baseline Reference Path
      {
        x: dates,
        y: baseline_path,
        type: "scatter",
        mode: "lines",
        line: { color: "#38BDF8", width: 1.5, dash: "dash" },
        name: "Baseline Forecast",
      },
      // 8. Minimum Cash Threshold Line
      {
        x: dates,
        y: thresholdLine,
        type: "scatter",
        mode: "lines",
        line: { color: "#EF4444", width: 2, dash: "dash" },
        name: `Threshold (${formatINR(minimum_cash_threshold, true)})`,
      },
    ];
  }, [
    dates,
    p5,
    p25,
    p50,
    p75,
    p95,
    baseline_path,
    stressed_deterministic_path,
    minimum_cash_threshold,
  ]);

  if (loading && !monteCarloResult) {
    return (
      <div className="bg-navy-900/80 border border-navy-800 rounded-xl p-6 h-96 flex flex-col items-center justify-center animate-pulse">
        <Activity className="h-8 w-8 text-teal-400 animate-spin mb-2" />
        <p className="text-xs text-slate-400">
          Computing stochastic log-normal trajectories (1,000 paths)...
        </p>
      </div>
    );
  }

  const RiskIcon = riskMeta.icon;

  const layout = {
    autosize: true,
    height: 340,
    margin: { t: 20, r: 20, b: 40, l: 60 },
    paper_bgcolor: "transparent",
    plot_bgcolor: "transparent",
    showlegend: true,
    legend: {
      orientation: "h",
      x: 0,
      y: 1.15,
      font: { color: "#94A3B8", size: 10 },
    },
    xaxis: {
      color: "#64748B",
      gridcolor: "#1E293B",
      showgrid: false,
      tickfont: { size: 10, color: "#94A3B8" },
    },
    yaxis: {
      color: "#64748B",
      gridcolor: "#1E293B",
      tickfont: { size: 10, color: "#94A3B8", family: "monospace" },
      tickprefix: "₹",
      separatethousands: true,
    },
    hovermode: "x unified",
  };

  const config = {
    responsive: true,
    displayModeBar: false,
  };

  return (
    <div className="bg-navy-900/80 border border-navy-800 rounded-xl p-5 space-y-5 shadow-2xl backdrop-blur-md">
      {/* Header and Breach Probability Big Number */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-navy-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-teal-500/10 border border-teal-500/20 text-teal-400">
              <Activity className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide">{title}</h3>
              <p className="text-[10px] text-slate-400 font-mono">
                {simulations_count.toLocaleString()} Log-Normal Iterations • Log-Normal Volatility Calibration
              </p>
            </div>
          </div>
        </div>

        {/* Simulation Count Quick Switch */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-400">Simulations:</span>
          {[500, 1000].map((simCount) => (
            <button
              key={simCount}
              type="button"
              onClick={() => onRerunSimulations && onRerunSimulations(simCount)}
              className={`px-2.5 py-1 rounded text-xs font-mono font-semibold border transition ${
                simulations_count === simCount
                  ? "bg-teal-500/20 text-teal-300 border-teal-500/40"
                  : "bg-navy-950 text-slate-400 border-navy-800 hover:text-white"
              }`}
            >
              {simCount}
            </button>
          ))}
          <button
            type="button"
            onClick={() => onRerunSimulations && onRerunSimulations(simulations_count)}
            className="p-1 rounded bg-navy-850 hover:bg-navy-800 text-slate-300 hover:text-white border border-navy-700 transition"
            title="Re-run Simulation"
          >
            <RotateCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-teal-400" : ""}`} />
          </button>
        </div>
      </div>

      {/* KPI Cards: BIG NUMBER for Breach Probability */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* BIG NUMBER CARD: Probability of Breaching Threshold */}
        <div
          className={`p-4 rounded-xl border flex flex-col justify-between ${riskMeta.bg}`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
              Threshold Breach Probability
            </span>
            <RiskIcon className={`h-5 w-5 ${riskMeta.color}`} />
          </div>

          <div className="my-2">
            <div className={`text-4xl font-black font-mono tracking-tight ${riskMeta.color}`}>
              {Number(breach_probability_pct).toFixed(1)}%
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px]">
            <span className={`font-semibold ${riskMeta.color}`}>
              {riskMeta.level}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              Threshold: {formatINR(minimum_cash_threshold, true)}
            </span>
          </div>
        </div>

        {/* 5th Percentile Worst Case Cash */}
        <div className="p-4 rounded-xl bg-navy-950/70 border border-navy-800 flex flex-col justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            5th Percentile (Worst 5% Tail)
          </span>
          <div className="my-2 text-2xl font-bold font-mono text-rose-400">
            {formatINR(ending_cash_stats.p5)}
          </div>
          <span className="text-[10px] text-slate-500">
            Closing balance under 95% severe adverse variance
          </span>
        </div>

        {/* 50th Percentile Median Cash */}
        <div className="p-4 rounded-xl bg-navy-950/70 border border-navy-800 flex flex-col justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            50th Percentile (Stochastic Median)
          </span>
          <div className="my-2 text-2xl font-bold font-mono text-teal-400">
            {formatINR(ending_cash_stats.median)}
          </div>
          <span className="text-[10px] text-slate-500">
            Expected balance across all stochastic iterations
          </span>
        </div>

        {/* 95th Percentile Best Case Cash */}
        <div className="p-4 rounded-xl bg-navy-950/70 border border-navy-800 flex flex-col justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            95th Percentile (Upper 5% Tail)
          </span>
          <div className="my-2 text-2xl font-bold font-mono text-emerald-400">
            {formatINR(ending_cash_stats.p95)}
          </div>
          <span className="text-[10px] text-slate-500">
            Favorable collection & reduced expenditure realization
          </span>
        </div>
      </div>

      {/* Plotly Canvas */}
      <div className="w-full rounded-xl bg-navy-950/40 p-2 border border-navy-800/80">
        <Plot data={traces} layout={layout} config={config} style={{ width: "100%" }} />
      </div>

      {/* Volatility Assumption Footer */}
      <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 px-1 pt-1 border-t border-navy-800">
        <div className="flex items-center gap-1.5">
          <Info className="h-3.5 w-3.5 text-teal-400" />
          <span>
            Calibrated Inflow Volatility (σ): <strong>25.0%</strong> | Outflow Volatility (σ): <strong>15.0%</strong>
          </span>
        </div>
        <span className="font-mono text-slate-500">
          Distribution: Geometric Brownian Log-Normal Multiplier
        </span>
      </div>
    </div>
  );
}
