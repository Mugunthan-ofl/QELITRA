import React, { useState } from "react";
import { Users, Building2, ExternalLink } from "lucide-react";
import { formatINR } from "../../utils/format";

/**
 * Top Counterparties Card:
 * Lists top counterparties by outstanding credit exposure across Customers (AR) and Vendors (AP).
 */
export default function TopCounterpartiesCard({
  topCounterparties = { receivables: [], payables: [] },
  loading = false,
  title = "Top Counterparty Credit Exposures",
  subtitle = "Largest outstanding balances concentrated across debtors and creditors"
}) {
  const [activeTab, setActiveTab] = useState("receivables"); // "receivables" | "payables"

  if (loading) {
    return (
      <div className="bg-navy-900/70 border border-navy-800 rounded-xl p-5 h-80 flex items-center justify-center animate-pulse">
        <div className="flex flex-col items-center gap-2 text-slate-500">
          <Building2 className="h-8 w-8 text-amber-500/50 animate-bounce" />
          <p className="text-xs">Ranking top counterparty exposure...</p>
        </div>
      </div>
    );
  }

  const list = activeTab === "receivables" ? topCounterparties.receivables || [] : topCounterparties.payables || [];
  const maxAmount = list.length > 0 ? Math.max(...list.map((c) => c.outstanding_amount_inr)) : 1;

  return (
    <div className="bg-navy-900/70 border border-navy-800 rounded-xl p-5 space-y-4 backdrop-blur-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-navy-800/80 gap-2">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-amber-400" />
            <h3 className="text-sm font-semibold text-white tracking-wide">{title}</h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-navy-950 p-1 rounded-lg border border-navy-800 text-xs">
          <button
            onClick={() => setActiveTab("receivables")}
            className={`px-2.5 py-1 rounded transition-colors ${
              activeTab === "receivables"
                ? "bg-amber-500 text-navy-950 font-semibold"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Top Customers (AR)
          </button>
          <button
            onClick={() => setActiveTab("payables")}
            className={`px-2.5 py-1 rounded transition-colors ${
              activeTab === "payables"
                ? "bg-rose-500 text-white font-semibold"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Top Vendors (AP)
          </button>
        </div>
      </div>

      {/* Counterparties List */}
      <div className="space-y-3">
        {list.length === 0 ? (
          <p className="text-xs text-slate-500 text-center py-8">No counterparties recorded.</p>
        ) : (
          list.map((item, idx) => {
            const pct = (item.outstanding_amount_inr / maxAmount) * 100;
            const isAR = activeTab === "receivables";
            return (
              <div key={idx} className="space-y-1.5 p-2 rounded-lg hover:bg-navy-800/40 transition-colors">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-navy-950 text-slate-400 border border-navy-800">
                      #{idx + 1}
                    </span>
                    <span className="font-mono font-bold text-slate-200">{item.counterparty_id}</span>
                    <span className="text-[11px] text-slate-500">({item.invoices_count} invoices)</span>
                  </div>

                  <div className="font-mono font-semibold text-slate-200">
                    {formatINR(item.outstanding_amount_inr)}
                  </div>
                </div>

                {/* Relative progress bar */}
                <div className="w-full h-1.5 rounded-full bg-navy-950 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isAR ? "bg-amber-500" : "bg-rose-500"
                    }`}
                    style={{ width: `${pct}%` }}
                  ></div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
