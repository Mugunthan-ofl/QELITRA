import React from "react";
import { LayoutDashboard, TrendingUp, Receipt, ShieldAlert, Cpu, Sparkles } from "lucide-react";

export default function Sidebar({ activeTab, setActiveTab }) {
  const navItems = [
    { id: "overview", label: "Executive Overview", icon: LayoutDashboard },
    { id: "cashflow", label: "Cash Flow & Forecast", icon: TrendingUp },
    { id: "receivables", label: "Working Capital (AR/AP)", icon: Receipt },
    { id: "stress", label: "Stress Testing Engine", icon: ShieldAlert },
  ];

  return (
    <aside className="w-64 border-r border-navy-800 bg-navy-950 flex flex-col justify-between shrink-0 select-none">
      <div>
        {/* Brand Header */}
        <div className="p-5 border-b border-navy-800/80 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-amber-600 via-amber-400 to-yellow-300 flex items-center justify-center shadow-lg shadow-amber-500/25 shrink-0">
            <Sparkles className="h-5 w-5 text-navy-950 font-bold" />
          </div>
          <div>
            <h2 className="text-base font-extrabold tracking-wider text-white leading-tight">
              QELITRA
            </h2>
            <p className="text-[11px] text-amber-400 font-medium">Liquidity Command Center</p>
          </div>
        </div>

        {/* Navigation Section */}
        <div className="p-4 space-y-6">
          <div className="px-3 pt-1">
            <p className="text-[10px] font-bold text-slate-500 tracking-wider uppercase font-mono">Treasury Portals</p>
          </div>

          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                    isActive
                      ? "bg-gradient-to-r from-amber-500/20 to-amber-500/5 text-amber-300 border border-amber-500/35 shadow-sm shadow-amber-500/15"
                      : "text-slate-400 hover:text-slate-200 hover:bg-navy-900/60 border border-transparent"
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? "text-amber-400" : "text-slate-400"}`} />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Engine & Integrity Indicator */}
      <div className="p-4 m-3 rounded-xl bg-navy-900/80 border border-navy-800 text-xs space-y-2">
        <div className="flex items-center gap-2 text-slate-300 font-semibold text-[11px]">
          <Cpu className="h-3.5 w-3.5 text-amber-400" />
          <span>Python Analytics Engine</span>
        </div>
        <p className="text-[10px] text-slate-400 leading-relaxed">
          FastAPI backend computes all KPIs, rolling means, and stress tests. UI is purely display.
        </p>
        <div className="pt-1 border-t border-navy-800 flex items-center justify-between text-[10px]">
          <span className="text-slate-500">Repository</span>
          <span className="text-emerald-400 font-medium">Read-Only Verified</span>
        </div>
      </div>
    </aside>
  );
}
