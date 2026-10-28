import React from "react";
import { AlertCircle, AlertTriangle, CheckCircle2, Info, ArrowRight, ShieldCheck } from "lucide-react";

export default function AlertsPanel({
  alerts = [],
  overallHealth = "Safe",
  summary = {},
  loading = false,
  error = null,
  onRetry
}) {
  if (loading) {
    return (
      <div className="bg-navy-900/70 border border-navy-800 rounded-xl p-5 animate-pulse space-y-3">
        <div className="h-4 w-40 bg-navy-800 rounded"></div>
        <div className="space-y-2">
          <div className="h-14 bg-navy-850 rounded-lg"></div>
          <div className="h-14 bg-navy-850 rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-navy-900/70 border border-navy-800 rounded-xl p-5">
        <div className="flex items-center justify-between text-rose-400 text-xs">
          <span>Failed to load treasury alerts: {error}</span>
          {onRetry && (
            <button onClick={onRetry} className="underline hover:text-rose-300">
              Retry
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-navy-900/70 border border-navy-800 rounded-xl p-5 space-y-4">
      {/* Panel Header */}
      <div className="flex items-center justify-between border-b border-navy-800 pb-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-teal-400" />
          <h3 className="text-sm font-semibold text-white">Treasury Risk Alerts & Action Items</h3>
          <span className="text-xs text-slate-400 font-mono">({alerts.length} Active)</span>
        </div>

        <div className="flex items-center gap-2">
          {summary.critical_count > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-400 text-[10px] font-semibold">
              {summary.critical_count} Critical
            </span>
          )}
          {summary.warning_count > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-[10px] font-semibold">
              {summary.warning_count} Warning
            </span>
          )}
          <span
            className={`text-xs px-2.5 py-0.5 rounded-full border font-semibold ${
              overallHealth === "Critical"
                ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                : overallHealth === "Warning"
                ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                : "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
            }`}
          >
            System Solvency: {overallHealth}
          </span>
        </div>
      </div>

      {/* Alert Items List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {alerts.map((alert) => {
          const isCritical = alert.level === "critical";
          const isWarning = alert.level === "warning";
          const isSuccess = alert.level === "success";

          const borderClass = isCritical
            ? "border-rose-500/40 bg-rose-500/5 hover:border-rose-500/60"
            : isWarning
            ? "border-amber-500/40 bg-amber-500/5 hover:border-amber-500/60"
            : "border-teal-500/30 bg-teal-500/5 hover:border-teal-500/50";

          return (
            <div
              key={alert.id}
              className={`p-3.5 rounded-xl border ${borderClass} transition-all duration-150 flex flex-col justify-between space-y-2.5 text-xs`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {isCritical && <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />}
                    {isWarning && <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />}
                    {isSuccess && <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />}
                    {!isCritical && !isWarning && !isSuccess && <Info className="h-4 w-4 text-teal-400 shrink-0" />}
                    <h4 className="font-semibold text-white tracking-tight">{alert.title}</h4>
                  </div>
                  <span
                    className={`text-[9px] uppercase px-1.5 py-0.5 rounded font-mono font-bold shrink-0 ${
                      isCritical
                        ? "bg-rose-500/20 text-rose-300"
                        : isWarning
                        ? "bg-amber-500/20 text-amber-300"
                        : "bg-teal-500/20 text-teal-300"
                    }`}
                  >
                    {alert.level}
                  </span>
                </div>

                <p className="mt-1.5 text-slate-300 text-[11px] leading-relaxed">{alert.message}</p>
              </div>

              <div className="pt-2 border-t border-navy-800/80 flex items-center justify-between text-[11px]">
                <span className="text-slate-400">
                  {alert.metric}: <span className="font-mono font-bold text-white">{alert.value}</span>
                </span>
                <span className="text-slate-500 text-[10px]">Threshold: {alert.threshold}</span>
              </div>

              {alert.action_required && (
                <div className="p-2 rounded-lg bg-navy-950/70 border border-navy-800 text-[10px] text-teal-300 flex items-start gap-1.5">
                  <ArrowRight className="h-3 w-3 text-teal-400 shrink-0 mt-0.5" />
                  <span>{alert.action_required}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
