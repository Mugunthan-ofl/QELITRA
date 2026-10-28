import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { BarChart3 } from "lucide-react";
import { formatINR } from "../../utils/format";

function CustomBarTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const net = (data.inflow || data.inflow_inr || 0) - (data.outflow || data.outflow_inr || 0);
    return (
      <div className="bg-navy-950/95 border border-navy-700 p-3 rounded-xl shadow-xl backdrop-blur-md text-xs space-y-1.5 min-w-[180px]">
        <div className="font-semibold text-slate-200 border-b border-navy-800 pb-1 font-mono">
          {label}
        </div>
        <div className="flex justify-between items-center text-teal-400">
          <span>Inflow:</span>
          <span className="font-bold font-mono">+{formatINR(data.inflow || data.inflow_inr)}</span>
        </div>
        <div className="flex justify-between items-center text-rose-400">
          <span>Outflow:</span>
          <span className="font-bold font-mono">-{formatINR(data.outflow || data.outflow_inr)}</span>
        </div>
        <div className="flex justify-between items-center text-slate-300 pt-1 border-t border-navy-800 font-medium">
          <span>Net Flow:</span>
          <span className={`font-mono ${net >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
            {formatINR(net)}
          </span>
        </div>
      </div>
    );
  }
  return null;
}

export default function CashFlowBarChart({
  data = [],
  title = "Cash Flow Dynamics (Inflow vs. Outflow)"
}) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-navy-900/70 border border-navy-800 rounded-xl p-6 h-72 flex flex-col items-center justify-center text-center text-slate-500 text-xs">
        <BarChart3 className="h-8 w-8 text-slate-600 mb-2" />
        No cash flow dynamics records found.
      </div>
    );
  }

  return (
    <div className="bg-navy-900/70 border border-navy-800 rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-navy-800 pb-3">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-teal-400" />
          <h3 className="text-sm font-semibold text-white">{title}</h3>
        </div>
        <span className="text-xs text-slate-400 font-mono">Periodic Inflows vs Disbursements</span>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1E2D4A" vertical={false} opacity={0.6} />

            <XAxis
              dataKey="period"
              stroke="#64748B"
              fontSize={11}
              tickLine={false}
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
            />

            <Tooltip content={<CustomBarTooltip />} />

            <Legend
              verticalAlign="top"
              align="right"
              iconType="circle"
              wrapperStyle={{ fontSize: "11px", paddingBottom: "10px" }}
            />

            <Bar
              dataKey="inflow_inr"
              name="Inflow"
              fill="#14B8A6"
              radius={[4, 4, 0, 0]}
              maxBarSize={32}
            />

            <Bar
              dataKey="outflow_inr"
              name="Outflow"
              fill="#F43F5E"
              radius={[4, 4, 0, 0]}
              maxBarSize={32}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
