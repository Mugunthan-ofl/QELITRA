import React, { useState } from "react";
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
} from "recharts";
import { LineChart as LineChartIcon, Eye, EyeOff } from "lucide-react";
import { formatINR, formatDate } from "../../utils/format";

// Custom Tooltip component
function CustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-navy-950/95 border border-navy-700 p-3 rounded-xl shadow-xl backdrop-blur-md text-xs space-y-1.5 min-w-[200px]">
        <div className="font-semibold text-slate-200 border-b border-navy-800 pb-1 font-mono">
          {formatDate(label)}
        </div>
        <div className="flex justify-between items-center text-teal-400">
          <span>Closing Cash:</span>
          <span className="font-bold font-mono">{formatINR(data.closing_cash_balance_inr)}</span>
        </div>
        {data.rolling_net_7d !== undefined && (
          <div className="flex justify-between items-center text-cyan-400">
            <span>7d Net Rolling:</span>
            <span className="font-mono">{formatINR(data.rolling_net_7d)}</span>
          </div>
        )}
        {data.rolling_cash_30d !== undefined && (
          <div className="flex justify-between items-center text-amber-400">
            <span>30d Rolling Cash:</span>
            <span className="font-mono">{formatINR(data.rolling_cash_30d)}</span>
          </div>
        )}
        <div className="flex justify-between items-center text-slate-400 text-[11px] pt-1 border-t border-navy-800">
          <span>Daily Inflow:</span>
          <span className="text-emerald-400 font-mono">+{formatINR(data.cash_inflow_inr)}</span>
        </div>
        <div className="flex justify-between items-center text-slate-400 text-[11px]">
          <span>Daily Outflow:</span>
          <span className="text-rose-400 font-mono">-{formatINR(data.cash_outflow_inr)}</span>
        </div>
      </div>
    );
  }
  return null;
}

export default function CashTrendChart({
  data = [],
  minThreshold = 750000.0,
  title = "Cash Position Trajectory & Solvency Buffer"
}) {
  const [showRaw, setShowRaw] = useState(true);
  const [show7d, setShow7d] = useState(true);
  const [show30d, setShow30d] = useState(true);
  const [showThreshold, setShowThreshold] = useState(true);

  if (!data || data.length === 0) {
    return (
      <div className="bg-navy-900/70 border border-navy-800 rounded-xl p-6 h-80 flex flex-col items-center justify-center text-center text-slate-500 text-xs">
        <LineChartIcon className="h-8 w-8 text-slate-600 mb-2" />
        No cash position records matching current date filters.
      </div>
    );
  }

  return (
    <div className="bg-navy-900/70 border border-navy-800 rounded-xl p-5 space-y-4">
      {/* Chart Header & Toggles */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-navy-800 pb-3">
        <div className="flex items-center gap-2">
          <LineChartIcon className="h-4 w-4 text-teal-400" />
          <h3 className="text-sm font-semibold text-white">{title}</h3>
          <span className="text-xs text-slate-400 font-mono">({data.length} Days)</span>
        </div>

        {/* Toggles */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <button
            onClick={() => setShowRaw(!showRaw)}
            className={`px-2 py-0.5 rounded text-[11px] font-medium border transition ${
              showRaw
                ? "bg-teal-500/10 text-teal-300 border-teal-500/30"
                : "bg-navy-950 text-slate-500 border-navy-800 line-through"
            }`}
          >
            Daily Cash
          </button>
          <button
            onClick={() => setShow7d(!show7d)}
            className={`px-2 py-0.5 rounded text-[11px] font-medium border transition ${
              show7d
                ? "bg-cyan-500/10 text-cyan-300 border-cyan-500/30"
                : "bg-navy-950 text-slate-500 border-navy-800 line-through"
            }`}
          >
            7d Net Rolling
          </button>
          <button
            onClick={() => setShow30d(!show30d)}
            className={`px-2 py-0.5 rounded text-[11px] font-medium border transition ${
              show30d
                ? "bg-amber-500/10 text-amber-300 border-amber-500/30"
                : "bg-navy-950 text-slate-500 border-navy-800 line-through"
            }`}
          >
            30d Cash Rolling
          </button>
          <button
            onClick={() => setShowThreshold(!showThreshold)}
            className={`px-2 py-0.5 rounded text-[11px] font-medium border transition ${
              showThreshold
                ? "bg-rose-500/10 text-rose-300 border-rose-500/30"
                : "bg-navy-950 text-slate-500 border-navy-800 line-through"
            }`}
          >
            Min Policy
          </button>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
            <defs>
              <linearGradient id="cashGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#14B8A6" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#14B8A6" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#1E2D4A" vertical={false} opacity={0.6} />

            <XAxis
              dataKey="date"
              stroke="#64748B"
              fontSize={11}
              tickLine={false}
              tickFormatter={(v) => {
                const parts = v.split("-");
                return `${parts[1]}/${parts[2]}`;
              }}
              minTickGap={30}
            />

            <YAxis
              stroke="#64748B"
              fontSize={11}
              tickLine={false}
              tickFormatter={(val) => {
                if (Math.abs(val) >= 1e7) return `₹${(val / 1e7).toFixed(1)}Cr`;
                if (Math.abs(val) >= 1e5) return `₹${(val / 1e5).toFixed(0)}L`;
                return `₹${val}`;
              }}
              domain={["auto", "auto"]}
            />

            <Tooltip content={<CustomTooltip />} />

            {/* Minimum Threshold Reference Line */}
            {showThreshold && (
              <ReferenceLine
                y={minThreshold}
                stroke="#F43F5E"
                strokeDasharray="4 4"
                strokeWidth={1.5}
                label={{
                  value: `Min Policy: ₹${(minThreshold / 1e5).toFixed(2)}L`,
                  fill: "#F43F5E",
                  position: "insideTopRight",
                  fontSize: 10,
                  fontWeight: 600
                }}
              />
            )}

            {/* Area Fill for Daily Cash Balance */}
            {showRaw && (
              <Area
                type="monotone"
                dataKey="closing_cash_balance_inr"
                name="Closing Cash"
                stroke="#14B8A6"
                strokeWidth={2}
                fill="url(#cashGradient)"
                activeDot={{ r: 5, fill: "#2DD4BF" }}
              />
            )}

            {/* 30-Day Rolling Average Line */}
            {show30d && (
              <Line
                type="monotone"
                dataKey="rolling_cash_30d"
                name="30d Rolling Cash"
                stroke="#F59E0B"
                strokeWidth={1.8}
                dot={false}
              />
            )}

            {/* 7-Day Net Flow Rolling Line */}
            {show7d && (
              <Line
                type="monotone"
                dataKey="rolling_cash_7d"
                name="7d Rolling Cash"
                stroke="#06B6D4"
                strokeWidth={1.5}
                strokeDasharray="3 3"
                dot={false}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
