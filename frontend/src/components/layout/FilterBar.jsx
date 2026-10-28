import React from "react";
import { Filter, Calendar, RotateCcw, Shield, Layers } from "lucide-react";
import { useFilter, DATE_PRESETS, CATEGORIES } from "../../context/FilterContext";
import { formatINR } from "../../utils/format";

export default function FilterBar() {
  const {
    startDate,
    endDate,
    preset,
    minThreshold,
    category,
    setStartDate,
    setEndDate,
    setMinThreshold,
    setCategory,
    applyPreset,
    handleCustomDates,
    resetFilters,
  } = useFilter();

  return (
    <div className="bg-navy-900/90 border-b border-navy-800 px-6 py-2.5 flex flex-wrap items-center justify-between gap-4 backdrop-blur-md sticky top-16 z-10 text-xs">
      {/* Left side: Date Presets & Custom Pickers */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5 text-slate-400 font-medium mr-1">
          <Calendar className="h-3.5 w-3.5 text-teal-400" />
          <span>Period:</span>
        </div>

        {/* Preset Pills */}
        <div className="flex items-center gap-1 bg-navy-950 p-1 rounded-lg border border-navy-800">
          {DATE_PRESETS.map((p) => {
            const isActive = preset === p.id;
            return (
              <button
                key={p.id}
                onClick={() => applyPreset(p.id)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition ${
                  isActive
                    ? "bg-teal-500 text-navy-950 font-semibold shadow-sm"
                    : "text-slate-400 hover:text-slate-200 hover:bg-navy-900"
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>

        {/* Custom Start & End Date Inputs */}
        <div className="flex items-center gap-1.5 pl-2 border-l border-navy-800">
          <input
            type="date"
            min="2025-01-01"
            max="2025-12-31"
            value={startDate}
            onChange={(e) => handleCustomDates(e.target.value, endDate)}
            className="bg-navy-950 border border-navy-800 text-slate-200 rounded px-2 py-1 text-[11px] font-mono focus:outline-none focus:border-teal-500"
          />
          <span className="text-slate-500">to</span>
          <input
            type="date"
            min="2025-01-01"
            max="2025-12-31"
            value={endDate}
            onChange={(e) => handleCustomDates(startDate, e.target.value)}
            className="bg-navy-950 border border-navy-800 text-slate-200 rounded px-2 py-1 text-[11px] font-mono focus:outline-none focus:border-teal-500"
          />
        </div>
      </div>

      {/* Right side: Category Filter & Policy Threshold */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Category Filter */}
        <div className="flex items-center gap-1.5">
          <Layers className="h-3.5 w-3.5 text-teal-400" />
          <span className="text-slate-400 font-medium">Category:</span>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="bg-navy-950 border border-navy-800 text-slate-200 rounded-lg px-2.5 py-1 text-[11px] focus:outline-none focus:border-teal-500"
          >
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label} {c.type !== "all" ? `(${c.type})` : ""}
              </option>
            ))}
          </select>
        </div>

        {/* Policy Minimum Threshold */}
        <div className="flex items-center gap-1.5 pl-3 border-l border-navy-800">
          <Shield className="h-3.5 w-3.5 text-amber-400" />
          <span className="text-slate-400 font-medium">Min Reserve:</span>
          <div className="flex items-center gap-1 bg-navy-950 border border-navy-800 rounded-lg px-2 py-0.5">
            <span className="text-[11px] text-slate-400">₹</span>
            <input
              type="number"
              step="50000"
              min="0"
              max="50000000"
              value={minThreshold}
              onChange={(e) => setMinThreshold(Number(e.target.value))}
              className="w-20 bg-transparent text-slate-200 text-[11px] font-mono focus:outline-none text-right"
            />
          </div>
        </div>

        {/* Reset Filter Button */}
        <button
          onClick={resetFilters}
          title="Reset to default FY2025 filters"
          className="p-1 rounded-lg bg-navy-950 border border-navy-800 text-slate-400 hover:text-teal-400 hover:border-teal-500/40 transition"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
