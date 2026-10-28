import React from "react";

export default function TabNav({ activeTab, setActiveTab }) {
  const tabs = [
    { id: "overview", label: "Executive Overview" },
    { id: "cashflow", label: "Cash Flow & Forecast" },
    { id: "receivables", label: "Receivables & Payables" },
    { id: "stress", label: "Stress Testing" },
  ];

  return (
    <div className="flex border-b border-navy-800 bg-navy-900/40 px-6 gap-2">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors duration-150 ${
              isActive
                ? "border-teal-400 text-teal-400"
                : "border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700"
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
