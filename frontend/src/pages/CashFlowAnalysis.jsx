import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Filter,
  Calendar,
  Layers,
  BarChart3,
  TrendingUp,
  RefreshCw,
  Wallet
} from "lucide-react";
import { useFilter } from "../context/FilterContext";
import DataTable from "../components/DataTable";
import WaterfallChart from "../components/charts/WaterfallChart";
import CategoryBreakdownChart from "../components/charts/CategoryBreakdownChart";
import CashFlowBarChart from "../components/charts/CashFlowBarChart";
import ActualVsForecastChart from "../components/charts/ActualVsForecastChart";
import {
  fetchTransactions,
  fetchWaterfall,
  fetchCombinedForecast
} from "../api/client";
import { formatINR, formatDate } from "../utils/format";
import LoadingSkeleton from "../components/common/LoadingSkeleton";
import ErrorMessage from "../components/common/ErrorMessage";
import EmptyState from "../components/common/EmptyState";

export default function CashFlowAnalysis() {
  const { startDate, endDate, minThreshold, category, refreshKey } = useFilter();

  // Component state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [waterfallData, setWaterfallData] = useState(null);
  const [transactionsData, setTransactionsData] = useState({ summary: {}, by_category: [], by_period: [], data: [] });
  const [forecastCombined, setForecastCombined] = useState({ metadata: {}, data: [] });

  // Page-level controls
  const [periodType, setPeriodType] = useState("monthly"); // "monthly" | "weekly"
  const [typeFilter, setTypeFilter] = useState("all"); // "all" | "inflow" | "outflow"

  // Load all required analysis data
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const apiParams = {
        start_date: startDate,
        end_date: endDate,
        category: category !== "all" ? category : undefined
      };

      const [wfRes, txnRes, fcRes] = await Promise.all([
        fetchWaterfall(apiParams),
        fetchTransactions({
          ...apiParams,
          period_type: periodType,
          limit: 1460 // Fetch all matching in current range for responsive client-side table sorting & search
        }),
        fetchCombinedForecast({
          start_date: startDate,
          end_date: endDate
        })
      ]);

      setWaterfallData(wfRes);
      setTransactionsData(txnRes);
      setForecastCombined(fcRes);
    } catch (err) {
      console.error("Error loading cash flow analysis data:", err);
      setError(err.message || "Failed to load cash flow analytics");
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, category, periodType, refreshKey]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Client-side filtered rows for the transaction ledger table based on typeFilter
  // Must be called before any conditional early returns per React Rules of Hooks
  const tableData = useMemo(() => {
    const raw = transactionsData?.data || [];
    if (typeFilter === "all") return raw;
    return raw.filter((r) => r.transaction_type?.toLowerCase() === typeFilter.toLowerCase());
  }, [transactionsData?.data, typeFilter]);

  if (loading && !waterfallData) {
    return <LoadingSkeleton />;
  }

  if (error && !waterfallData) {
    return (
      <div className="space-y-6">
        <ErrorMessage
          title="Cash Flow Analytics Unavailable"
          message={error}
          onRetry={loadData}
        />
      </div>
    );
  }

  // Transaction table columns definition
  const tableColumns = [
    {
      header: "TXN ID",
      accessor: "transaction_id",
      className: "w-28 font-mono text-teal-400 font-semibold"
    },
    {
      header: "Date",
      accessor: "transaction_date",
      render: (r) => <span className="font-mono text-slate-300">{formatDate(r.transaction_date)}</span>
    },
    {
      header: "Type",
      accessor: "transaction_type",
      render: (r) => (
        <span
          className={`inline-flex items-center gap-1 font-semibold uppercase text-[11px] px-2 py-0.5 rounded ${
            r.transaction_type === "inflow"
              ? "bg-teal-500/10 text-teal-400 border border-teal-500/20"
              : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
          }`}
        >
          {r.transaction_type === "inflow" ? <ArrowDownLeft className="h-3 w-3" /> : <ArrowUpRight className="h-3 w-3" />}
          {r.transaction_type}
        </span>
      )
    },
    {
      header: "Category",
      accessor: "category",
      render: (r) => <span className="text-slate-200 font-medium">{r.category}</span>
    },
    {
      header: "Counterparty",
      accessor: "counterparty_id",
      className: "font-mono text-slate-400"
    },
    {
      header: "Amount (INR)",
      accessor: "amount_inr",
      headerAlign: "right",
      className: "text-right",
      cellClassName: "text-right font-mono font-medium",
      render: (r) => (
        <span className={r.transaction_type === "inflow" ? "text-teal-400 font-semibold" : "text-rose-300"}>
          {r.transaction_type === "inflow" ? "+" : "-"}{formatINR(r.amount_inr)}
        </span>
      )
    },
    {
      header: "Payment Status",
      accessor: "payment_status",
      render: (r) => (
        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
            r.payment_status === "Received" || r.payment_status === "Paid"
              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
              : "bg-amber-500/10 text-amber-400 border-amber-500/20"
          }`}
        >
          {r.payment_status}
        </span>
      )
    },
    {
      header: "Description",
      accessor: "description",
      className: "max-w-xs truncate text-slate-400",
      render: (r) => <span title={r.description || r.notes}>{r.description || r.notes || "-"}</span>
    }
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-navy-800 gap-3">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Wallet className="h-5 w-5 text-teal-400" />
            <span>Cash Flow Dynamics & 90-Day Forecast Bridge</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Complete liquidity reconciliation, category distribution, 90-day forward trajectory, and audited transaction ledger
          </p>
        </div>

        {/* Action Controls & Aggregation Toggle */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Monthly vs Weekly Period Toggle */}
          <div className="flex items-center bg-navy-950 p-1 rounded-lg border border-navy-800 text-xs">
            <span className="text-[11px] text-slate-500 px-2 font-mono">Aggregation:</span>
            <button
              onClick={() => setPeriodType("monthly")}
              className={`px-2.5 py-1 rounded transition-colors ${
                periodType === "monthly" ? "bg-teal-500 text-navy-950 font-semibold" : "text-slate-400 hover:text-white"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setPeriodType("weekly")}
              className={`px-2.5 py-1 rounded transition-colors ${
                periodType === "weekly" ? "bg-teal-500 text-navy-950 font-semibold" : "text-slate-400 hover:text-white"
              }`}
            >
              Weekly
            </button>
          </div>

          {/* Refresh Button */}
          <button
            onClick={loadData}
            title="Reload analysis"
            className="p-1.5 rounded-lg bg-navy-900 hover:bg-navy-800 border border-navy-800 text-slate-400 hover:text-teal-400 transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-teal-400" : ""}`} />
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-300 text-xs flex items-center justify-between">
          <span>Error loading cash flow data: {error}</span>
          <button onClick={loadData} className="px-3 py-1 bg-rose-900 rounded font-semibold text-white">
            Retry
          </button>
        </div>
      )}

      {/* Section 1: Waterfall Chart (Full Width) */}
      <WaterfallChart
        waterfallData={waterfallData}
        loading={loading}
        title="Liquidity Movement Waterfall (Opening Cash → Inflows → Outflows → Closing Cash)"
        subtitle={`Period: ${waterfallData?.summary?.start_date || startDate} to ${waterfallData?.summary?.end_date || endDate}`}
      />

      {/* Section 2: Two-Column Row: Category Breakdown + Actual vs Forecast Line Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CategoryBreakdownChart
          categoryData={transactionsData.by_category || []}
          loading={loading}
          title="Inflows & Outflows by Category"
          subtitle="Explore relative distribution in Treemap, Stacked Bar, or Horizontal format"
        />

        <ActualVsForecastChart
          data={forecastCombined.data || []}
          metadata={forecastCombined.metadata || {}}
          minThreshold={minThreshold || 750000}
          loading={loading}
          title="Actual Cash Balance vs. 90-Day Forward Forecast"
          subtitle="Visualizes continuity from historical cash through 90-day forecast horizon (shaded)"
        />
      </div>

      {/* Section 3: Periodic Dynamics Bar Chart (Monthly vs Weekly) */}
      <CashFlowBarChart
        data={transactionsData.by_period || []}
        title={`Cash Flow Periodic Dynamics (${periodType === "monthly" ? "Monthly" : "Weekly"} Inflows vs. Outflows)`}
      />

      {/* Section 4: Periodic Cash Dynamics Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-navy-900/60 border border-navy-800">
          <div className="text-xs text-slate-400 font-medium">Reconciled Total Inflows</div>
          <div className="text-lg font-bold font-mono text-teal-400 mt-1">
            {formatINR(transactionsData.summary?.total_inflow_inr, false)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Across {transactionsData.by_category?.filter((c) => c.transaction_type === "inflow").length || 5} operational categories
          </div>
        </div>

        <div className="p-4 rounded-xl bg-navy-900/60 border border-navy-800">
          <div className="text-xs text-slate-400 font-medium">Reconciled Total Outflows</div>
          <div className="text-lg font-bold font-mono text-rose-400 mt-1">
            {formatINR(transactionsData.summary?.total_outflow_inr, false)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Across {transactionsData.by_category?.filter((c) => c.transaction_type === "outflow").length || 8} operational categories
          </div>
        </div>

        <div className="p-4 rounded-xl bg-navy-900/60 border border-navy-800">
          <div className="text-xs text-slate-400 font-medium">Net Operating Cash Delta</div>
          <div className="text-lg font-bold font-mono text-cyan-300 mt-1">
            {formatINR(transactionsData.summary?.net_amount_inr, false)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Surplus generated over current period
          </div>
        </div>
      </div>

      {/* Section 5: Searchable, Sortable Transactions Table with Pagination & CSV Export */}
      <div className="space-y-3">
        <DataTable
          columns={tableColumns}
          data={tableData}
          title="Audited Cash Flow Transaction Ledger"
          subtitle="Search, sort, paginate, or export transaction records directly from API response"
          exportFileName={`transactions_${startDate}_to_${endDate}.csv`}
          searchPlaceholder="Search by TXN ID, counterparty, category, description..."
          initialPageSize={15}
          pageSizeOptions={[10, 15, 25, 50, 100]}
          extraActions={
            <div className="flex items-center gap-1 bg-navy-900 p-0.5 rounded-lg border border-navy-700/80 text-xs">
              <button
                onClick={() => setTypeFilter("all")}
                className={`px-2 py-1 rounded transition-colors ${
                  typeFilter === "all" ? "bg-teal-500 text-navy-950 font-semibold" : "text-slate-400 hover:text-white"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setTypeFilter("inflow")}
                className={`px-2 py-1 rounded transition-colors ${
                  typeFilter === "inflow" ? "bg-teal-500 text-navy-950 font-semibold" : "text-slate-400 hover:text-white"
                }`}
              >
                Inflows
              </button>
              <button
                onClick={() => setTypeFilter("outflow")}
                className={`px-2 py-1 rounded transition-colors ${
                  typeFilter === "outflow" ? "bg-teal-500 text-navy-950 font-semibold" : "text-slate-400 hover:text-white"
                }`}
              >
                Outflows
              </button>
            </div>
          }
        />
      </div>
    </div>
  );
}
