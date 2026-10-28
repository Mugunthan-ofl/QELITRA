import React from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  Minus,
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { formatINR, formatPercent, formatDate } from "../utils/format";

export default function StressComparisonTable({ stressResult }) {
  if (!stressResult) return null;

  const {
    baseline_summary = {},
    stressed_summary = {},
    comparison = {},
    minimum_cash_threshold = 750000,
    projection_horizon = 90,
  } = stressResult;

  const rows = [
    {
      metric: "Day Horizon Ending Cash",
      subtext: `Projected balance on Day ${projection_horizon}`,
      baseline: formatINR(baseline_summary.ending_cash_inr),
      stressed: formatINR(stressed_summary.ending_cash_inr),
      delta: formatINR(comparison.ending_cash_delta_inr),
      pctDelta: formatPercent(comparison.ending_cash_pct_change),
      isNegativeDelta: comparison.ending_cash_delta_inr < 0,
      status:
        stressed_summary.ending_cash_inr >= minimum_cash_threshold
          ? "Safe"
          : "Breached",
    },
    {
      metric: "Minimum Cash Reached",
      subtext: `Lowest liquidity reserve point`,
      baseline: `${formatINR(baseline_summary.minimum_cash_inr)} (Day ${baseline_summary.minimum_cash_day || 1})`,
      stressed: `${formatINR(stressed_summary.minimum_cash_inr)} (Day ${stressed_summary.minimum_cash_day || 1})`,
      delta: formatINR(comparison.min_cash_delta_inr),
      pctDelta: baseline_summary.minimum_cash_inr
        ? formatPercent(
            ((stressed_summary.minimum_cash_inr -
              baseline_summary.minimum_cash_inr) /
              baseline_summary.minimum_cash_inr) *
              100
          )
        : "-",
      isNegativeDelta: comparison.min_cash_delta_inr < 0,
      status:
        stressed_summary.minimum_cash_inr >= minimum_cash_threshold
          ? "Safe"
          : "Breached",
    },
    {
      metric: "Liquidity Runway",
      subtext: "Days before reserves hit zero or breach threshold",
      baseline: baseline_summary.runway || `> ${projection_horizon} Days`,
      stressed: stressed_summary.runway || `> ${projection_horizon} Days`,
      delta: `${(stressed_summary.runway_days || projection_horizon) - (baseline_summary.runway_days || projection_horizon)} Days`,
      pctDelta: null,
      isNegativeDelta:
        (stressed_summary.runway_days || projection_horizon) <
        (baseline_summary.runway_days || projection_horizon),
      status: stressed_summary.breach_date ? "Critical" : "Safe",
    },
    {
      metric: "Threshold Breach Days",
      subtext: `Days below ₹${(minimum_cash_threshold / 100000).toFixed(1)}L threshold`,
      baseline: "0 Days",
      stressed: `${stressed_summary.breach_days_count || 0} Days`,
      delta: `+${stressed_summary.breach_days_count || 0} Days`,
      pctDelta: null,
      isNegativeDelta: (stressed_summary.breach_days_count || 0) > 0,
      status:
        (stressed_summary.breach_days_count || 0) > 0 ? "Breached" : "Safe",
    },
    {
      metric: "Total Cumulative Inflows",
      subtext: "Aggregated collections across projection window",
      baseline: formatINR(baseline_summary.total_inflows_inr),
      stressed: formatINR(stressed_summary.total_inflows_inr),
      delta: formatINR(
        (stressed_summary.total_inflows_inr || 0) -
          (baseline_summary.total_inflows_inr || 0)
      ),
      pctDelta: baseline_summary.total_inflows_inr
        ? formatPercent(
            (((stressed_summary.total_inflows_inr || 0) -
              (baseline_summary.total_inflows_inr || 0)) /
              baseline_summary.total_inflows_inr) *
              100
          )
        : "-",
      isNegativeDelta: true,
      status: "Shocked",
    },
    {
      metric: "Total Cumulative Outflows",
      subtext: "Aggregated disbursements across projection window",
      baseline: formatINR(baseline_summary.total_outflows_inr),
      stressed: formatINR(stressed_summary.total_outflows_inr),
      delta: formatINR(
        (stressed_summary.total_outflows_inr || 0) -
          (baseline_summary.total_outflows_inr || 0)
      ),
      pctDelta: baseline_summary.total_outflows_inr
        ? formatPercent(
            (((stressed_summary.total_outflows_inr || 0) -
              (baseline_summary.total_outflows_inr || 0)) /
              baseline_summary.total_outflows_inr) *
              100
          )
        : "-",
      isNegativeDelta: false, // higher outflow is worse for cash
      status: "Shocked",
    },
    {
      metric: "Ending Surplus / Deficit",
      subtext: `Buffer relative to ₹${(minimum_cash_threshold / 100000).toFixed(1)}L minimum`,
      baseline: formatINR(
        (baseline_summary.ending_cash_inr || 0) - minimum_cash_threshold
      ),
      stressed: formatINR(comparison.liquidity_surplus_deficit_inr),
      delta: formatINR(
        comparison.liquidity_surplus_deficit_inr -
          ((baseline_summary.ending_cash_inr || 0) - minimum_cash_threshold)
      ),
      pctDelta: null,
      isNegativeDelta: comparison.liquidity_surplus_deficit_inr < 0,
      status:
        comparison.liquidity_surplus_deficit_inr >= 0 ? "Safe" : "Deficit",
    },
  ];

  return (
    <div className="bg-navy-900/80 border border-navy-800 rounded-xl overflow-hidden shadow-xl backdrop-blur-md">
      {/* Table Header Banner */}
      <div className="flex items-center justify-between p-4 border-b border-navy-800 bg-navy-950/60">
        <div>
          <h3 className="text-sm font-bold text-white tracking-wide">
            Side-by-Side Solvency & Liquidity Variance Audit
          </h3>
          <p className="text-[10px] text-slate-400">
            Rigorous variance breakdown between baseline operational trajectory and stressed scenario
          </p>
        </div>
        <span className="text-xs font-mono text-teal-400 px-2 py-0.5 rounded bg-teal-500/10 border border-teal-500/20">
          Threshold: {formatINR(minimum_cash_threshold, true)}
        </span>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-navy-800 bg-navy-950/40 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              <th className="py-3 px-4">Metric & Definition</th>
              <th className="py-3 px-4 text-right">Baseline Forecast</th>
              <th className="py-3 px-4 text-right">Stressed Trajectory</th>
              <th className="py-3 px-4 text-right">Variance (Delta)</th>
              <th className="py-3 px-4 text-center">Outcome</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy-800/60 font-mono">
            {rows.map((row, idx) => (
              <tr
                key={idx}
                className="hover:bg-navy-850/50 transition-colors duration-150"
              >
                <td className="py-3 px-4 font-sans">
                  <div className="font-semibold text-white">{row.metric}</div>
                  <div className="text-[10px] text-slate-400 font-sans">
                    {row.subtext}
                  </div>
                </td>
                <td className="py-3 px-4 text-right text-slate-300 font-medium">
                  {row.baseline}
                </td>
                <td className="py-3 px-4 text-right font-bold text-white">
                  {row.stressed}
                </td>
                <td className="py-3 px-4 text-right">
                  <div
                    className={`inline-flex items-center gap-1 font-bold ${
                      row.isNegativeDelta ? "text-rose-400" : "text-emerald-400"
                    }`}
                  >
                    {row.isNegativeDelta ? (
                      <ArrowDownRight className="h-3.5 w-3.5" />
                    ) : (
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    )}
                    <span>{row.delta}</span>
                    {row.pctDelta && (
                      <span className="text-[10px] opacity-80">
                        ({row.pctDelta})
                      </span>
                    )}
                  </div>
                </td>
                <td className="py-3 px-4 text-center font-sans">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                      row.status === "Safe"
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : row.status === "Critical" || row.status === "Breached" || row.status === "Deficit"
                        ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                        : "bg-navy-800 text-slate-300 border-navy-700"
                    }`}
                  >
                    {row.status === "Safe" ? (
                      <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                    ) : (
                      <AlertTriangle className="h-3 w-3 text-rose-400" />
                    )}
                    {row.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
