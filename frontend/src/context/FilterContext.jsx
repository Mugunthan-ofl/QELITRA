import React, { createContext, useContext, useState, useCallback } from "react";

const FilterContext = createContext(null);

export const DATE_PRESETS = [
  { id: "FY2025", label: "Full Year 2025", start: "2025-01-01", end: "2025-12-31" },
  { id: "H2_2025", label: "H2 2025 (Jul - Dec)", start: "2025-07-01", end: "2025-12-31" },
  { id: "Q4_2025", label: "Q4 2025 (Oct - Dec)", start: "2025-10-01", end: "2025-12-31" },
  { id: "30D", label: "Last 30 Days", start: "2025-12-02", end: "2025-12-31" },
  { id: "custom", label: "Custom Range", start: null, end: null },
];

export const CATEGORIES = [
  { id: "all", label: "All Categories", type: "all" },
  // Inflow categories
  { id: "Customer receipts", label: "Customer receipts", type: "inflow" },
  { id: "Service revenue", label: "Service revenue", type: "inflow" },
  { id: "Product sales", label: "Product sales", type: "inflow" },
  { id: "Contract payment", label: "Contract payment", type: "inflow" },
  { id: "Other income", label: "Other income", type: "inflow" },
  // Outflow categories
  { id: "Supplier payment", label: "Supplier payment", type: "outflow" },
  { id: "Payroll", label: "Payroll", type: "outflow" },
  { id: "Utilities", label: "Utilities", type: "outflow" },
  { id: "Tax", label: "Tax", type: "outflow" },
  { id: "Rent", label: "Rent", type: "outflow" },
  { id: "Software", label: "Software", type: "outflow" },
  { id: "Logistics", label: "Logistics", type: "outflow" },
  { id: "Marketing", label: "Marketing", type: "outflow" },
];

export function FilterProvider({ children }) {
  const [startDate, setStartDate] = useState("2025-01-01");
  const [endDate, setEndDate] = useState("2025-12-31");
  const [preset, setPreset] = useState("FY2025");
  const [minThreshold, setMinThreshold] = useState(750000.0);
  const [category, setCategory] = useState("all");
  const [lastUpdated, setLastUpdated] = useState(() => new Date().toLocaleTimeString("en-IN"));
  const [refreshKey, setRefreshKey] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const applyPreset = useCallback((presetId) => {
    setPreset(presetId);
    const found = DATE_PRESETS.find((p) => p.id === presetId);
    if (found && found.start && found.end) {
      setStartDate(found.start);
      setEndDate(found.end);
    }
  }, []);

  const handleCustomDates = useCallback((start, end) => {
    setPreset("custom");
    if (start) setStartDate(start);
    if (end) setEndDate(end);
  }, []);

  const triggerRefresh = useCallback(() => {
    setIsRefreshing(true);
    setRefreshKey((prev) => prev + 1);
    setLastUpdated(new Date().toLocaleTimeString("en-IN"));
    setTimeout(() => setIsRefreshing(false), 600);
  }, []);

  const resetFilters = useCallback(() => {
    setStartDate("2025-01-01");
    setEndDate("2025-12-31");
    setPreset("FY2025");
    setMinThreshold(750000.0);
    setCategory("all");
    triggerRefresh();
  }, [triggerRefresh]);

  const value = {
    startDate,
    endDate,
    preset,
    minThreshold,
    category,
    lastUpdated,
    refreshKey,
    isRefreshing,
    setStartDate,
    setEndDate,
    setMinThreshold,
    setCategory,
    applyPreset,
    handleCustomDates,
    triggerRefresh,
    resetFilters,
  };

  return <FilterContext.Provider value={value}>{children}</FilterContext.Provider>;
}

export function useFilter() {
  const context = useContext(FilterContext);
  if (!context) {
    throw new Error("useFilter must be used within a FilterProvider");
  }
  return context;
}

export const useFilters = useFilter;

