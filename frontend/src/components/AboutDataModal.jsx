import React, { useEffect } from "react";
import {
  Database,
  X,
  FileSpreadsheet,
  Cpu,
  ShieldCheck,
  ExternalLink,
  Layers,
  Info,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

export default function AboutDataModal({ isOpen, onClose }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const datasets = [
    {
      name: "cash_position_365_days.csv",
      rows: "365 daily rows",
      size: "27 KB",
      desc: "Daily opening balances, operational inflows, outflows, net cash flow, and minimum required reserve threshold (₹7.50L).",
      tags: ["Historical Ledger", "365 Days", "Treasury Summary"],
    },
    {
      name: "cash_flow_transactions_1460_rows.csv",
      rows: "1,460 transaction rows",
      size: "176 KB",
      desc: "Granular transaction records categorized into operating, investing, and financing flows with exact daily reconciliation.",
      tags: ["Operating Flows", "Categorized", "4 TXNs/Day"],
    },
    {
      name: "receivables_payables_1000_rows.csv",
      rows: "1,000 invoice rows",
      size: "99 KB",
      desc: "Invoice-level ledger covering receivables (AR) and payables (AP), payment terms, aging brackets, and counterparty credit ratings.",
      tags: ["Working Capital", "DSO / DPO", "Delinquency Aging"],
    },
    {
      name: "cash_flow_forecast_90_days.csv",
      rows: "90 forecast rows",
      size: "11 KB",
      desc: "Forward-looking 90-day daily operational projection serving as the deterministic foundation for stress testing and Monte Carlo simulations.",
      tags: ["Forward Horizon", "90 Days", "Baseline Path"],
    },
    {
      name: "stress_testing_22_scenarios.csv",
      rows: "22 scenario presets",
      size: "3.6 KB",
      desc: "Pre-configured risk scenarios: 6 named Basel/macroeconomic stress tests plus a 4x4 matrix of 16 multi-parameter shock combinations.",
      tags: ["Regulatory Scenarios", "Multi-Shock", "Basel III"],
    },
    {
      name: "dashboard_kpi_summary.csv",
      rows: "Summary row",
      size: "405 Bytes",
      desc: "Headline treasury balance metrics, total historical turnover, working capital balances, and automated consistency validation report.",
      tags: ["Executive KPIs", "Turnover", "Validation Check"],
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-md animate-fade-in">
      <div
        className="relative w-full max-w-3xl max-h-[90vh] bg-navy-900 border border-navy-750 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-navy-800 bg-navy-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-wide">
                About QELITRA & Dataset Inventory
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                Corporate Treasury Intelligence & Interactive Solvency Engine
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-navy-800 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-slate-300">
          {/* Architecture Banner */}
          <div className="p-4 rounded-xl bg-navy-950/80 border border-navy-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5 font-mono">
                <Cpu className="h-3.5 w-3.5" />
                Computation Architecture
              </span>
              <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-[10px]">
                Read-Only Data Integrity Verified
              </span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              All financial analytics, liquidity KPIs, rolling averages, deterministic stress simulations, and stochastic Monte Carlo iterations run strictly on the{" "}
              <strong className="text-white">Python backend</strong> (<code className="text-amber-400">backend/core/</code>). The React frontend acts as a presentation and control layer, sending parameters and displaying verified results.
            </p>
          </div>

          {/* Dataset Inventory Cards */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4 text-amber-400" />
                Underlying Corporate Datasets (data/ directory)
              </h4>
              <span className="text-[10px] text-slate-500 font-mono">6 Packaged Files</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {datasets.map((ds, i) => (
                <div
                  key={i}
                  className="p-3.5 rounded-xl bg-navy-850/70 border border-navy-800 hover:border-amber-500/30 transition-all space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-mono font-semibold text-white text-[11px] truncate" title={ds.name}>
                      {ds.name}
                    </span>
                    <span className="shrink-0 text-[10px] font-mono text-slate-400 px-1.5 py-0.5 rounded bg-navy-950 border border-navy-800">
                      {ds.rows}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    {ds.desc}
                  </p>

                  <div className="flex flex-wrap gap-1 pt-1">
                    {ds.tags.map((t, idx) => (
                      <span
                        key={idx}
                        className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-navy-900 border border-navy-750 text-slate-400"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Important Rules & Methodology */}
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200/90 space-y-1.5">
            <div className="flex items-center gap-2 font-semibold text-amber-300">
              <AlertCircle className="h-4 w-4 text-amber-400 shrink-0" />
              <span>Accounting Notice & Granularity Principle</span>
            </div>
            <p className="text-[11px] leading-relaxed text-amber-200/80">
              Daily cash summary amounts (<code className="text-amber-300">cash_position_365_days.csv</code>) and transaction line items (<code className="text-amber-300">cash_flow_transactions_1460_rows.csv</code>) represent the same underlying corporate flows at different granularities. Do not add daily summary balances to transaction amounts, as doing so would double-count turnover.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-navy-800 bg-navy-950/60 flex items-center justify-between">
          <span className="text-[10px] text-slate-500 font-mono">
            Standard: ISO 4217 Currency INR (₹) • Basel III LCR Framing
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-navy-950 font-bold text-xs transition"
          >
            Close Panel
          </button>
        </div>
      </div>
    </div>
  );
}
