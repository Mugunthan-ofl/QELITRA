import React from "react";
import {
  Sliders,
  RotateCcw,
  Sparkles,
  Zap,
  Clock,
  Coins,
  ShieldCheck,
  Calendar,
  AlertCircle,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { formatINR } from "../utils/format";

export default function StressPanel({
  scenarios = [],
  params,
  updateParameter,
  selectScenario,
  applyPreset,
  reset,
  simulating,
  mcLoading,
}) {
  const {
    scenarioId,
    inflowDrop,
    outflowRise,
    collectionDelay,
    creditReduction,
    minThreshold,
    projectionHorizon,
  } = params;

  return (
    <div className="bg-navy-900/80 border border-navy-800 rounded-xl p-5 space-y-5 shadow-2xl backdrop-blur-md">
      {/* Panel Header */}
      <div className="flex items-center justify-between border-b border-navy-800/80 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <Sliders className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide">
              Stress Parameter Engine
            </h3>
            <span className="text-[10px] text-slate-400">
              Interactive shock multipliers & solvency limits
            </span>
          </div>
        </div>

        {/* Live Calculation Indicator */}
        <div className="flex items-center gap-2">
          {(simulating || mcLoading) && (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-400 animate-pulse font-mono">
              <Zap className="h-3 w-3 animate-spin" />
              <span>Recalculating...</span>
            </div>
          )}
        </div>
      </div>

      {/* Preset Quick-Buttons & Reset */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Quick Presets
          </span>
          <button
            type="button"
            onClick={reset}
            className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white transition px-2 py-0.5 rounded border border-navy-700 hover:border-slate-500 bg-navy-850"
            title="Reset to Baseline"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Reset</span>
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => applyPreset("base")}
            className={`py-1.5 px-2.5 rounded-lg text-xs font-semibold border transition flex items-center justify-center gap-1.5 ${
              scenarioId === "SCN001" && inflowDrop === 0 && outflowRise === 0
                ? "bg-amber-500/20 border-amber-500/50 text-amber-300 shadow-sm shadow-amber-500/20"
                : "bg-navy-850/80 border-navy-750 text-slate-300 hover:bg-navy-800 hover:text-white"
            }`}
          >
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            <span>Base Case</span>
          </button>

          <button
            type="button"
            onClick={() => applyPreset("mild")}
            className={`py-1.5 px-2.5 rounded-lg text-xs font-semibold border transition flex items-center justify-center gap-1.5 ${
              scenarioId === "SCN002"
                ? "bg-amber-500/20 border-amber-500/50 text-amber-300 shadow-sm shadow-amber-500/20"
                : "bg-navy-850/80 border-navy-750 text-slate-300 hover:bg-navy-800 hover:text-white"
            }`}
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            <span>Mild</span>
          </button>

          <button
            type="button"
            onClick={() => applyPreset("severe")}
            className={`py-1.5 px-2.5 rounded-lg text-xs font-semibold border transition flex items-center justify-center gap-1.5 ${
              scenarioId === "SCN005"
                ? "bg-rose-500/20 border-rose-500/50 text-rose-300 shadow-sm shadow-rose-500/20"
                : "bg-navy-850/80 border-navy-750 text-slate-300 hover:bg-navy-800 hover:text-white"
            }`}
          >
            <Zap className="h-3.5 w-3.5 text-rose-400" />
            <span>Severe</span>
          </button>
        </div>
      </div>

      {/* Scenario Dropdown (All 22 Scenarios) */}
      <div className="space-y-1.5">
        <label
          htmlFor="scenario-select"
          className="text-xs font-medium text-slate-300 flex items-center justify-between"
        >
          <span>Select Scenario Preset (22 Scenarios)</span>
          <span className="text-[10px] text-amber-400 font-mono">
            {scenarioId ? scenarioId : "Custom fine-tuned"}
          </span>
        </label>
        <select
          id="scenario-select"
          value={scenarioId || ""}
          onChange={(e) => {
            if (e.target.value) {
              selectScenario(e.target.value);
            }
          }}
          className="w-full bg-navy-950 border border-navy-700 hover:border-amber-500/50 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-400 transition"
        >
          <option value="" disabled>
            -- Choose a Risk Scenario Preset --
          </option>
          {scenarios.map((sc) => (
            <option key={sc.scenario_id} value={sc.scenario_id}>
              {sc.scenario_id}: {sc.scenario_name} (-{sc.inflow_reduction_pct}% Inflow, +{sc.outflow_increase_pct}% Outflow)
            </option>
          ))}
        </select>
      </div>

      {/* Sliders & Numeric Inputs */}
      <div className="space-y-4 pt-1 border-t border-navy-800/80">
        {/* 1. Inflow Shock */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-300 flex items-center gap-1.5 font-medium">
              <TrendingDown className="h-3.5 w-3.5 text-amber-400" />
              Inflow / Revenue Shock %
            </span>
            <div className="flex items-center gap-1">
              <span className="font-mono text-amber-400 font-bold">-{inflowDrop}%</span>
              <input
                type="number"
                min="0"
                max="100"
                value={inflowDrop}
                onChange={(e) =>
                  updateParameter(
                    "inflowDrop",
                    Math.max(0, Math.min(100, Number(e.target.value)))
                  )
                }
                className="w-14 px-1.5 py-0.5 bg-navy-950 border border-navy-700 rounded text-[11px] text-right font-mono text-white focus:border-amber-400 outline-none"
              />
            </div>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            step="1"
            value={inflowDrop}
            onChange={(e) => updateParameter("inflowDrop", Number(e.target.value))}
            className="w-full h-1.5 bg-navy-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
          />
          <div className="flex justify-between text-[10px] text-slate-500 font-mono">
            <span>0% (Normal)</span>
            <span>25%</span>
            <span>50%</span>
            <span>100% (Zero Inflow)</span>
          </div>
        </div>

        {/* 2. Outflow Surge */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-300 flex items-center gap-1.5 font-medium">
              <TrendingUp className="h-3.5 w-3.5 text-rose-400" />
              Outflow / Expense Surge %
            </span>
            <div className="flex items-center gap-1">
              <span className="font-mono text-rose-400 font-bold">+{outflowRise}%</span>
              <input
                type="number"
                min="0"
                max="150"
                value={outflowRise}
                onChange={(e) =>
                  updateParameter(
                    "outflowRise",
                    Math.max(0, Math.min(150, Number(e.target.value)))
                  )
                }
                className="w-14 px-1.5 py-0.5 bg-navy-950 border border-navy-700 rounded text-[11px] text-right font-mono text-white focus:border-rose-400 outline-none"
              />
            </div>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            step="1"
            value={outflowRise}
            onChange={(e) => updateParameter("outflowRise", Number(e.target.value))}
            className="w-full h-1.5 bg-navy-800 rounded-lg appearance-none cursor-pointer accent-rose-400"
          />
          <div className="flex justify-between text-[10px] text-slate-500 font-mono">
            <span>0%</span>
            <span>25%</span>
            <span>50%</span>
            <span>100% (2x Expenses)</span>
          </div>
        </div>

        {/* 3. Collection Delay (Days) */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-300 flex items-center gap-1.5 font-medium">
              <Clock className="h-3.5 w-3.5 text-amber-400" />
              Receivables Collection Delay
            </span>
            <div className="flex items-center gap-1">
              <span className="font-mono text-amber-400 font-bold">{collectionDelay} Days</span>
              <input
                type="number"
                min="0"
                max="90"
                value={collectionDelay}
                onChange={(e) =>
                  updateParameter(
                    "collectionDelay",
                    Math.max(0, Math.min(90, Number(e.target.value)))
                  )
                }
                className="w-14 px-1.5 py-0.5 bg-navy-950 border border-navy-700 rounded text-[11px] text-right font-mono text-white focus:border-amber-400 outline-none"
              />
            </div>
          </div>
          <input
            type="range"
            min="0"
            max="60"
            step="1"
            value={collectionDelay}
            onChange={(e) => updateParameter("collectionDelay", Number(e.target.value))}
            className="w-full h-1.5 bg-navy-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
          />
          <div className="flex justify-between text-[10px] text-slate-500 font-mono">
            <span>0 Days</span>
            <span>15 Days</span>
            <span>30 Days</span>
            <span>60 Days</span>
          </div>
        </div>

        {/* 4. Minimum Cash Threshold */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-300 flex items-center gap-1.5 font-medium">
              <Coins className="h-3.5 w-3.5 text-amber-400" />
              Minimum Cash Threshold
            </span>
            <span className="font-mono text-amber-400 font-bold">
              {formatINR(minThreshold, true)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min="0"
              max="2500000"
              step="50000"
              value={minThreshold}
              onChange={(e) => updateParameter("minThreshold", Number(e.target.value))}
              className="flex-1 h-1.5 bg-navy-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
            />
            <input
              type="number"
              min="0"
              max="5000000"
              step="50000"
              value={minThreshold}
              onChange={(e) => updateParameter("minThreshold", Number(e.target.value))}
              className="w-24 px-1.5 py-0.5 bg-navy-950 border border-navy-700 rounded text-[11px] text-right font-mono text-white focus:border-amber-400 outline-none"
            />
          </div>
          <div className="flex items-center gap-1 pt-1">
            <span className="text-[10px] text-slate-400">Presets:</span>
            {[500000, 750000, 1000000, 1500000].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => updateParameter("minThreshold", t)}
                className={`px-1.5 py-0.5 rounded text-[10px] font-mono border transition ${
                  minThreshold === t
                    ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                    : "bg-navy-950 text-slate-400 border-navy-800 hover:text-white"
                }`}
              >
                ₹{(t / 100000).toFixed(1)}L
              </button>
            ))}
          </div>
        </div>

        {/* 5. Projection Horizon */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-300 flex items-center gap-1.5 font-medium">
              <Calendar className="h-3.5 w-3.5 text-indigo-400" />
              Projection Horizon
            </span>
            <span className="font-mono text-indigo-400 font-bold">
              {projectionHorizon} Days
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            {[30, 60, 90].map((h) => (
              <button
                key={h}
                type="button"
                onClick={() => updateParameter("projectionHorizon", h)}
                className={`flex-1 py-1 rounded-lg text-xs font-mono font-medium border transition ${
                  projectionHorizon === h
                    ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/40"
                    : "bg-navy-950 text-slate-400 border-navy-800 hover:text-white"
                }`}
              >
                {h} Days
              </button>
            ))}
          </div>
        </div>

        {/* 6. Credit Line Reduction % (Dataset Facility Notice) */}
        <div className="space-y-1.5 pt-2 border-t border-navy-800/80">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400 flex items-center gap-1.5 font-medium">
              Credit Line Reduction %
            </span>
            <span className="font-mono text-slate-400">
              {creditReduction}% (N/A)
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            step="10"
            value={creditReduction}
            onChange={(e) => updateParameter("creditReduction", Number(e.target.value))}
            disabled
            className="w-full h-1.5 bg-navy-800/50 rounded-lg appearance-none cursor-not-allowed opacity-50"
          />
          <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
            <AlertCircle className="h-3 w-3 shrink-0 text-slate-500" />
            <span>Dataset operates without external credit facilities (debt-free balance sheet).</span>
          </div>
        </div>
      </div>
    </div>
  );
}
