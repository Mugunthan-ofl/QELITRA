import React, { useState, useMemo } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ReferenceLine,
} from "recharts";
import { BarChart3, ArrowDownUp, CheckCircle2, AlertTriangle, MousePointerClick } from "lucide-react";
import { formatINR } from "../../utils/format";

function CustomScenarioTooltip({ active, payload }) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const isBreached = data.has_breach || data.value < data.minimum_required_cash_inr;

    return (
      <div className="bg-navy-950/95 border border-navy-700 p-3.5 rounded-xl shadow-2xl backdrop-blur-md text-xs space-y-1.5 min-w-[220px]">
        <div className="flex items-center justify-between border-b border-navy-800 pb-1 font-mono">
          <span className="font-bold text-teal-400">{data.scenario_id}</span>
          <span className="text-slate-300 font-sans font-medium">{data.scenario_name}</span>
        </div>

        <div className="space-y-1 pt-1 font-mono text-[11px]">
          <div className="flex justify-between text-slate-400">
            <span>Inflow Reduction:</span>
            <span className="text-teal-400 font-bold">-{data.inflow_reduction_pct}%</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Outflow Increase:</span>
            <span className="text-rose-400 font-bold">+{data.outflow_increase_pct}%</span>
          </div>
          <div className="flex justify-between text-white font-semibold pt-1 border-t border-navy-800">
            <span>Ending Cash:</span>
            <span>{formatINR(data.ending_cash_inr || data.projected_closing_cash_inr)}</span>
          </div>
          <div className="flex justify-between text-amber-300 font-semibold">
            <span>Lowest Cash:</span>
            <span>{formatINR(data.minimum_cash_inr || data.minimum_cash)}</span>
          </div>
          <div className="flex justify-between text-slate-400 text-[10px]">
            <span>Required Threshold:</span>
            <span>{formatINR(data.minimum_required_cash_inr)}</span>
          </div>
        </div>

        <div className="pt-2 border-t border-navy-800 flex items-center justify-between text-[10px]">
          <span
            className={`font-semibold ${
              isBreached ? "text-rose-400" : "text-emerald-400"
            }`}
          >
            {isBreached ? "Threshold Breached" : "Solvency Buffer Intact"}
          </span>
          <span className="text-slate-500 italic">Click bar to load scenario</span>
        </div>
      </div>
    );
  }
  return null;
}

export default function ScenarioComparisonChart({
  scenarios = [],
  activeScenarioId = null,
  onSelectScenario,
  title = "All 22 Scenarios Ranked Comparison",
}) {
  const [rankingMetric, setRankingMetric] = useState("ending_cash"); // "ending_cash" | "minimum_cash"

  // Process & rank scenarios
  const sortedScenarios = useMemo(() => {
    if (!scenarios || scenarios.length === 0) return [];

    const mapped = scenarios.map((sc) => {
      const ending = Number(sc.ending_cash_inr ?? sc.projected_closing_cash_inr ?? 0);
      const minCash = Number(sc.minimum_cash_inr ?? ending);
      const threshold = Number(sc.minimum_required_cash_inr ?? 750000);
      const val = rankingMetric === "ending_cash" ? ending : minCash;

      let color = "#10B981"; // Emerald
      if (val < threshold) {
        color = "#F43F5E"; // Rose
      } else if (val <= threshold * 1.25) {
        color = "#F59E0B"; // Amber
      }

      return {
        ...sc,
        value: val,
        color: color,
        threshold: threshold,
      };
    });

    // Sort descending by selected metric
    return mapped.sort((a, b) => b.value - a.value);
  }, [scenarios, rankingMetric]);

  const thresholdValue = scenarios[0]?.minimum_required_cash_inr || 750000;

  return (
    <div className="bg-navy-900/80 border border-navy-800 rounded-xl p-5 space-y-4 shadow-xl backdrop-blur-md">
      {/* Header and Toggle Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-navy-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded bg-teal-500/10 text-teal-400">
            <BarChart3 className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide">{title}</h3>
            <p className="text-[10px] text-slate-400">
              Comparative solvency ranking of all 22 preset stress test scenarios
            </p>
          </div>
        </div>

        {/* Metric Switcher */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-medium">Rank By:</span>
          <div className="flex items-center rounded-lg bg-navy-950 p-0.5 border border-navy-750">
            <button
              type="button"
              onClick={() => setRankingMetric("ending_cash")}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition ${
                rankingMetric === "ending_cash"
                  ? "bg-teal-500 text-navy-950 shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Day 90 Ending Cash
            </button>
            <button
              type="button"
              onClick={() => setRankingMetric("minimum_cash")}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition ${
                rankingMetric === "minimum_cash"
                  ? "bg-teal-500 text-navy-950 shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Minimum Cash Level
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Helper Banner */}
      <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
        <div className="flex items-center gap-1.5 text-teal-400">
          <MousePointerClick className="h-3.5 w-3.5" />
          <span>Click any bar to load that scenario into the interactive fine-tuning panel</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-emerald-400">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            Above Minimum (&gt; ₹7.5L)
          </span>
          <span className="flex items-center gap-1 text-amber-400">
            <span className="h-2 w-2 rounded-full bg-amber-400" />
            Tight Buffer (&lt; 25%)
          </span>
          <span className="flex items-center gap-1 text-rose-400">
            <span className="h-2 w-2 rounded-full bg-rose-400" />
            Threshold Breached
          </span>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={sortedScenarios}
            margin={{ top: 15, right: 15, left: 15, bottom: 35 }}
            onClick={(state) => {
              if (state && state.activePayload && state.activePayload.length) {
                const sc = state.activePayload[0].payload;
                if (onSelectScenario) onSelectScenario(sc.scenario_id);
              }
            }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#1E293B"
              vertical={false}
              opacity={0.6}
            />

            <XAxis
              dataKey="scenario_id"
              stroke="#64748B"
              tick={{ fontSize: 9, fill: "#94A3B8", fontFamily: "monospace" }}
              tickLine={false}
              interval={0}
              angle={-45}
              textAnchor="end"
              height={40}
            />

            <YAxis
              stroke="#64748B"
              tick={{ fontSize: 10, fill: "#94A3B8", fontFamily: "monospace" }}
              tickLine={false}
              axisLine={{ stroke: "#1E293B" }}
              tickFormatter={(v) => formatINR(v, true)}
            />

            <Tooltip content={<CustomScenarioTooltip />} />

            <ReferenceLine
              y={thresholdValue}
              stroke="#EF4444"
              strokeDasharray="4 4"
              strokeWidth={1.5}
              label={{
                value: `Threshold ₹${(thresholdValue / 100000).toFixed(1)}L`,
                fill: "#EF4444",
                fontSize: 10,
                position: "insideTopRight",
              }}
            />

            <Bar
              dataKey="value"
              radius={[4, 4, 0, 0]}
              cursor="pointer"
            >
              {sortedScenarios.map((entry) => {
                const isSelected = activeScenarioId === entry.scenario_id;
                return (
                  <Cell
                    key={`cell-${entry.scenario_id}`}
                    fill={entry.color}
                    opacity={isSelected ? 1 : 0.85}
                    stroke={isSelected ? "#FFFFFF" : "transparent"}
                    strokeWidth={isSelected ? 2 : 0}
                  />
                );
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
