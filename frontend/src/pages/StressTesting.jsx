import React from "react";
import {
  ShieldAlert,
  Zap,
  Layers,
  Activity,
  BarChart3,
  TrendingDown,
  Calendar,
  Sparkles,
} from "lucide-react";
import StressPanel from "../components/StressPanel";
import StressStatusBanner from "../components/StressStatusBanner";
import StressLineChart from "../components/charts/StressLineChart";
import StressComparisonTable from "../components/StressComparisonTable";
import MonteCarloFanChart from "../components/charts/MonteCarloFanChart";
import ScenarioComparisonChart from "../components/charts/ScenarioComparisonChart";
import StressMethodology from "../components/StressMethodology";
import { useStressTest } from "../hooks/useStressTest";
import { formatINR } from "../utils/format";
import LoadingSkeleton from "../components/common/LoadingSkeleton";
import ErrorMessage from "../components/common/ErrorMessage";

export default function StressTesting() {
  const {
    scenarios,
    loadingScenarios,
    params,
    stressResult,
    monteCarloResult,
    simulating,
    mcLoading,
    error,
    updateParameter,
    selectScenario,
    applyPreset,
    reset,
    rerunMonteCarlo,
  } = useStressTest();

  if (loadingScenarios && !stressResult) {
    return <LoadingSkeleton />;
  }

  if (error && !stressResult) {
    return (
      <div className="space-y-6">
        <ErrorMessage
          title="Stress Testing Engine Unavailable"
          message={error}
          onRetry={reset}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-navy-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white tracking-tight">
              Cash Flow Stress Testing & Stochastic Solvency Simulator
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-teal-500/10 border border-teal-500/20 text-teal-400">
              Live Python Engine
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Deterministic liquidity shock modeling and 1,000-iteration Monte Carlo fan dispersion (90-Day Projection Horizon)
          </p>
        </div>

        {/* Global Metadata Badges */}
        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-lg bg-navy-900 border border-navy-800 text-xs font-mono text-slate-300">
            Opening Reserve: <strong className="text-teal-400">{formatINR(8088600, true)}</strong>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-navy-900 border border-navy-800 text-xs font-mono text-slate-300">
            Min Floor: <strong className="text-cyan-400">{formatINR(params.minThreshold, true)}</strong>
          </div>
        </div>
      </div>

      {/* Global Error Alert if any */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between">
          <span>Failed to execute stress simulation: {error}</span>
          <button
            onClick={reset}
            className="px-2 py-1 rounded bg-rose-500/20 hover:bg-rose-500/30 text-white font-mono text-[10px]"
          >
            Reset Model
          </button>
        </div>
      )}

      {/* 1. Status Banner (Safe / Warning / Critical) */}
      <StressStatusBanner stressResult={stressResult} />

      {/* 2. Interactive Main Grid: StressPanel Controls & Real-Time Projections */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Interactive Stress Controls Panel */}
        <div className="lg:col-span-4 sticky top-4">
          <StressPanel
            scenarios={scenarios}
            params={params}
            updateParameter={updateParameter}
            selectScenario={selectScenario}
            applyPreset={applyPreset}
            reset={reset}
            simulating={simulating}
            mcLoading={mcLoading}
          />
        </div>

        {/* Right Column: Baseline vs. Stressed Cash Line Chart & Comparison Table */}
        <div className="lg:col-span-8 space-y-6">
          {/* Baseline vs. Stressed Cash Line Chart */}
          <StressLineChart
            baselineSeries={stressResult?.baseline_series || []}
            stressedSeries={stressResult?.stressed_series || []}
            breachDate={stressResult?.breach_date}
            breachDay={stressResult?.breach_day}
            minThreshold={params.minThreshold}
            title="Baseline vs. Stressed Daily Projected Cash Trajectory"
          />

          {/* Side-by-Side Comparison Table */}
          <StressComparisonTable stressResult={stressResult} />
        </div>
      </div>

      {/* 3. Monte Carlo Stochastic Fan Chart & Probability of Breach */}
      <div className="space-y-3">
        <MonteCarloFanChart
          monteCarloResult={monteCarloResult}
          loading={mcLoading}
          onRerunSimulations={rerunMonteCarlo}
        />
      </div>

      {/* 4. Scenario Comparison: Bar Chart Ranking All 22 Scenarios */}
      <div className="space-y-3">
        <ScenarioComparisonChart
          scenarios={scenarios}
          activeScenarioId={params.scenarioId}
          onSelectScenario={selectScenario}
        />
      </div>

      {/* 5. Collapsible Methodology Section */}
      <div className="space-y-3">
        <StressMethodology
          methodologyText={stressResult?.methodology}
          monteCarloMethodology={monteCarloResult?.methodology}
        />
      </div>
    </div>
  );
}
