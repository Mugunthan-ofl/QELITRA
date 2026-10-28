import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from "recharts";
import { Clock, AlertTriangle } from "lucide-react";
import { formatINR } from "../../utils/format";

/**
 * Aging Analysis Bar Chart:
 * Compares Outstanding Receivables (AR) vs Payables (AP) across standard aging buckets:
 * Current (Not Due), 1 - 30 Days, 31 - 60 Days, 61 - 90 Days, 90+ Days Past Due.
 */
export default function AgingBarChart({
  agingData = [],
  loading = false,
  title = "Working Capital Aging Schedule (AR vs. AP)",
  subtitle = "Overdue liabilities and pending collections bucketed by days past due"
}) {
  if (loading) {
    return (
      <div className="bg-navy-900/70 border border-navy-800 rounded-xl p-5 h-80 flex items-center justify-center animate-pulse">
        <div className="flex flex-col items-center gap-2 text-slate-500">
          <Clock className="h-8 w-8 text-amber-500/50 animate-bounce" />
          <p className="text-xs">Computing aging schedule...</p>
        </div>
      </div>
    );
  }

  if (!agingData || agingData.length === 0) {
    return (
      <div className="bg-navy-900/70 border border-navy-800 rounded-xl p-5 h-80 flex items-center justify-center">
        <p className="text-sm text-slate-500">No aging data available for selected filter.</p>
      </div>
    );
  }

  // Custom rich Tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null;
    const item = agingData.find((d) => d.bucket_label === label) || {};

    const arAmt = item.receivables_amount_inr || 0;
    const apAmt = item.payables_amount_inr || 0;
    const netGap = arAmt - apAmt;

    return (
      <div className="bg-navy-950/95 border border-navy-700 p-3 rounded-lg shadow-xl backdrop-blur-md text-xs space-y-2 min-w-[220px]">
        <div className="border-b border-navy-800 pb-1 font-semibold text-slate-200">
          Bucket: {label}
        </div>

        <div className="space-y-1">
          <div className="flex justify-between items-center text-slate-300">
            <span className="flex items-center gap-1.5 text-amber-400">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              Receivables (AR):
            </span>
            <span className="font-mono font-bold">{formatINR(arAmt)}</span>
          </div>
          <div className="text-[10px] text-slate-400 text-right">
            ({item.receivables_count || 0} invoices)
          </div>

          <div className="flex justify-between items-center text-slate-300 pt-1 border-t border-navy-800/60">
            <span className="flex items-center gap-1.5 text-rose-400">
              <span className="w-2 h-2 rounded-full bg-rose-400"></span>
              Payables (AP):
            </span>
            <span className="font-mono font-bold">{formatINR(apAmt)}</span>
          </div>
          <div className="text-[10px] text-slate-400 text-right">
            ({item.payables_count || 0} invoices)
          </div>

          <div className="flex justify-between items-center text-slate-300 pt-1.5 border-t border-navy-800">
            <span className="text-slate-400">Net Impact:</span>
            <span className={`font-mono font-bold ${netGap >= 0 ? "text-amber-400" : "text-rose-400"}`}>
              {netGap >= 0 ? "+" : ""}{formatINR(netGap)}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-navy-900/70 border border-navy-800 rounded-xl p-5 space-y-4 backdrop-blur-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-navy-800/80 gap-2">
        <div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-amber-400" />
            <h3 className="text-sm font-semibold text-white tracking-wide">{title}</h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
        </div>

        {/* Legend pills */}
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-amber-500"></span>
            <span className="text-slate-300 font-medium">Receivables (AR)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-rose-500"></span>
            <span className="text-slate-300 font-medium">Payables (AP)</span>
          </div>
        </div>
      </div>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={agingData} margin={{ top: 15, right: 20, left: 15, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#212635" vertical={false} />
            <XAxis
              dataKey="bucket_label"
              stroke="#64748B"
              fontSize={11}
              tickLine={false}
              interval={0}
            />
            <YAxis
              stroke="#64748B"
              fontSize={10}
              tickLine={false}
              tickFormatter={(v) => formatINR(v, true)}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="receivables_amount_inr"
              name="Receivables (AR)"
              fill="#F59E0B"
              radius={[4, 4, 0, 0]}
              maxBarSize={45}
            />
            <Bar
              dataKey="payables_amount_inr"
              name="Payables (AP)"
              fill="#F43F5E"
              radius={[4, 4, 0, 0]}
              maxBarSize={45}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
