import React, { useState } from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip
} from "recharts";
import { PieChart as PieIcon, AlertCircle } from "lucide-react";
import { formatINR } from "../../utils/format";

/**
 * Overdue vs. On-Time Donut Chart:
 * Displays distribution of overdue vs not yet due invoices with toggle for AR, AP, or Total.
 */
export default function OverdueDonutChart({
  overdueData = null,
  loading = false,
  title = "Overdue vs. On-Time Invoice Ratio",
  subtitle = "Portion of unpaid invoices that have crossed payment due date"
}) {
  const [scope, setScope] = useState("receivables"); // "receivables" | "payables" | "combined"

  if (loading) {
    return (
      <div className="bg-navy-900/70 border border-navy-800 rounded-xl p-5 h-80 flex items-center justify-center animate-pulse">
        <div className="flex flex-col items-center gap-2 text-slate-500">
          <PieIcon className="h-8 w-8 text-teal-500/50 animate-bounce" />
          <p className="text-xs">Analyzing delinquency ratios...</p>
        </div>
      </div>
    );
  }

  const rec = overdueData?.receivables || {};
  const pay = overdueData?.payables || {};
  const comb = overdueData?.combined || {};

  let overdueAmt = 0;
  let ontimeAmt = 0;
  let overdueCount = 0;
  let ontimeCount = 0;

  if (scope === "receivables") {
    overdueAmt = rec.overdue_amount_inr || 0;
    ontimeAmt = rec.ontime_amount_inr || 0;
    overdueCount = rec.overdue_count || 0;
    ontimeCount = rec.ontime_count || 0;
  } else if (scope === "payables") {
    overdueAmt = pay.overdue_amount_inr || 0;
    ontimeAmt = pay.ontime_amount_inr || 0;
    overdueCount = pay.overdue_count || 0;
    ontimeCount = pay.ontime_count || 0;
  } else {
    overdueAmt = comb.total_overdue_amount_inr || 0;
    ontimeAmt = comb.total_ontime_amount_inr || 0;
    overdueCount = comb.total_overdue_count || 0;
    ontimeCount = comb.total_ontime_count || 0;
  }

  const totalAmt = overdueAmt + ontimeAmt;
  const overduePct = totalAmt > 0 ? (overdueAmt / totalAmt) * 100 : 0;

  const pieData = [
    { name: "Overdue (> Due Date)", value: overdueAmt, count: overdueCount, color: "#F43F5E" },
    { name: "On-Time (Current / Not Due)", value: ontimeAmt, count: ontimeCount, color: "#F59E0B" }
  ];

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload || !payload.length) return null;
    const item = payload[0].payload;
    const pct = totalAmt > 0 ? (item.value / totalAmt) * 100 : 0;
    return (
      <div className="bg-navy-950/95 border border-navy-700 p-2.5 rounded-lg shadow-xl backdrop-blur-md text-xs space-y-1">
        <div className="flex items-center gap-1.5 font-semibold" style={{ color: item.color }}>
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></span>
          <span>{item.name}</span>
        </div>
        <div className="flex justify-between items-center text-slate-300 gap-4 pt-1 border-t border-navy-800">
          <span className="text-slate-400">Amount:</span>
          <span className="font-mono font-bold">{formatINR(item.value)}</span>
        </div>
        <div className="flex justify-between items-center text-slate-400 text-[11px]">
          <span>Count:</span>
          <span className="font-mono">{item.count} invoices ({pct.toFixed(1)}%)</span>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-navy-900/70 border border-navy-800 rounded-xl p-5 space-y-4 backdrop-blur-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-navy-800/80 gap-2">
        <div>
          <div className="flex items-center gap-2">
            <PieIcon className="h-4 w-4 text-amber-400" />
            <h3 className="text-sm font-semibold text-white tracking-wide">{title}</h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
        </div>

        {/* Scope Toggle */}
        <div className="flex items-center bg-navy-950 p-1 rounded-lg border border-navy-800 text-xs">
          <button
            onClick={() => setScope("receivables")}
            className={`px-2 py-0.5 rounded transition-colors ${
              scope === "receivables" ? "bg-amber-500 text-navy-950 font-semibold" : "text-slate-400 hover:text-white"
            }`}
          >
            AR
          </button>
          <button
            onClick={() => setScope("payables")}
            className={`px-2 py-0.5 rounded transition-colors ${
              scope === "payables" ? "bg-amber-500 text-navy-950 font-semibold" : "text-slate-400 hover:text-white"
            }`}
          >
            AP
          </button>
          <button
            onClick={() => setScope("combined")}
            className={`px-2 py-0.5 rounded transition-colors ${
              scope === "combined" ? "bg-amber-500 text-navy-950 font-semibold" : "text-slate-400 hover:text-white"
            }`}
          >
            Total
          </button>
        </div>
      </div>

      {/* Donut Chart with centered percentage */}
      <div className="relative h-52 w-full flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={pieData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={56}
              outerRadius={78}
              paddingAngle={4}
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} stroke="#08090D" strokeWidth={2} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>

        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-xl font-bold font-mono text-rose-400">{overduePct.toFixed(1)}%</span>
          <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Overdue</span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-5 text-[11px] text-slate-400">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
          <span>Overdue ({overdueCount})</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
          <span>On-Time ({ontimeCount})</span>
        </div>
      </div>

      {/* Breakdown Details Strip */}
      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-navy-800/60 text-xs">
        <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20">
          <div className="text-[11px] text-rose-400 font-medium">Overdue Invoices</div>
          <div className="text-sm font-bold font-mono text-rose-300 mt-0.5">{formatINR(overdueAmt)}</div>
          <div className="text-[10px] text-rose-400/80 mt-0.5">{overdueCount} pending invoices</div>
        </div>

        <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <div className="text-[11px] text-amber-400 font-medium">On-Time / Not Due</div>
          <div className="text-sm font-bold font-mono text-amber-300 mt-0.5">{formatINR(ontimeAmt)}</div>
          <div className="text-[10px] text-amber-400/80 mt-0.5">{ontimeCount} pending invoices</div>
        </div>
      </div>
    </div>
  );
}
