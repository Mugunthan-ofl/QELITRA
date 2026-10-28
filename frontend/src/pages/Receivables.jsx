import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  Receipt,
  AlertTriangle,
  CheckCircle,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  DollarSign,
  Calendar,
  RefreshCw,
  SlidersHorizontal
} from "lucide-react";
import { useFilter } from "../context/FilterContext";
import KPICard from "../components/KPICard";
import DataTable from "../components/DataTable";
import AgingBarChart from "../components/charts/AgingBarChart";
import OverdueDonutChart from "../components/charts/OverdueDonutChart";
import TopCounterpartiesCard from "../components/charts/TopCounterpartiesCard";
import { fetchArAp } from "../api/client";
import { formatINR, formatDate } from "../utils/format";
import LoadingSkeleton from "../components/common/LoadingSkeleton";
import ErrorMessage from "../components/common/ErrorMessage";
import EmptyState from "../components/common/EmptyState";

export default function Receivables() {
  const { startDate, endDate, refreshKey } = useFilter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [arApData, setArApData] = useState({
    totals: {},
    aging_schedule: [],
    overdue_vs_ontime: {},
    top_counterparties: { receivables: [], payables: [] },
    status_breakdown: [],
    data: []
  });

  // Filters local to Working Capital table
  const [invoiceTypeFilter, setInvoiceTypeFilter] = useState("all"); // "all" | "receivable" | "payable"
  const [statusFilter, setStatusFilter] = useState("all"); // "all" | "Paid" | "Partially paid" | "Unpaid"

  // Fetch AR/AP Data
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const apiParams = {
        start_date: startDate,
        end_date: endDate,
        limit: 1000 // Fetch all in range for complete analytics & client-side filtering
      };

      const res = await fetchArAp(apiParams);
      setArApData(res);
    } catch (err) {
      console.error("Error loading AR/AP data:", err);
      setError(err.message || "Failed to load receivables and payables data");
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, refreshKey]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Client-side filtered rows for DataTable
  // Must be called before any conditional early returns per React Rules of Hooks
  const filteredInvoices = useMemo(() => {
    let rows = arApData?.data || [];
    if (invoiceTypeFilter !== "all") {
      rows = rows.filter((r) => r.invoice_type?.toLowerCase() === invoiceTypeFilter.toLowerCase());
    }
    if (statusFilter !== "all") {
      rows = rows.filter((r) => r.status?.toLowerCase() === statusFilter.toLowerCase());
    }
    return rows;
  }, [arApData?.data, invoiceTypeFilter, statusFilter]);

  if (loading && (!arApData.data || arApData.data.length === 0)) {
    return <LoadingSkeleton />;
  }

  if (error && (!arApData.data || arApData.data.length === 0)) {
    return (
      <div className="space-y-6">
        <ErrorMessage
          title="Working Capital Analytics Unavailable"
          message={error}
          onRetry={loadData}
        />
      </div>
    );
  }

  const totals = arApData.totals || {};
  const rec = totals.receivables || {};
  const pay = totals.payables || {};
  const netPosition = totals.net_working_capital_gap_inr || 0;

  // Table Columns Definition
  const tableColumns = [
    {
      header: "Invoice ID",
      accessor: "invoice_id",
      className: "w-28 font-mono text-teal-400 font-semibold"
    },
    {
      header: "Type",
      accessor: "invoice_type",
      render: (r) => (
        <span
          className={`capitalize font-semibold text-[11px] px-2 py-0.5 rounded ${
            r.invoice_type === "receivable"
              ? "bg-teal-500/10 text-teal-400 border border-teal-500/20"
              : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
          }`}
        >
          {r.invoice_type === "receivable" ? "Receivable (AR)" : "Payable (AP)"}
        </span>
      )
    },
    {
      header: "Counterparty",
      accessor: "counterparty_id",
      className: "font-mono text-slate-300 font-medium"
    },
    {
      header: "Invoice Date",
      accessor: "invoice_date",
      render: (r) => <span className="font-mono text-slate-400">{formatDate(r.invoice_date)}</span>
    },
    {
      header: "Due Date",
      accessor: "due_date",
      render: (r) => {
        const isPastDue = r.status !== "Paid" && r.due_date < (totals.as_of_date || "2025-12-31");
        return (
          <span className={`font-mono ${isPastDue ? "text-rose-400 font-semibold" : "text-slate-300"}`}>
            {formatDate(r.due_date)}
          </span>
        );
      }
    },
    {
      header: "Days to Due",
      accessor: "days_to_due",
      headerAlign: "right",
      className: "text-right font-mono",
      cellClassName: "text-right font-mono text-xs",
      render: (r) => {
        const d = r.days_to_due;
        if (d < 0) {
          return <span className="text-rose-400 font-semibold">{Math.abs(d)}d Overdue</span>;
        }
        return <span className="text-slate-400">{d}d</span>;
      }
    },
    {
      header: "Invoice Amount",
      accessor: "invoice_amount_inr",
      headerAlign: "right",
      className: "text-right",
      cellClassName: "text-right font-mono text-slate-300",
      render: (r) => formatINR(r.invoice_amount_inr)
    },
    {
      header: "Amount Paid",
      accessor: "amount_paid_inr",
      headerAlign: "right",
      className: "text-right",
      cellClassName: "text-right font-mono text-emerald-400",
      render: (r) => formatINR(r.amount_paid_inr)
    },
    {
      header: "Outstanding",
      accessor: "outstanding_amount_inr",
      headerAlign: "right",
      className: "text-right",
      cellClassName: "text-right font-mono font-bold",
      render: (r) => (
        <span className={r.outstanding_amount_inr > 0 ? "text-amber-300" : "text-slate-500"}>
          {formatINR(r.outstanding_amount_inr)}
        </span>
      )
    },
    {
      header: "Status",
      accessor: "status",
      render: (r) => {
        const isPaid = r.status === "Paid";
        const isUnpaid = r.status === "Unpaid";
        return (
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
              isPaid
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                : isUnpaid
                ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                : "bg-amber-500/10 text-amber-400 border-amber-500/20"
            }`}
          >
            {r.status}
          </span>
        );
      }
    }
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-navy-800 gap-3">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Receipt className="h-5 w-5 text-teal-400" />
            <span>Working Capital Intelligence: Receivables & Payables</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Credit exposure, DSO/DPO efficiency metrics, aging schedules, delinquency ratios, and counterparty ledger
          </p>
        </div>

        {/* Global actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            title="Reload data"
            className="p-1.5 rounded-lg bg-navy-900 hover:bg-navy-800 border border-navy-800 text-slate-400 hover:text-teal-400 transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-teal-400" : ""}`} />
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-300 text-xs flex items-center justify-between">
          <span>Error loading working capital data: {error}</span>
          <button onClick={loadData} className="px-3 py-1 bg-rose-900 rounded font-semibold text-white">
            Retry
          </button>
        </div>
      )}

      {/* 5 Primary Working Capital KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* KPI 1: Total Receivables */}
        <KPICard
          title="Total Receivables (AR)"
          value={formatINR(rec.total_outstanding_inr)}
          subtext={`Billed: ${formatINR(rec.total_invoiced_inr, true)} (${rec.collection_rate_pct || 0}% collected)`}
          badge={`${rec.pending_count || 0} Pending`}
          statusColor="teal"
          icon={Receipt}
          loading={loading}
        />

        {/* KPI 2: Total Payables */}
        <KPICard
          title="Total Payables (AP)"
          value={formatINR(pay.total_outstanding_inr)}
          subtext={`Billed: ${formatINR(pay.total_billed_inr, true)} (${pay.settlement_rate_pct || 0}% settled)`}
          badge={`${pay.pending_count || 0} Pending`}
          statusColor="rose"
          icon={ArrowUpRight}
          loading={loading}
        />

        {/* KPI 3: Net Working Capital Position */}
        <KPICard
          title="Net Position (AR - AP)"
          value={formatINR(netPosition)}
          subtext={totals.gap_status || (netPosition >= 0 ? "Net Inflow Surplus" : "Net Outflow Demand")}
          badge={netPosition >= 0 ? "Surplus Asset" : "Deficit Liability"}
          statusColor={netPosition >= 0 ? "emerald" : "amber"}
          icon={DollarSign}
          loading={loading}
        />

        {/* KPI 4: DSO */}
        <KPICard
          title="DSO (Days Sales Out)"
          value={`${totals.dso_days || 0} Days`}
          subtext="Avg days to collect revenue from credit sales"
          badge={totals.dso_days <= 120 ? "Healthy Speed" : "Extended Cycle"}
          statusColor={totals.dso_days <= 120 ? "emerald" : "amber"}
          icon={Clock}
          loading={loading}
        />

        {/* KPI 5: DPO */}
        <KPICard
          title="DPO (Days Payables Out)"
          value={`${totals.dpo_days || 0} Days`}
          subtext="Avg days taken to disburse vendor liabilities"
          badge={totals.dpo_days >= 150 ? "Working Capital Favorable" : "Standard Cycle"}
          statusColor={totals.dpo_days >= 150 ? "teal" : "blue"}
          icon={Calendar}
          loading={loading}
        />
      </div>

      {/* Section 2: Visualizations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Aging Schedule Bar Chart (Span 2 columns on wide screens) */}
        <div className="lg:col-span-2">
          <AgingBarChart
            agingData={arApData.aging_schedule || []}
            loading={loading}
            title="Working Capital Aging Schedule (AR vs. AP)"
            subtitle="Outstanding liabilities and receivables distributed across days past due"
          />
        </div>

        {/* Overdue vs On-Time Donut Chart (Span 1 column) */}
        <div className="lg:col-span-1">
          <OverdueDonutChart
            overdueData={arApData.overdue_vs_ontime || {}}
            loading={loading}
            title="Overdue vs. On-Time Invoices"
            subtitle="Ratio of delinquent invoices past maturity date"
          />
        </div>
      </div>

      {/* Section 3: Top Counterparties Ranking Card */}
      <TopCounterpartiesCard
        topCounterparties={arApData.top_counterparties || { receivables: [], payables: [] }}
        loading={loading}
        title="Top 8 Counterparties by Outstanding Balance"
        subtitle="Identifies concentration risks across key corporate debtors and vendors"
      />

      {/* Section 4: Detail Invoices DataTable with Filters & Client CSV Export */}
      <div className="space-y-3">
        <DataTable
          columns={tableColumns}
          data={filteredInvoices}
          title="Detailed Working Capital Invoice Portfolio"
          subtitle="Search, sort, filter by type/status, and download CSV directly from browser"
          exportFileName={`invoices_${invoiceTypeFilter}_${statusFilter}.csv`}
          searchPlaceholder="Search by Invoice ID, Counterparty..."
          initialPageSize={15}
          pageSizeOptions={[10, 15, 25, 50, 100]}
          extraActions={
            <div className="flex flex-wrap items-center gap-2">
              {/* Invoice Type Filter */}
              <div className="flex items-center bg-navy-900 p-0.5 rounded-lg border border-navy-700/80 text-xs">
                <button
                  onClick={() => setInvoiceTypeFilter("all")}
                  className={`px-2 py-1 rounded transition-colors ${
                    invoiceTypeFilter === "all" ? "bg-teal-500 text-navy-950 font-semibold" : "text-slate-400 hover:text-white"
                  }`}
                >
                  All Types
                </button>
                <button
                  onClick={() => setInvoiceTypeFilter("receivable")}
                  className={`px-2 py-1 rounded transition-colors ${
                    invoiceTypeFilter === "receivable" ? "bg-teal-500 text-navy-950 font-semibold" : "text-slate-400 hover:text-white"
                  }`}
                >
                  AR Only
                </button>
                <button
                  onClick={() => setInvoiceTypeFilter("payable")}
                  className={`px-2 py-1 rounded transition-colors ${
                    invoiceTypeFilter === "payable" ? "bg-teal-500 text-navy-950 font-semibold" : "text-slate-400 hover:text-white"
                  }`}
                >
                  AP Only
                </button>
              </div>

              {/* Status Filter */}
              <div className="flex items-center bg-navy-900 p-0.5 rounded-lg border border-navy-700/80 text-xs">
                <button
                  onClick={() => setStatusFilter("all")}
                  className={`px-2 py-1 rounded transition-colors ${
                    statusFilter === "all" ? "bg-teal-500 text-navy-950 font-semibold" : "text-slate-400 hover:text-white"
                  }`}
                >
                  All Status
                </button>
                <button
                  onClick={() => setStatusFilter("Unpaid")}
                  className={`px-2 py-1 rounded transition-colors ${
                    statusFilter === "Unpaid" ? "bg-rose-500 text-white font-semibold" : "text-slate-400 hover:text-white"
                  }`}
                >
                  Unpaid
                </button>
                <button
                  onClick={() => setStatusFilter("Partially paid")}
                  className={`px-2 py-1 rounded transition-colors ${
                    statusFilter === "Partially paid" ? "bg-amber-500 text-navy-950 font-semibold" : "text-slate-400 hover:text-white"
                  }`}
                >
                  Partial
                </button>
                <button
                  onClick={() => setStatusFilter("Paid")}
                  className={`px-2 py-1 rounded transition-colors ${
                    statusFilter === "Paid" ? "bg-emerald-500 text-navy-950 font-semibold" : "text-slate-400 hover:text-white"
                  }`}
                >
                  Paid
                </button>
              </div>
            </div>
          }
        />
      </div>
    </div>
  );
}
