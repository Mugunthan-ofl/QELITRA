import React, { useEffect, useState } from "react";
import {
  DollarSign,
  TrendingUp,
  Flame,
  Scale,
  ShieldCheck,
  AlertTriangle,
  AlertCircle,
  Clock,
  Sparkles
} from "lucide-react";
import KPICard from "../components/KPICard";
import AlertsPanel from "../components/AlertsPanel";
import CashTrendChart from "../components/charts/CashTrendChart";
import CashFlowBarChart from "../components/charts/CashFlowBarChart";
import Gauge from "../components/charts/Gauge";
import LoadingSkeleton from "../components/common/LoadingSkeleton";
import ErrorMessage from "../components/common/ErrorMessage";
import { useFilter } from "../context/FilterContext";
import { fetchKpis, fetchCashPosition, fetchTransactions, fetchAlerts } from "../api/client";
import { formatINR, formatPercent } from "../utils/format";

export default function Overview() {
  const { startDate, endDate, minThreshold, category, refreshKey } = useFilter();

  const [kpis, setKpis] = useState(null);
  const [cashHistory, setCashHistory] = useState([]);
  const [cashFlowDynamics, setCashFlowDynamics] = useState([]);
  const [alertsData, setAlertsData] = useState({ alerts: [], summary: {}, overall_health: "Safe" });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const kpisParams = {
        start_date: startDate,
        end_date: endDate,
        min_threshold: minThreshold,
      };

      const cashParams = {
        start_date: startDate,
        end_date: endDate,
      };

      const txnParams = {
        start_date: startDate,
        end_date: endDate,
        category: category !== "all" ? category : undefined,
        limit: 50,
      };

      const alertsParams = {
        min_threshold: minThreshold,
      };

      const [kpiRes, cashRes, txnRes, alertRes] = await Promise.all([
        fetchKpis(kpisParams),
        fetchCashPosition(cashParams),
        fetchTransactions(txnParams),
        fetchAlerts(alertsParams),
      ]);

      setKpis(kpiRes);
      setCashHistory(cashRes);
      setCashFlowDynamics(txnRes.by_period || []);
      setAlertsData(alertRes);
    } catch (err) {
      console.error("Dashboard data load failed:", err);
      setError(err.message || "Failed to load corporate liquidity metrics.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [startDate, endDate, minThreshold, category, refreshKey]);

  if (loading && !kpis) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return (
      <div className="space-y-6">
        <ErrorMessage
          title="Liquidity Analytics Unavailable"
          message={error}
          onRetry={loadDashboardData}
        />
      </div>
    );
  }

  const cur = kpis?.current || {};
  const chg = kpis?.change_vs_previous || {};
  const per = kpis?.period || {};

  // Extract recent sparkline data points from cashHistory
  const cashSparkline = cashHistory.slice(-15).map((d) => d.closing_cash_balance_inr);
  const netFlowSparkline = cashHistory.slice(-15).map((d) => d.net_cash_flow_inr);

  // Status mapping
  const statusColor =
    cur.liquidity_status === "Safe"
      ? "teal"
      : cur.liquidity_status === "Warning"
      ? "amber"
      : "rose";

  return (
    <div className="space-y-6">
      {/* Top Row: 5 Headline KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* 1. Cash Balance */}
        <KPICard
          title="Closing Cash Position"
          value={formatINR(cur.closing_cash_inr)}
          subtext={`Min Policy: ${formatINR(cur.minimum_required_cash_inr)}`}
          icon={DollarSign}
          statusColor={cur.liquidity_buffer_ratio >= 1.5 ? "teal" : cur.liquidity_buffer_ratio >= 1.0 ? "amber" : "rose"}
          badge={`${cur.liquidity_buffer_ratio}x Buffer`}
          change={chg.cash_change_pct !== undefined ? `${chg.cash_change_pct >= 0 ? "+" : ""}${chg.cash_change_pct}%` : undefined}
          isPositive={chg.cash_change_pct >= 0}
          sparklineData={cashSparkline}
        />

        {/* 2. Net Cash Flow */}
        <KPICard
          title="Net Cash Flow"
          value={formatINR(cur.net_cash_flow_inr)}
          subtext={`In: ${formatINR(cur.total_inflow_inr, true)} | Out: ${formatINR(cur.total_outflow_inr, true)}`}
          icon={TrendingUp}
          statusColor={cur.net_cash_flow_inr >= 0 ? "teal" : "rose"}
          badge={`Margin: ${cur.net_margin_pct}%`}
          change={chg.net_flow_change_pct !== undefined ? `${chg.net_flow_change_pct >= 0 ? "+" : ""}${chg.net_flow_change_pct}%` : undefined}
          isPositive={cur.net_cash_flow_inr >= 0}
          sparklineData={netFlowSparkline}
        />

        {/* 3. Cash Runway */}
        <KPICard
          title="Cash Runway"
          value={`${cur.cash_runway_days} Days`}
          subtext={`Daily Burn: ${formatINR(cur.avg_daily_cash_burn_inr)} (${cur.cash_runway_months} Mo)`}
          icon={Flame}
          statusColor={cur.cash_runway_days >= 90 ? "teal" : cur.cash_runway_days >= 30 ? "amber" : "rose"}
          badge={cur.cash_runway_days >= 90 ? "3+ Months" : "< 3 Months"}
          change={chg.runway_days_change !== undefined ? `${chg.runway_days_change >= 0 ? "+" : ""}${chg.runway_days_change}d` : undefined}
          isPositive={chg.runway_days_change >= 0}
        />

        {/* 4. Current Ratio */}
        <KPICard
          title="Current Ratio (CR)"
          value={`${cur.current_ratio}x`}
          subtext={`Quick: ${cur.quick_ratio}x | Cash: ${cur.cash_ratio}x`}
          icon={Scale}
          statusColor={cur.current_ratio >= 1.15 ? "emerald" : cur.current_ratio >= 1.0 ? "amber" : "rose"}
          badge={`Gap: ${formatINR(cur.working_capital_gap_inr, true)}`}
          change={`DSO: ${cur.dso_days}d`}
          isPositive={cur.current_ratio >= 1.15}
        />

        {/* 5. Liquidity Status */}
        <div className={`bg-navy-900/70 border rounded-xl p-4 flex flex-col justify-between shadow-sm relative overflow-hidden ${
          statusColor === "teal" ? "border-teal-500/30" : statusColor === "amber" ? "border-amber-500/30" : "border-rose-500/30"
        }`}>
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">Solvency Rating</span>
              <span className="flex h-2.5 w-2.5 relative">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  statusColor === "teal" ? "bg-teal-400" : statusColor === "amber" ? "bg-amber-400" : "bg-rose-400"
                }`}></span>
                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                  statusColor === "teal" ? "bg-teal-500" : statusColor === "amber" ? "bg-amber-500" : "bg-rose-500"
                }`}></span>
              </span>
            </div>

            <div className="mt-2.5 flex items-baseline gap-2">
              <span className={`text-2xl font-bold tracking-tight font-mono ${
                statusColor === "teal" ? "text-teal-400" : statusColor === "amber" ? "text-amber-400" : "text-rose-400"
              }`}>
                {cur.liquidity_status}
              </span>
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-navy-800/80 flex items-center justify-between text-xs">
            <span className="text-[11px] text-slate-400">
              Buffer: <span className="font-mono text-white font-semibold">{cur.liquidity_buffer_ratio}x</span>
            </span>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
              statusColor === "teal" ? "bg-teal-500/10 text-teal-400" : statusColor === "amber" ? "bg-amber-500/10 text-amber-400" : "bg-rose-500/10 text-rose-400"
            }`}>
              {statusColor === "teal" ? "Basel Compliant" : statusColor === "amber" ? "Tight Buffer" : "Action Required"}
            </span>
          </div>
        </div>
      </div>

      {/* Primary Analytics Section: Cash Trend Line & Plotly Gauge */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <CashTrendChart
            data={cashHistory}
            minThreshold={minThreshold}
            title="Daily Cash Position Trajectory vs. Policy Minimum Threshold"
          />
        </div>

        <div>
          <Gauge
            value={cur.liquidity_buffer_ratio}
            minThreshold={minThreshold}
            title="Liquidity Buffer Multiplier"
            subtitle="Current Cash / Policy Reserve"
          />
        </div>
      </div>

      {/* Secondary Analytics Section: Inflow vs Outflow Dynamics & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <CashFlowBarChart
            data={cashFlowDynamics}
            title="Periodic Cash Flow Dynamics (Inflows vs. Outflows)"
          />
        </div>

        {/* Working Capital Summary Quick Card */}
        <div className="bg-navy-900/70 border border-navy-800 rounded-xl p-5 flex flex-col justify-between space-y-4">
          <div className="border-b border-navy-800 pb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Scale className="h-4 w-4 text-teal-400" />
              Working Capital Snapshot
            </h3>
            <span className="text-xs text-slate-400 font-mono">Current Asset Bridge</span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center p-2.5 rounded-lg bg-navy-850 border border-navy-800">
              <span className="text-slate-400">Closing Cash:</span>
              <span className="font-mono font-bold text-teal-400">{formatINR(cur.closing_cash_inr)}</span>
            </div>
            <div className="flex justify-between items-center p-2.5 rounded-lg bg-navy-850 border border-navy-800">
              <span className="text-slate-400">(+) Receivables Outstanding (AR):</span>
              <span className="font-mono font-bold text-emerald-400">+{formatINR(cur.receivables_outstanding_inr)}</span>
            </div>
            <div className="flex justify-between items-center p-2.5 rounded-lg bg-navy-850 border border-navy-800">
              <span className="text-slate-400">(-) Payables Outstanding (AP):</span>
              <span className="font-mono font-bold text-rose-400">-{formatINR(cur.payables_outstanding_inr)}</span>
            </div>
            <div className="flex justify-between items-center p-2.5 rounded-lg bg-teal-500/10 border border-teal-500/20 text-teal-300 font-semibold">
              <span>(=) Net Working Capital:</span>
              <span className="font-mono">{formatINR(cur.net_working_capital_inr)}</span>
            </div>
          </div>

          <div className="pt-2 border-t border-navy-800 grid grid-cols-2 gap-2 text-center text-xs">
            <div className="p-2 rounded bg-navy-950 border border-navy-800">
              <span className="text-[10px] text-slate-400 block">DSO Cycle</span>
              <span className="font-mono font-bold text-white">{cur.dso_days} Days</span>
            </div>
            <div className="p-2 rounded bg-navy-950 border border-navy-800">
              <span className="text-[10px] text-slate-400 block">DPO Cycle</span>
              <span className="font-mono font-bold text-white">{cur.dpo_days} Days</span>
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Alerts Section */}
      <div>
        <AlertsPanel
          alerts={alertsData.alerts}
          overallHealth={alertsData.overall_health}
          summary={alertsData.summary}
          onRetry={loadDashboardData}
        />
      </div>
    </div>
  );
}
