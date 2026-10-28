import React, { useState, useMemo } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ReferenceDot,
} from "recharts";
import { TrendingDown, AlertOctagon, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { formatINR, formatDate } from "../../utils/format";

function CustomStressTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    const item = payload[0].payload;
    const isBreached = item.stressedCash < item.threshold;
    const isFirstBreach = item.isBreachPoint;

    return (
      <div className="bg-navy-950/95 border border-navy-700 p-3.5 rounded-xl shadow-2xl backdrop-blur-md text-xs space-y-2 min-w-[220px]">
        <div className="flex items-center justify-between border-b border-navy-800 pb-1.5 font-mono">
          <span className="font-bold text-white">Day {item.day}</span>
          <span className="text-slate-400">{formatDate(item.date)}</span>
        </div>

        {isFirstBreach && (
          <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-rose-500/20 border border-rose-500/40 text-rose-300 font-semibold text-[11px]">
            <AlertOctagon className="h-3.5 w-3.5 shrink-0 text-rose-400" />
            <span>FIRST BREACH POINT</span>
          </div>
        )}

        <div className="space-y-1">
          <div className="flex justify-between items-center text-teal-400 font-mono">
            <span>Baseline Cash:</span>
            <span className="font-semibold">{formatINR(item.baselineCash)}</span>
          </div>

          <div className={`flex justify-between items-center font-mono ${isBreached ? "text-rose-400" : "text-amber-400"}`}>
            <span>Stressed Cash:</span>
            <span className="font-bold">{formatINR(item.stressedCash)}</span>
          </div>

          <div className="flex justify-between items-center text-slate-400 text-[11px] font-mono pt-1 border-t border-navy-800/80">
            <span>Reserve Threshold:</span>
            <span>{formatINR(item.threshold)}</span>
          </div>

          <div className="flex justify-between items-center text-[11px] font-mono">
            <span>Liquidity Cushion:</span>
            <span className={item.stressedCash >= item.threshold ? "text-emerald-400" : "text-rose-400"}>
              {item.stressedCash >= item.threshold
                ? `+${formatINR(item.stressedCash - item.threshold)}`
                : `${formatINR(item.stressedCash - item.threshold)}`}
            </span>
          </div>
        </div>
      </div>
    );
  }
  return null;
}

export default function StressLineChart({
  baselineSeries = [],
  stressedSeries = [],
  breachDate = null,
  breachDay = null,
  minThreshold = 750000,
  title = "Baseline vs. Stressed Cash Trajectory",
}) {
  const [showBaseline, setShowBaseline] = useState(true);
  const [showStressed, setShowStressed] = useState(true);
  const [showThreshold, setShowThreshold] = useState(true);

  // Merge the daily series
  const chartData = useMemo(() => {
    if (!stressedSeries || stressedSeries.length === 0) return [];
    return stressedSeries.map((st, i) => {
      const base = baselineSeries[i] || {};
      const isBreachPoint = breachDate && st.date === breachDate;
      return {
        date: st.date,
        day: st.day,
        baselineCash: base.cash ?? null,
        stressedCash: st.cash,
        threshold: minThreshold,
        isBreachPoint: isBreachPoint,
      };
    });
  }, [baselineSeries, stressedSeries, breachDate, minThreshold]);

  // Find exact breach point object for reference dot marker
  const breachPoint = useMemo(() => {
    if (!breachDate || !chartData.length) return null;
    return chartData.find((d) => d.date === breachDate) || null;
  }, [breachDate, chartData]);

  if (!chartData || chartData.length === 0) {
    return (
      <div className="bg-navy-900/80 border border-navy-800 rounded-xl p-6 h-80 flex items-center justify-center text-slate-500 text-xs">
        No simulation projection data available.
      </div>
    );
  }

  return (
    <div className="bg-navy-900/80 border border-navy-800 rounded-xl p-5 space-y-4 shadow-xl backdrop-blur-md">
      {/* Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-navy-800/80 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded bg-teal-500/10 text-teal-400">
            <TrendingDown className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide">{title}</h3>
            <p className="text-[10px] text-slate-400 font-mono">
              Daily closing cash trajectory comparison with solvency reserve line
            </p>
          </div>
        </div>

        {/* Legend / Series Toggles */}
        <div className="flex items-center gap-1.5 text-xs">
          <button
            type="button"
            onClick={() => setShowBaseline(!showBaseline)}
            className={`px-2.5 py-1 rounded text-[11px] font-medium border transition flex items-center gap-1.5 ${
              showBaseline
                ? "bg-teal-500/15 text-teal-300 border-teal-500/30"
                : "bg-navy-950 text-slate-500 border-navy-800 line-through"
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-teal-400" />
            Baseline Case
          </button>

          <button
            type="button"
            onClick={() => setShowStressed(!showStressed)}
            className={`px-2.5 py-1 rounded text-[11px] font-medium border transition flex items-center gap-1.5 ${
              showStressed
                ? "bg-rose-500/15 text-rose-300 border-rose-500/30"
                : "bg-navy-950 text-slate-500 border-navy-800 line-through"
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-rose-400" />
            Stressed Path
          </button>

          <button
            type="button"
            onClick={() => setShowThreshold(!showThreshold)}
            className={`px-2.5 py-1 rounded text-[11px] font-medium border transition flex items-center gap-1.5 ${
              showThreshold
                ? "bg-red-500/15 text-red-300 border-red-500/30"
                : "bg-navy-950 text-slate-500 border-navy-800 line-through"
            }`}
          >
            <span className="h-0.5 w-3 bg-red-400 border-dashed" />
            Min Threshold
          </button>
        </div>
      </div>

      {/* Breach Notification Badge if active */}
      {breachPoint && (
        <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/25 text-xs">
          <div className="flex items-center gap-2 text-rose-300">
            <AlertOctagon className="h-4 w-4 text-rose-400" />
            <span>
              Breach Detected at <strong>{formatDate(breachPoint.date)}</strong> (Day {breachPoint.day}): Projected Cash falls to {formatINR(breachPoint.stressedCash)}
            </span>
          </div>
          <span className="text-[10px] font-mono text-rose-400 uppercase tracking-wider font-bold">
            Deficit: {formatINR(minThreshold - breachPoint.stressedCash)}
          </span>
        </div>
      )}

      {/* Chart Canvas */}
      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ top: 15, right: 20, left: 15, bottom: 5 }}
          >
            <defs>
              <linearGradient id="baselineGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#14B8A6" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#14B8A6" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="stressedGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#F43F5E" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#1E293B"
              vertical={false}
              opacity={0.6}
            />

            <XAxis
              dataKey="date"
              stroke="#64748B"
              tick={{ fontSize: 10, fill: "#94A3B8" }}
              tickLine={false}
              axisLine={{ stroke: "#1E293B" }}
              tickFormatter={(v, i) => (i % 14 === 0 ? formatDate(v) : "")}
            />

            <YAxis
              stroke="#64748B"
              tick={{ fontSize: 10, fill: "#94A3B8", fontFamily: "monospace" }}
              tickLine={false}
              axisLine={{ stroke: "#1E293B" }}
              tickFormatter={(v) => formatINR(v, true)}
              domain={["auto", "auto"]}
            />

            <Tooltip content={<CustomStressTooltip />} />

            {/* Threshold Reference Line */}
            {showThreshold && (
              <ReferenceLine
                y={minThreshold}
                stroke="#EF4444"
                strokeDasharray="5 5"
                strokeWidth={2}
                label={{
                  value: `Min Threshold (${formatINR(minThreshold, true)})`,
                  fill: "#EF4444",
                  fontSize: 10,
                  position: "insideTopRight",
                }}
              />
            )}

            {/* Zero Axis Reference Line if negative cash is reached */}
            <ReferenceLine y={0} stroke="#475569" strokeWidth={1} />

            {/* Baseline Path */}
            {showBaseline && (
              <Area
                type="monotone"
                dataKey="baselineCash"
                name="Baseline Cash"
                stroke="#2DD4BF"
                strokeWidth={2.5}
                fill="url(#baselineGradient)"
                dot={false}
                activeDot={{ r: 5, stroke: "#2DD4BF", strokeWidth: 2, fill: "#0B1120" }}
              />
            )}

            {/* Stressed Path */}
            {showStressed && (
              <Area
                type="monotone"
                dataKey="stressedCash"
                name="Stressed Cash"
                stroke="#F43F5E"
                strokeWidth={2.5}
                fill="url(#stressedGradient)"
                dot={false}
                activeDot={{ r: 5, stroke: "#F43F5E", strokeWidth: 2, fill: "#0B1120" }}
              />
            )}

            {/* Prominent Marker at First Breach Point */}
            {breachPoint && showStressed && (
              <ReferenceDot
                x={breachPoint.date}
                y={breachPoint.stressedCash}
                r={7}
                fill="#EF4444"
                stroke="#FFFFFF"
                strokeWidth={2.5}
                label={{
                  value: `Breach: Day ${breachPoint.day}`,
                  fill: "#FCA5A5",
                  fontSize: 11,
                  fontWeight: "bold",
                  position: "top",
                  offset: 12,
                }}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
