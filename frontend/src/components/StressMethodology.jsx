import React, { useState } from "react";
import {
  BookOpen,
  ChevronDown,
  ChevronUp,
  Cpu,
  Layers,
  Shield,
  FileText,
  Percent,
  Sigma,
} from "lucide-react";

export default function StressMethodology({
  methodologyText = "",
  monteCarloMethodology = "",
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-navy-900/80 border border-navy-800 rounded-xl overflow-hidden shadow-xl backdrop-blur-md transition-all">
      {/* Collapsible Header */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-navy-950/70 hover:bg-navy-950 transition text-left"
      >
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-lg bg-teal-500/10 border border-teal-500/20 text-teal-400">
            <BookOpen className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
              <span>Stress Testing & Monte Carlo Methodology</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 font-mono">
                Mathematical Reference
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Detailed technical formulation for deterministic shock cascades and stochastic log-normal simulation
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-slate-400 text-xs font-medium">
          <span>{isOpen ? "Collapse Details" : "Expand Methodology"}</span>
          {isOpen ? (
            <ChevronUp className="h-4 w-4 text-teal-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-slate-400" />
          )}
        </div>
      </button>

      {/* Collapsible Body */}
      {isOpen && (
        <div className="p-5 border-t border-navy-800 space-y-6 text-xs text-slate-300 leading-relaxed">
          {/* Active Python Methodology Output */}
          {methodologyText && (
            <div className="p-3.5 rounded-lg bg-teal-500/5 border border-teal-500/20 text-teal-200 font-mono text-[11px] space-y-1">
              <span className="text-[10px] uppercase font-bold text-teal-400 tracking-wider block font-sans">
                Active Runtime Calibration (Backend Python Core)
              </span>
              <p>{methodologyText}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 1. Deterministic Shock Mathematics */}
            <div className="space-y-3 p-4 rounded-xl bg-navy-950/50 border border-navy-800">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <Layers className="h-4 w-4 text-teal-400" />
                <h4>1. Deterministic Liquidity Shock Formulation</h4>
              </div>

              <p className="text-slate-400">
                The deterministic model projects day-by-day cash evolution across the chosen horizon
                (<strong className="text-white">H = 90 days</strong>) by compounding baseline forecast flows with
                revenue reduction, collection delays, and expenditure surge shocks:
              </p>

              <div className="space-y-2 font-mono text-[11px] bg-navy-900/90 p-3 rounded-lg border border-navy-750 text-slate-200">
                <div>
                  <span className="text-teal-400">Stressed Inflow(t):</span>
                  <div className="text-slate-300 ml-2">
                    I_stressed(t) = I_base(t - d) × (1 - δ_inflow)
                  </div>
                  <span className="text-[10px] text-slate-500 ml-2">
                    Where d = collection delay days, δ_inflow = revenue drop %
                  </span>
                </div>

                <div className="pt-2 border-t border-navy-800">
                  <span className="text-rose-400">Stressed Outflow(t):</span>
                  <div className="text-slate-300 ml-2">
                    O_stressed(t) = O_base(t) × (1 + δ_outflow)
                  </div>
                  <span className="text-[10px] text-slate-500 ml-2">
                    Where δ_outflow = expense surge %
                  </span>
                </div>

                <div className="pt-2 border-t border-navy-800">
                  <span className="text-cyan-400">Cash Balance Compounding:</span>
                  <div className="text-slate-300 ml-2">
                    Cash(t) = Cash(t-1) + I_stressed(t) - O_stressed(t)
                  </div>
                </div>

                <div className="pt-2 border-t border-navy-800">
                  <span className="text-amber-400">Breach Condition & Runway:</span>
                  <div className="text-slate-300 ml-2">
                    Breach = argmin_t &#123; t | Cash(t) &lt; Threshold &#125;
                  </div>
                  <span className="text-[10px] text-slate-500 ml-2">
                    Runway is the day count until the first breach occurrence.
                  </span>
                </div>
              </div>
            </div>

            {/* 2. Stochastic Monte Carlo Simulation */}
            <div className="space-y-3 p-4 rounded-xl bg-navy-950/50 border border-navy-800">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <Sigma className="h-4 w-4 text-teal-400" />
                <h4>2. Stochastic Monte Carlo Engine (1,000 Iterations)</h4>
              </div>

              <p className="text-slate-400">
                To capture liquidity tail risk and realistic dispersion around stressed estimates,
                the engine runs 500 to 1,000 stochastic trajectories using log-normal multipliers:
              </p>

              <div className="space-y-2 font-mono text-[11px] bg-navy-900/90 p-3 rounded-lg border border-navy-750 text-slate-200">
                <div>
                  <span className="text-teal-400">Log-Normal Multiplier:</span>
                  <div className="text-slate-300 ml-2">
                    M_i(t) = exp(-0.5 · σ² + σ · Z), where Z ~ N(0, 1)
                  </div>
                  <span className="text-[10px] text-slate-500 ml-2">
                    Preserves mean expectation via Jensen inequality drift adjustment
                  </span>
                </div>

                <div className="pt-2 border-t border-navy-800">
                  <span className="text-amber-400">Empirical Volatility Calibration:</span>
                  <div className="text-slate-300 ml-2">
                    σ_inflow = 25.0% | σ_outflow = 15.0%
                  </div>
                  <span className="text-[10px] text-slate-500 ml-2">
                    Calibrated directly against coefficient of variation from 365-day historical ledger
                  </span>
                </div>

                <div className="pt-2 border-t border-navy-800">
                  <span className="text-rose-400">Breach Probability P(Breach):</span>
                  <div className="text-slate-300 ml-2">
                    P = (1 / N) · ∑ [ ∃ t ∈ [1, H] : Cash_sim(t) &lt; Threshold ]
                  </div>
                  <span className="text-[10px] text-slate-500 ml-2">
                    Percentage of simulated trajectories that breach the minimum threshold at any point
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Regulatory Alignment & Debt Facility Notes */}
          <div className="p-4 rounded-xl bg-navy-950/30 border border-navy-800/80 space-y-2">
            <div className="flex items-center gap-2 text-white font-bold">
              <Shield className="h-4 w-4 text-emerald-400" />
              <h4>3. Regulatory Framing & Corporate Capital Structure</h4>
            </div>
            <p className="text-slate-400 text-xs">
              <strong>Basel III Alignment:</strong> The 30-day and 90-day stress horizons mirror Basel III Liquidity Coverage Ratio (LCR)
              and Net Stable Funding Ratio (NSFR) liquidity buffer principles. The ₹7,50,000 threshold acts as an unencumbered high-quality liquid asset (HQLA) reserve floor.
            </p>
            <p className="text-slate-400 text-xs">
              <strong>Credit Facility Notice:</strong> Corporate records do not contain external revolving debt or overdraft lines (all operations are funded from internal equity reserves and operational cash flows). The credit line reduction parameter is provided for regulatory model compatibility but is inactive.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
