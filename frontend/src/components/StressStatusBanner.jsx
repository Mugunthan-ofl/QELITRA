import React from "react";
import {
  ShieldCheck,
  AlertTriangle,
  ShieldAlert,
  Clock,
  Calendar,
  AlertOctagon,
  ArrowDownRight,
  TrendingDown,
} from "lucide-react";
import { formatINR, formatDate } from "../utils/format";

export default function StressStatusBanner({ stressResult }) {
  if (!stressResult) return null;

  const {
    status = "Safe",
    status_reason = "",
    breach_date = null,
    breach_day = null,
    runway = "",
    runway_days = 90,
    breach_days = 0,
    minimum_cash = 0,
    minimum_cash_date = "",
    minimum_cash_day = 1,
    minimum_cash_threshold = 750000,
    ending_cash = 0,
    projection_horizon = 90,
  } = stressResult;

  // Configuration based on status
  const config = {
    Safe: {
      bg: "bg-emerald-950/40 border-emerald-500/40 shadow-emerald-950/30",
      badgeBg: "bg-emerald-500/20 border-emerald-500/40 text-emerald-400",
      titleColor: "text-emerald-300",
      icon: ShieldCheck,
      iconColor: "text-emerald-400",
      headline: "SAFE: Robust Solvency & Liquidity Buffer Maintained",
      accentDot: "bg-emerald-400",
    },
    Warning: {
      bg: "bg-amber-950/40 border-amber-500/40 shadow-amber-950/30",
      badgeBg: "bg-amber-500/20 border-amber-500/40 text-amber-400",
      titleColor: "text-amber-300",
      icon: AlertTriangle,
      iconColor: "text-amber-400",
      headline: "WARNING: Liquidity Buffer Compressed Within Safety Margin",
      accentDot: "bg-amber-400",
    },
    Critical: {
      bg: "bg-rose-950/50 border-rose-500/50 shadow-rose-950/40 animate-pulse-slow",
      badgeBg: "bg-rose-500/20 border-rose-500/40 text-rose-400",
      titleColor: "text-rose-300",
      icon: ShieldAlert,
      iconColor: "text-rose-400",
      headline: `CRITICAL: Liquidity Threshold Breached on Day ${breach_day || 1}`,
      accentDot: "bg-rose-400",
    },
  }[status] || {
    bg: "bg-navy-900 border-navy-800",
    badgeBg: "bg-navy-800 text-white",
    titleColor: "text-white",
    icon: ShieldCheck,
    iconColor: "text-teal-400",
    headline: "Solvency Status",
    accentDot: "bg-teal-400",
  };

  const IconComponent = config.icon;
  const cashDelta = minimum_cash - minimum_cash_threshold;

  return (
    <div
      className={`relative overflow-hidden rounded-xl border p-5 shadow-xl backdrop-blur-md transition-all ${config.bg}`}
    >
      {/* Top Status Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl ${config.badgeBg}`}>
            <IconComponent className={`h-6 w-6 ${config.iconColor}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border ${config.badgeBg}`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${config.accentDot} animate-ping`} />
                {status}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {projection_horizon}-Day Horizon
              </span>
            </div>
            <h2 className={`text-base font-bold mt-1 ${config.titleColor}`}>
              {config.headline}
            </h2>
          </div>
        </div>

        {/* Breach / Runway Quick Summary Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {breach_date ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-mono">
              <AlertOctagon className="h-4 w-4 text-rose-400" />
              <span>
                First Breach: <strong className="text-white">{formatDate(breach_date)}</strong> (Day {breach_day})
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-mono">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span>No Threshold Breach</span>
            </div>
          )}

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-navy-950/80 border border-navy-700/80 text-xs font-mono text-slate-200">
            <Clock className="h-4 w-4 text-teal-400" />
            <span>
              Runway: <strong className="text-teal-300">{runway_days} Days</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Rationale and Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4">
        {/* Rationale / Diagnostic Explanation */}
        <div className="md:col-span-2 text-xs text-slate-300 leading-relaxed pr-2">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Diagnostic Solvency Assessment
          </span>
          <p>{status_reason}</p>
        </div>

        {/* Lowest Projected Cash */}
        <div className="p-3 rounded-lg bg-navy-950/70 border border-navy-800">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
            Lowest Cash Point
          </span>
          <p className="text-sm font-bold font-mono text-white mt-0.5">
            {formatINR(minimum_cash)}
          </p>
          <span className="text-[10px] text-slate-400 block mt-0.5">
            Day {minimum_cash_day} ({formatDate(minimum_cash_date)})
          </span>
          <span
            className={`text-[10px] font-mono font-medium block mt-1 ${
              cashDelta >= 0 ? "text-emerald-400" : "text-rose-400"
            }`}
          >
            {cashDelta >= 0 ? `+${formatINR(cashDelta)} Buffer` : `${formatINR(cashDelta)} Deficit`}
          </span>
        </div>

        {/* Projected Horizon Closing Cash */}
        <div className="p-3 rounded-lg bg-navy-950/70 border border-navy-800">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
            Day {projection_horizon} Ending Cash
          </span>
          <p className="text-sm font-bold font-mono text-white mt-0.5">
            {formatINR(ending_cash)}
          </p>
          <span className="text-[10px] text-slate-400 block mt-0.5">
            Threshold: {formatINR(minimum_cash_threshold, true)}
          </span>
          <span
            className={`text-[10px] font-mono font-medium block mt-1 ${
              breach_days > 0 ? "text-rose-400" : "text-emerald-400"
            }`}
          >
            {breach_days > 0 ? `${breach_days} Breach Days Detected` : "0 Days in Breach"}
          </span>
        </div>
      </div>
    </div>
  );
}
