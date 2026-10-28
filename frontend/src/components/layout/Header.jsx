import React, { useState } from "react";
import {
  Activity,
  RefreshCw,
  Clock,
  Building2,
  Database,
  Sun,
  Moon,
  Info,
} from "lucide-react";
import { useFilter } from "../../context/FilterContext";
import { useTheme } from "../../context/ThemeContext";
import AboutDataModal from "../AboutDataModal";

export default function Header({ pageTitle = "QELITRA — Corporate Liquidity Overview" }) {
  const { lastUpdated, triggerRefresh, isRefreshing } = useFilter();
  const { theme, toggleTheme, isDark } = useTheme();
  const [showAbout, setShowAbout] = useState(false);

  return (
    <>
      <header className="h-16 border-b border-navy-800 bg-navy-950/90 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20 transition-colors duration-200">
        {/* Page Title & Breadcrumb */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center shadow-lg shadow-amber-500/20 shrink-0">
            <Activity className="h-5 w-5 text-navy-950 font-bold" />
          </div>
          <div className="min-w-0 truncate">
            <h1 className="text-sm sm:text-base font-semibold tracking-tight text-white flex items-center gap-2 truncate">
              <span className="truncate">{pageTitle}</span>
              <span className="hidden sm:inline-block text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">
                LIVE
              </span>
            </h1>
            <p className="text-[10px] sm:text-[11px] text-slate-400 truncate">
              Real-Time Cash Flow Stress Testing & Solvency Analytics
            </p>
          </div>
        </div>

        {/* Right Controls: Entity, Last Updated, About, Theme, Refresh */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-navy-900 border border-navy-800 text-xs text-slate-300">
            <Building2 className="h-3.5 w-3.5 text-amber-400" />
            <span className="text-slate-400">Entity:</span>
            <span className="font-semibold text-white font-mono">COMP001 (INR)</span>
          </div>

          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-navy-900 border border-navy-800 text-xs text-slate-400 font-mono">
            <Clock className="h-3.5 w-3.5 text-slate-500" />
            <span>Updated:</span>
            <span className="text-slate-200">{lastUpdated}</span>
          </div>

          {/* About / Data Sources Button */}
          <button
            type="button"
            onClick={() => setShowAbout(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-navy-900 hover:bg-navy-850 border border-navy-750 text-slate-300 hover:text-amber-300 text-xs font-medium transition shadow-sm"
            title="About platform & dataset inventory"
          >
            <Database className="h-3.5 w-3.5 text-amber-400" />
            <span className="hidden sm:inline">About / Data</span>
          </button>

          {/* Theme Toggle Button */}
          <button
            type="button"
            onClick={toggleTheme}
            className="p-1.5 rounded-lg bg-navy-900 hover:bg-navy-850 border border-navy-750 text-slate-300 hover:text-amber-300 text-xs transition shadow-sm"
            title={isDark ? "Switch to Light Theme" : "Switch to Dark Theme"}
          >
            {isDark ? (
              <Sun className="h-4 w-4 text-amber-400" />
            ) : (
              <Moon className="h-4 w-4 text-amber-400" />
            )}
          </button>

          {/* Refresh Button */}
          <button
            onClick={triggerRefresh}
            disabled={isRefreshing}
            title="Refresh metrics from backend"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-navy-950 font-bold text-xs transition duration-150 shadow-md shadow-amber-500/15 disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </header>

      {/* About & Datasets Modal */}
      <AboutDataModal isOpen={showAbout} onClose={() => setShowAbout(false)} />
    </>
  );
}
