import React, { useState } from "react";
import { FilterProvider } from "./context/FilterContext";
import { ThemeProvider, useTheme } from "./context/ThemeContext";
import Header from "./components/layout/Header";
import Sidebar from "./components/layout/Sidebar";
import FilterBar from "./components/layout/FilterBar";
import TabNav from "./components/layout/TabNav";
import Overview from "./pages/Overview";
import CashFlowAnalysis from "./pages/CashFlowAnalysis";
import Receivables from "./pages/Receivables";
import StressTesting from "./pages/StressTesting";
import ErrorBoundary from "./components/common/ErrorBoundary";

function AppContent() {
  const [activeTab, setActiveTab] = useState("overview");
  const { isDark } = useTheme();

  const titles = {
    overview: "Corporate Liquidity Executive Command Center",
    cashflow: "Cash Flow Dynamics & 90-Day Forecast",
    receivables: "Working Capital Management (AR & AP)",
    stress: "Real-Time Cash Flow Stress Testing Engine",
  };

  return (
    <div
      className={`flex h-screen overflow-hidden font-sans transition-colors duration-300 ${
        isDark ? "bg-[#070B14] text-slate-100" : "bg-slate-900 text-slate-100"
      }`}
    >
      {/* Sidebar Navigation */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Sticky Header with Title and Refresh */}
        <Header pageTitle={titles[activeTab] || "Liquidity Command Center"} />

        {/* Global Filter Bar (shared across all pages) */}
        <FilterBar />

        {/* Tab Navigation */}
        <TabNav activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Dynamic Page Content with smooth transition */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-gradient-to-b from-[#070B14] via-[#0B1120] to-[#070B14]">
          <div className="max-w-7xl mx-auto space-y-6 transition-opacity duration-200">
            {activeTab === "overview" && (
              <div className="animate-fade-in">
                <ErrorBoundary
                  title="Executive Overview Error"
                  fallbackAction={
                    <button
                      onClick={() => setActiveTab("overview")}
                      className="px-3 py-1.5 rounded-lg bg-navy-800 text-slate-200 text-xs hover:text-white"
                    >
                      Reload Overview
                    </button>
                  }
                >
                  <Overview />
                </ErrorBoundary>
              </div>
            )}
            {activeTab === "cashflow" && (
              <div className="animate-fade-in">
                <ErrorBoundary
                  title="Cash Flow & Forecast Error"
                  fallbackAction={
                    <button
                      onClick={() => setActiveTab("overview")}
                      className="px-3 py-1.5 rounded-lg bg-navy-800 text-slate-200 text-xs hover:text-white"
                    >
                      Return to Executive Overview
                    </button>
                  }
                >
                  <CashFlowAnalysis />
                </ErrorBoundary>
              </div>
            )}
            {activeTab === "receivables" && (
              <div className="animate-fade-in">
                <ErrorBoundary
                  title="Working Capital (AR/AP) Error"
                  fallbackAction={
                    <button
                      onClick={() => setActiveTab("overview")}
                      className="px-3 py-1.5 rounded-lg bg-navy-800 text-slate-200 text-xs hover:text-white"
                    >
                      Return to Executive Overview
                    </button>
                  }
                >
                  <Receivables />
                </ErrorBoundary>
              </div>
            )}
            {activeTab === "stress" && (
              <div className="animate-fade-in">
                <ErrorBoundary
                  title="Stress Testing Engine Error"
                  fallbackAction={
                    <button
                      onClick={() => setActiveTab("overview")}
                      className="px-3 py-1.5 rounded-lg bg-navy-800 text-slate-200 text-xs hover:text-white"
                    >
                      Return to Executive Overview
                    </button>
                  }
                >
                  <StressTesting />
                </ErrorBoundary>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <FilterProvider>
        <AppContent />
      </FilterProvider>
    </ThemeProvider>
  );
}
