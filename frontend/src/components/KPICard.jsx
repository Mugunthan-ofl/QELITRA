import React from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

/**
 * Renders a mini SVG sparkline path inside the card
 */
function MiniSparkline({ data = [], color = "#14B8A6", height = 24, width = 72 }) {
  if (!data || data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data
    .map((val, idx) => {
      const x = (idx / (data.length - 1)) * width;
      const y = height - ((val - min) / range) * (height - 4) - 2;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg width={width} height={height} className="overflow-visible shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}

export default function KPICard({
  title,
  value,
  subtext,
  change,
  changeLabel = "vs prior",
  isPositive,
  statusColor = "teal", // "teal", "amber", "rose", "emerald", "blue", "cyan", "indigo"
  badgeColor,
  icon: Icon,
  badge,
  sparklineData = [],
  loading = false,
}) {
  if (loading) {
    return (
      <div className="bg-navy-900/70 border border-navy-800 rounded-xl p-4 h-28 flex flex-col justify-between animate-pulse shadow-sm">
        <div className="flex items-center justify-between">
          <div className="h-3 w-24 bg-navy-800 rounded"></div>
          <div className="h-7 w-7 bg-navy-800 rounded-lg"></div>
        </div>
        <div className="h-7 w-32 bg-navy-800 rounded mt-2"></div>
        <div className="h-3 w-40 bg-navy-800 rounded mt-2"></div>
      </div>
    );
  }

  // Determine styling based on statusColor or badgeColor fallback
  const effectiveColor = badgeColor || statusColor || "teal";

  const colorMap = {
    teal: {
      border: "hover:border-teal-500/40",
      badge: "bg-teal-500/10 text-teal-400 border-teal-500/20",
      sparkline: "#14B8A6",
      iconBg: "bg-teal-500/10 text-teal-400",
      indicator: "bg-teal-400"
    },
    emerald: {
      border: "hover:border-emerald-500/40",
      badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      sparkline: "#10B981",
      iconBg: "bg-emerald-500/10 text-emerald-400",
      indicator: "bg-emerald-400"
    },
    amber: {
      border: "hover:border-amber-500/40",
      badge: "bg-amber-500/10 text-amber-400 border-amber-500/20",
      sparkline: "#F59E0B",
      iconBg: "bg-amber-500/10 text-amber-400",
      indicator: "bg-amber-400"
    },
    rose: {
      border: "hover:border-rose-500/40",
      badge: "bg-rose-500/10 text-rose-400 border-rose-500/20",
      sparkline: "#F43F5E",
      iconBg: "bg-rose-500/10 text-rose-400",
      indicator: "bg-rose-400"
    },
    blue: {
      border: "hover:border-blue-500/40",
      badge: "bg-blue-500/10 text-blue-400 border-blue-500/20",
      sparkline: "#3B82F6",
      iconBg: "bg-blue-500/10 text-blue-400",
      indicator: "bg-blue-400"
    },
    cyan: {
      border: "hover:border-cyan-500/40",
      badge: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
      sparkline: "#06B6D4",
      iconBg: "bg-cyan-500/10 text-cyan-400",
      indicator: "bg-cyan-400"
    },
    indigo: {
      border: "hover:border-indigo-500/40",
      badge: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
      sparkline: "#6366F1",
      iconBg: "bg-indigo-500/10 text-indigo-400",
      indicator: "bg-indigo-400"
    }
  };

  const theme = colorMap[effectiveColor] || colorMap.teal;

  return (
    <div className={`bg-navy-900/70 backdrop-blur-sm border border-navy-800 rounded-xl p-4 transition-all duration-200 ${theme.border} relative overflow-hidden group flex flex-col justify-between shadow-sm shadow-navy-950/40`}>
      {/* Glow accent */}
      <div className="absolute top-0 right-0 h-20 w-20 bg-gradient-to-bl from-teal-500/5 to-transparent rounded-bl-3xl pointer-events-none group-hover:from-teal-500/10 transition-all" />

      <div>
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">{title}</span>
          {Icon && (
            <div className={`h-7 w-7 rounded-lg ${theme.iconBg} flex items-center justify-center border border-navy-700/50`}>
              <Icon className="h-3.5 w-3.5" />
            </div>
          )}
        </div>

        <div className="mt-2.5 flex items-baseline justify-between gap-2">
          <div className="text-xl lg:text-2xl font-bold tracking-tight text-white font-mono">{value}</div>
          {sparklineData && sparklineData.length > 1 && (
            <MiniSparkline data={sparklineData} color={theme.sparkline} />
          )}
        </div>
      </div>

      <div className="mt-3 pt-2.5 border-t border-navy-800/80 flex items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1.5 truncate">
          {change !== undefined && change !== null && (
            <span
              className={`inline-flex items-center gap-0.5 text-[11px] font-semibold ${
                isPositive === true
                  ? "text-emerald-400"
                  : isPositive === false
                  ? "text-rose-400"
                  : "text-slate-400"
              }`}
            >
              {isPositive === true ? (
                <TrendingUp className="h-3 w-3 shrink-0" />
              ) : isPositive === false ? (
                <TrendingDown className="h-3 w-3 shrink-0" />
              ) : (
                <Minus className="h-3 w-3 shrink-0" />
              )}
              {change}
            </span>
          )}
          {subtext && <span className="text-[11px] text-slate-400 truncate">{subtext}</span>}
        </div>

        {badge && (
          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border shrink-0 ${theme.badge}`}>
            {badge}
          </span>
        )}
      </div>
    </div>
  );
}
