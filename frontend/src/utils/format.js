/**
 * Formatting utilities for monetary values, percentages, numbers, and dates.
 * Currency is INR (₹) per the dataset standard.
 * Fully defensive against null, undefined, NaN, unexpected types, and RangeErrors.
 */

export const formatINR = (value, compact = false, maxFractionDigits = 2) => {
  if (value === null || value === undefined) return "₹0.00";
  const num = Number(value);
  if (isNaN(num)) return "₹0.00";

  const sign = num < 0 ? "-" : "";
  const absNum = Math.abs(num);

  const safeMaxFrac =
    typeof maxFractionDigits === "number" && maxFractionDigits >= 0
      ? maxFractionDigits
      : 2;
  const isInt = Number.isInteger(num);
  const safeMinFrac = isInt ? 0 : Math.min(2, safeMaxFrac);

  if (compact) {
    if (absNum >= 1e7) {
      return `${sign}₹${(absNum / 1e7).toFixed(safeMaxFrac)} Cr`;
    }
    if (absNum >= 1e5) {
      return `${sign}₹${(absNum / 1e5).toFixed(safeMaxFrac)} L`;
    }
    if (absNum >= 1e3) {
      return `${sign}₹${(absNum / 1e3).toFixed(Math.min(1, safeMaxFrac))} K`;
    }
  }

  // Format standard Indian comma system: ₹1,23,456.78
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: safeMinFrac,
      maximumFractionDigits: safeMaxFrac,
    }).format(num);
  } catch {
    return `${sign}₹${absNum.toLocaleString("en-IN")}`;
  }
};

export const formatPercent = (value, decimals = 1) => {
  if (value === null || value === undefined) return "0.0%";
  const num = Number(value);
  if (isNaN(num)) return "0.0%";
  return `${num.toFixed(decimals)}%`;
};

export const formatNumber = (value, decimals = 0) => {
  if (value === null || value === undefined) return "0";
  const num = Number(value);
  if (isNaN(num)) return "0";
  try {
    return new Intl.NumberFormat("en-IN", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(num);
  } catch {
    return num.toFixed(decimals);
  }
};

export const formatDate = (dateStr) => {
  if (!dateStr) return "-";
  try {
    // If format is YYYY-MM-DD, parse year, month, day directly to avoid UTC timezone day-shift
    if (typeof dateStr === "string" && /^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
      const parts = dateStr.slice(0, 10).split("-");
      const year = Number(parts[0]);
      const month = Number(parts[1]);
      const day = Number(parts[2]);
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const m = months[month - 1] || "";
      return `${day} ${m} ${year}`;
    }

    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);

    return d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return String(dateStr);
  }
};
