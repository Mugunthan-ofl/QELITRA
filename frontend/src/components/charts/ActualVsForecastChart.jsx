import React, { useState, useMemo } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  ReferenceArea,
  CartesianGrid
} from "recharts";
import { TrendingUp, ShieldAlert, Calendar, Sparkles } from "lucide-react";
import { formatINR, formatDate } from "../../utils/format";

export default function ActualVsForecastChart({
  data = [],
  metadata = {},
  loading = false,
  minThreshold = 750000,
  title = "Actual Cash vs. 90-Day Forward Forecast",
  subtitle = "Continuous liquidity trajectory connecting 2025 audited actuals with 2026 Q1 forecast"
}) {
  const [zoomRange, setZoomRange] = useState("full"); // "full" | "h2_forecast" | "forecast_only"

  // Filter data according to selected zoom range
  const filteredSeries = useMemo(() => {
    if (!data || data.length === 0) return [];
    if (zoomRange === "forecast_only") {
      return data.filter((d) => d.is_forecast || d.date === metadata.historical_end_date);
    }
    if (zoomRange === "h2_forecast") {
      return data.filter((d) => d.date >= "2025-07-01");
    }
    return data;
  }, [data, zoomRange, metadata.historical_end_date]);

  if (loading) {
    return (
      <div className="bg-navy-900/70 border border-navy-800 rounded-xl p-5 h-96 flex items-center justify-center animate-pulse">
        <div className="flex flex-col items-center gap-2 text-slate-500">
          <TrendingUp className="h-8 w-8 text-teal-500/50 animate-bounce" />
          <p className="text-xs">Projecting 90-day cash flow trajectories...</p>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-navy-900/70 border border-navy-800 rounded-xl p-5 h-96 flex items-center justify-center">
        <p className="text-sm text-slate-500">No trajectory data available.</p>
      </div>
    );
  }

  // Calculate high-level summary metrics
  const lastActual = data.find((d) => d.date === metadata.historical_end_date);
  const finalForecast = data[data.length - 1];

  const actualClosing = lastActual?.actual_cash_inr || 0;
  const projectedClosing = finalForecast?.forecast_cash_inr || 0;
  const projectedChange = projectedClosing - actualClosing;
  const isSurplus = projectedClosing >= minThreshold;

  // Custom rich Tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null;
    const pt = payload[0].payload;
    const isFc = pt.is_forecast;

    return (
      <div className="bg-navy-950/95 border border-navy-700 p-3 rounded-lg shadow-2xl backdrop-blur-md text-xs space-y-1.5 min-w-[200px]">
        <div className="flex items-center justify-between border-b border-navy-800 pb-1">
          <span className="font-mono text-slate-300">{formatDate(label)}</span>
          <span
            className={`px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase ${
              isFc
                ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                : "bg-amber-500/20 text-amber-300 border border-amber-500/40"
            }`}
          >
            {isFc ? "90d Forecast" : "Audited Actual"}
          </span>
        </div>

        <div className="space-y-1 pt-1">
          {pt.actual_cash_inr !== null && pt.actual_cash_inr !== undefined && (
            <div className="flex justify-between items-center text-slate-300">
              <span className="text-amber-400 font-medium">Actual Cash:</span>
              <span className="font-mono font-semibold">{formatINR(pt.actual_cash_inr)}</span>
            </div>
          )}

          {pt.forecast_cash_inr !== null && pt.forecast_cash_inr !== undefined && (
            <div className="flex justify-between items-center text-slate-300">
              <span className="text-amber-400 font-medium">Forecast Cash:</span>
              <span className="font-mono font-semibold">{formatINR(pt.forecast_cash_inr)}</span>
            </div>
          )}

          <div className="flex justify-between items-center text-slate-400 text-[11px]">
            <span>Daily Inflow:</span>
            <span className="font-mono text-emerald-400">+{formatINR(pt.inflow_inr)}</span>
          </div>

          <div className="flex justify-between items-center text-slate-400 text-[11px]">
            <span>Daily Outflow:</span>
            <span className="font-mono text-rose-400">-{formatINR(pt.outflow_inr)}</span>
          </div>

          <div className="flex justify-between items-center text-slate-400 text-[11px] border-t border-navy-800 pt-1">
            <span>Policy Reserve:</span>
            <span className="font-mono text-rose-400">{formatINR(minThreshold)}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-navy-900/70 border border-navy-800 rounded-xl p-5 space-y-4 backdrop-blur-sm">
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-3 border-b border-navy-800/80 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-teal-400" />
            <h3 className="text-sm font-semibold text-white tracking-wide">{title}</h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
        </div>

        {/* Zoom Presets & Metrics */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Zoom Buttons */}
          <div className="flex items-center bg-navy-950 p-1 rounded-lg border border-navy-800 text-xs">
            <button
              onClick={() => setZoomRange("full")}
              className={`px-2.5 py-1 rounded transition-colors ${
                zoomRange === "full" ? "bg-teal-500 text-navy-950 font-semibold" : "text-slate-400 hover:text-white"
              }`}
            >
              Full (365d + 90d)
            </button>
            <button
              onClick={() => setZoomRange("h2_forecast")}
              className={`px-2.5 py-1 rounded transition-colors ${
                zoomRange === "h2_forecast" ? "bg-teal-500 text-navy-950 font-semibold" : "text-slate-400 hover:text-white"
              }`}
            >
              H2 + Forecast
            </button>
            <button
              onClick={() => setZoomRange("forecast_only")}
              className={`px-2.5 py-1 rounded transition-colors ${
                zoomRange === "forecast_only" ? "bg-teal-500 text-navy-950 font-semibold" : "text-slate-400 hover:text-white"
              }`}
            >
              Forecast Only (90d)
            </button>
          </div>

          {/* Forecast Outcome Badge */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-lg bg-navy-950 border border-navy-800 text-xs">
            <span className="text-slate-400">Day 90 Projected:</span>
            <span className="font-mono font-bold text-amber-300">{formatINR(projectedClosing, true)}</span>
            <span className={`text-[10px] font-mono ${projectedChange >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
              ({projectedChange >= 0 ? "+" : ""}{formatINR(projectedChange, true)})
            </span>
          </div>
        </div>
      </div>

      {/* Main Chart */}
      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={filteredSeries} margin={{ top: 15, right: 25, left: 20, bottom: 25 }}>
            <defs>
              <linearGradient id="actualAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="forecastAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#D97706" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#D97706" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#212635" vertical={false} />

            <XAxis
              dataKey="date"
              stroke="#64748B"
              fontSize={10}
              tickLine={false}
              tickFormatter={(v) => {
                if (!v) return "";
                const parts = v.split("-");
                return `${parts[1]}/${parts[2]}`;
              }}
              minTickGap={28}
            />

            <YAxis
              stroke="#64748B"
              fontSize={10}
              tickLine={false}
              tickFormatter={(v) => formatINR(v, true)}
              domain={["auto", "auto"]}
            />

            <Tooltip content={<CustomTooltip />} />

            {/* Shaded Forecast Horizon Background */}
            <ReferenceArea
              x1="2026-01-01"
              x2="2026-03-31"
              fill="#F59E0B"
              fillOpacity={0.06}
              stroke="#F59E0B"
              strokeDasharray="3 3"
              label={{
                value: "90-Day Forecast Horizon (Shaded)",
                fill: "#F59E0B",
                position: "insideTopLeft",
                fontSize: 10,
                fontWeight: 600
              }}
            />

            {/* Minimum Cash Threshold Policy Line */}
            <ReferenceLine
              y={minThreshold}
              stroke="#F43F5E"
              strokeDasharray="4 4"
              strokeWidth={1.5}
              label={{
                value: `Policy Reserve: ${formatINR(minThreshold, true)}`,
                fill: "#F43F5E",
                position: "insideBottomRight",
                fontSize: 10
              }}
            />

            {/* Actual Cash Area & Line */}
            <Area
              type="monotone"
              dataKey="actual_cash_inr"
              stroke="#F59E0B"
              strokeWidth={2.4}
              fillOpacity={1}
              fill="url(#actualAreaGrad)"
              name="Actual Cash"
              connectNulls={false}
            />

            {/* Forecast Cash Area & Line */}
            <Area
              type="monotone"
              dataKey="forecast_cash_inr"
              stroke="#F59E0B"
              strokeWidth={2.4}
              strokeDasharray="4 4"
              fillOpacity={1}
              fill="url(#forecastAreaGrad)"
              name="90d Forward Forecast"
              connectNulls={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Legend & Period Indicator Strip */}
      <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 pt-2 border-t border-navy-800/60">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-amber-500"></span>
            <span>2025 Actuals</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 border-t-2 border-dashed border-amber-300"></span>
            <span>90-Day Forward Forecast</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 border-t-2 border-dashed border-rose-500"></span>
            <span>Policy Reserve Threshold (₹7.5L)</span>
          </div>
        </div>

        <div className="flex items-center gap-2 font-mono text-[11px]">
          <span className="text-slate-500">Transition Date:</span>
          <span className="text-slate-300 font-semibold">{metadata.historical_end_date || "2025-12-31"}</span>
        </div>
      </div>
    </div>
  );
}
