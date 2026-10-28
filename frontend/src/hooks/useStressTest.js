import { useState, useEffect, useRef, useCallback } from "react";
import {
  fetchScenarios,
  runStressSimulation,
  runMonteCarloSimulation,
} from "../api/client";

const DEFAULT_PARAMS = {
  scenarioId: "SCN001",
  inflowDrop: 0,
  outflowRise: 0,
  collectionDelay: 0,
  creditReduction: 0,
  minThreshold: 750000,
  projectionHorizon: 90,
  simulationsCount: 1000,
};

export function useStressTest() {
  const [scenarios, setScenarios] = useState([]);
  const [loadingScenarios, setLoadingScenarios] = useState(true);
  const [error, setError] = useState(null);

  // Parameter State
  const [params, setParams] = useState(DEFAULT_PARAMS);

  // Simulation Results
  const [stressResult, setStressResult] = useState(null);
  const [monteCarloResult, setMonteCarloResult] = useState(null);
  const [simulating, setSimulating] = useState(false);
  const [mcLoading, setMcLoading] = useState(false);

  // Debounce timers
  const stressDebounceRef = useRef(null);
  const mcDebounceRef = useRef(null);
  const isInitialMount = useRef(true);

  // 1. Fetch scenarios on initial load
  useEffect(() => {
    let mounted = true;
    fetchScenarios()
      .then((data) => {
        if (mounted) {
          setScenarios(data || []);
        }
      })
      .catch((err) => {
        if (mounted) setError(err.message);
      })
      .finally(() => {
        if (mounted) setLoadingScenarios(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  // 2. Core execution runner for deterministic stress test
  const executeStressRun = useCallback(async (currentParams) => {
    setSimulating(true);
    try {
      const payload = {
        scenario_id: currentParams.scenarioId,
        inflow_reduction_pct: Number(currentParams.inflowDrop),
        outflow_increase_pct: Number(currentParams.outflowRise),
        collection_delay_days: Number(currentParams.collectionDelay),
        credit_line_reduction_pct: Number(currentParams.creditReduction),
        minimum_cash_threshold: Number(currentParams.minThreshold),
        projection_horizon: Number(currentParams.projectionHorizon),
      };
      const res = await runStressSimulation(payload);
      setStressResult(res);
      setError(null);
      return res;
    } catch (err) {
      setError(err.message);
      console.error("Stress simulation error:", err);
    } finally {
      setSimulating(false);
    }
  }, []);

  // 3. Core execution runner for Monte Carlo simulation
  const executeMonteCarlo = useCallback(async (currentParams, sims) => {
    setMcLoading(true);
    try {
      const payload = {
        scenario_id: currentParams.scenarioId,
        inflow_reduction_pct: Number(currentParams.inflowDrop),
        outflow_increase_pct: Number(currentParams.outflowRise),
        collection_delay_days: Number(currentParams.collectionDelay),
        credit_line_reduction_pct: Number(currentParams.creditReduction),
        minimum_cash_threshold: Number(currentParams.minThreshold),
        projection_horizon: Number(currentParams.projectionHorizon),
        simulations: Number(sims || currentParams.simulationsCount || 1000),
      };
      const res = await runMonteCarloSimulation(payload);
      setMonteCarloResult(res);
      return res;
    } catch (err) {
      console.error("Monte Carlo simulation error:", err);
    } finally {
      setMcLoading(false);
    }
  }, []);

  // 4. Live update with debouncing when parameters change
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      // Run immediately on first mount
      executeStressRun(params);
      executeMonteCarlo(params, params.simulationsCount);
      return;
    }

    // Debounce stress test (180ms for instant snappy slider feel)
    if (stressDebounceRef.current) clearTimeout(stressDebounceRef.current);
    stressDebounceRef.current = setTimeout(() => {
      executeStressRun(params);
    }, 180);

    // Debounce Monte Carlo (300ms)
    if (mcDebounceRef.current) clearTimeout(mcDebounceRef.current);
    mcDebounceRef.current = setTimeout(() => {
      executeMonteCarlo(params, params.simulationsCount);
    }, 300);

    return () => {
      if (stressDebounceRef.current) clearTimeout(stressDebounceRef.current);
      if (mcDebounceRef.current) clearTimeout(mcDebounceRef.current);
    };
  }, [params, executeStressRun, executeMonteCarlo]);

  // Actions
  const updateParameter = (key, value) => {
    setParams((prev) => {
      const next = { ...prev, [key]: value };
      // If sliders are manually altered away from preset, tag scenarioId as custom
      if (key === "inflowDrop" || key === "outflowRise") {
        next.scenarioId = null;
      }
      return next;
    });
  };

  const selectScenario = (id) => {
    const sc = scenarios.find((s) => s.scenario_id === id);
    if (!sc) return;
    setParams((prev) => ({
      ...prev,
      scenarioId: id,
      inflowDrop: Number(sc.inflow_reduction_pct),
      outflowRise: Number(sc.outflow_increase_pct),
      minThreshold: Number(sc.minimum_required_cash_inr || 750000),
      collectionDelay: 0,
      creditReduction: 0,
    }));
  };

  const applyPreset = (presetKey) => {
    if (presetKey === "base") {
      setParams({
        ...DEFAULT_PARAMS,
        scenarioId: "SCN001",
        inflowDrop: 0,
        outflowRise: 0,
        collectionDelay: 0,
      });
    } else if (presetKey === "mild") {
      setParams({
        ...DEFAULT_PARAMS,
        scenarioId: "SCN002",
        inflowDrop: 10,
        outflowRise: 5,
        collectionDelay: 5,
      });
    } else if (presetKey === "severe") {
      setParams({
        ...DEFAULT_PARAMS,
        scenarioId: "SCN005",
        inflowDrop: 50,
        outflowRise: 30,
        collectionDelay: 15,
      });
    }
  };

  const reset = () => {
    setParams(DEFAULT_PARAMS);
  };

  const rerunMonteCarlo = (sims) => {
    const count = sims || params.simulationsCount;
    setParams((prev) => ({ ...prev, simulationsCount: count }));
    executeMonteCarlo(params, count);
  };

  return {
    scenarios,
    loadingScenarios,
    params,
    stressResult,
    monteCarloResult,
    simulating,
    mcLoading,
    error,
    // Actions
    updateParameter,
    selectScenario,
    applyPreset,
    reset,
    rerunMonteCarlo,
    // Backward compatibility for components expecting activeSimulation
    activeSimulation: stressResult,
    simulate: (inflowDrop, outflowRise) => {
      updateParameter("inflowDrop", inflowDrop);
      updateParameter("outflowRise", outflowRise);
    },
  };
}
