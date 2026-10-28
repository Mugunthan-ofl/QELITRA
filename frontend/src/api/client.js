/**
 * API client to communicate with the FastAPI backend.
 * React only displays results fetched from these API endpoints.
 */

const BASE_URL = "/api";

function buildQueryString(params = {}) {
  const cleanParams = {};
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "") {
      cleanParams[k] = v;
    }
  }
  const q = new URLSearchParams(cleanParams).toString();
  return q ? `?${q}` : "";
}

export async function fetchKpis(params = {}) {
  const query = buildQueryString(params);
  const res = await fetch(`${BASE_URL}/kpis${query}`);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || "Failed to fetch KPIs");
  }
  return res.json();
}

export async function fetchCashPosition(params = {}) {
  const query = buildQueryString(params);
  const res = await fetch(`${BASE_URL}/cash-position${query}`);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || "Failed to fetch cash position");
  }
  return res.json();
}

export async function fetchTransactions(params = {}) {
  const query = buildQueryString(params);
  const res = await fetch(`${BASE_URL}/transactions${query}`);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || "Failed to fetch transactions");
  }
  return res.json();
}

export async function fetchWaterfall(params = {}) {
  const query = buildQueryString(params);
  const res = await fetch(`${BASE_URL}/transactions/waterfall${query}`);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || "Failed to fetch waterfall data");
  }
  return res.json();
}

export async function fetchCombinedForecast(params = {}) {
  const query = buildQueryString(params);
  const res = await fetch(`${BASE_URL}/forecast/combined${query}`);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || "Failed to fetch combined forecast");
  }
  return res.json();
}

export async function fetchForecast(params = {}) {
  const query = buildQueryString(params);
  const res = await fetch(`${BASE_URL}/forecast${query}`);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || "Failed to fetch forecast");
  }
  return res.json();
}

export async function fetchArAp(params = {}) {
  const query = buildQueryString(params);
  const res = await fetch(`${BASE_URL}/ar-ap${query}`);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || "Failed to fetch AR/AP data");
  }
  return res.json();
}

export async function fetchAlerts(params = {}) {
  const query = buildQueryString(params);
  const res = await fetch(`${BASE_URL}/alerts${query}`);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || "Failed to fetch alerts");
  }
  return res.json();
}

export async function fetchScenarios() {
  const res = await fetch(`${BASE_URL}/scenarios`);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || "Failed to fetch stress scenarios");
  }
  return res.json();
}

export async function runStressSimulation(payload) {
  const res = await fetch(`${BASE_URL}/stress/run`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || "Failed to run stress simulation");
  }
  return res.json();
}

export async function runMonteCarloSimulation(payload) {
  const res = await fetch(`${BASE_URL}/stress/monte-carlo`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || "Failed to run Monte Carlo simulation");
  }
  return res.json();
}
