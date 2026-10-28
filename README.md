# LiquidityPulse — Corporate Liquidity Management & Interactive Cash Flow Stress Testing Platform

![License](https://img.shields.io/badge/License-MIT-blue.svg)
![Python](https://img.shields.io/badge/Python-3.10%2B-blue?logo=python)
![FastAPI](https://img.shields.io/badge/FastAPI-0.111%2B-teal?logo=fastapi)
![React](https://img.shields.io/badge/React-18.3-cyan?logo=react)
![Vite](https://img.shields.io/badge/Vite-5.4-purple?logo=vite)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC?logo=tailwind-css)
![Plotly](https://img.shields.io/badge/Plotly.js-2.35-red?logo=plotly)
![Data_Integrity](https://img.shields.io/badge/Data_Directory-READ--ONLY_Verified-emerald)

An institutional-grade executive treasury command center and interactive solvency stress-testing platform. Built for corporate treasurers, CFOs, and risk managers to monitor enterprise cash velocity, optimize working capital cycles, forecast forward liquidity, and conduct real-time Basel III-aligned solvency stress tests with stochastic Monte Carlo fan dispersion.

---

## 📸 Platform Previews & Visuals

### 1. Real-Time Cash Flow Stress Testing & Stochastic Simulator
![Real-Time Cash Flow Stress Testing & Solvency Simulator](docs/screenshots/stress_testing_overview.png)
*Figure 1: Interactive 90-Day Stress Testing Engine with Basel scenario dropdown, multi-parameter sliders, baseline vs. stressed trajectory line chart with breach marker, and side-by-side solvency variance audit.*

---

### 2. Monte Carlo 1,000-Iteration Fan Chart & Breach Probability
![Monte Carlo Stochastic Fan Chart](docs/screenshots/monte_carlo_fan_chart.png)
*Figure 2: Stochastic Monte Carlo Fan Chart (Plotly) depicting 5th, 25th, 50th, 75th, and 95th percentile confidence bands with large-format breach probability indicator.*

---

### 3. Corporate Liquidity Executive Command Center
![Corporate Liquidity Executive Overview](docs/screenshots/executive_overview.png)
*Figure 3: Executive treasury KPIs, solvency buffer ratio, cash runway counter, solvency health gauge, and 365-day cash position trajectory.*

---

### 4. Working Capital Management (AR & AP Intelligence)
![Working Capital Management](docs/screenshots/working_capital_ar_ap.png)
*Figure 4: Accounts Receivable & Accounts Payable aging schedules, DSO/DPO metrics, counterparty exposure cards, and searchable invoice ledger.*

---

## 🏛 System Architecture

The platform strictly adheres to a clean separation of concerns and data governance:

```
Liquidity_Management/
├── backend/                  # Python FastAPI Analytical Backend
│   ├── core/                 # Pure Python Financial & Statistical Computation Engine
│   │   ├── data_loader.py    # In-memory cached reader (Reads strictly read-only data/)
│   │   ├── metrics.py        # KPIs, Cash Conversion Cycle, Rolling Averages, Runway
│   │   ├── stress.py         # Deterministic Shock Cascades & 1,000-Iteration Monte Carlo Engine
│   │   └── utils.py          # Numeric sanitization & date parsing utilities
│   ├── routes/               # RESTful API Endpoint Controllers
│   │   ├── overview.py       # GET /api/kpis, GET /api/cash-position, GET /api/alerts
│   │   ├── cashflow.py       # GET /api/transactions, GET /api/forecast, GET /api/transactions/waterfall
│   │   ├── receivables.py    # GET /api/ar-ap (AR/AP schedules, aging brackets, counterparty risk)
│   │   └── stress.py         # GET /api/scenarios, POST /api/stress/run, POST /api/stress/monte-carlo
│   ├── main.py               # FastAPI App entrypoint, CORS configuration & health checks
│   └── requirements.txt      # Backend Python dependencies
├── frontend/                 # React 18 + Vite Executive User Interface
│   ├── src/
│   │   ├── api/client.js     # Typed fetch client connecting to FastAPI /api proxy
│   │   ├── components/       # Executive UI Components
│   │   │   ├── charts/       # Recharts & Plotly Visualizations (FanChart, Line, Waterfall, Gauges)
│   │   │   ├── common/       # LoadingSkeleton, ErrorMessage, EmptyState
│   │   │   ├── layout/       # Sticky Header, Sidebar, TabNav, Global FilterBar
│   │   │   ├── StressPanel.jsx          # Interactive 22-scenario shock engine & fine-tuning sliders
│   │   │   ├── StressStatusBanner.jsx   # Safe / Warning / Critical status pill & narrative
│   │   │   ├── StressComparisonTable.jsx# Side-by-side variance audit (Baseline vs. Stressed)
│   │   │   ├── StressMethodology.jsx    # Collapsible mathematical & Basel III reference
│   │   │   └── AboutDataModal.jsx       # Platform architecture & dataset inventory modal
│   │   ├── context/          # FilterContext (Global filters) & ThemeContext (Dark/Light Mode)
│   │   ├── pages/            # Overview, CashFlowAnalysis, Receivables, StressTesting
│   │   └── utils/format.js   # Standardized INR (₹), percentage, and date formatters
│   ├── tailwind.config.js    # Executive Dark Navy & Emerald theme definition
│   └── vite.config.js        # Vite dev server with reverse proxy (/api -> http://localhost:8000)
├── data/                     # STRICTLY READ-ONLY Institutional Data Store
│   ├── cash_position_365_days.csv
│   ├── cash_flow_transactions_1460_rows.csv
│   ├── receivables_payables_1000_rows.csv
│   ├── cash_flow_forecast_90_days.csv
│   ├── stress_testing_22_scenarios.csv
│   ├── dashboard_kpi_summary.csv
│   ├── validation_report.json
│   └── README.txt
└── README.md
```

### Governing Architectural Rules
1. **`data/` is Read-Only**: The analytical engine and API treat all CSVs in `data/` as immutable. No operation creates, modifies, or deletes records in `data/`.
2. **Zero Client-Side Simulation**: All financial mathematics, rolling variances, deterministic cash compounding, and stochastic iterations run strictly in Python (`backend/core/`). The React UI acts strictly as a presentation and control layer.

---

## ⚡ Tech Stack

| Layer | Technologies | Purpose |
| :--- | :--- | :--- |
| **Backend Framework** | **Python 3.10+**, **FastAPI** | High-throughput asynchronous REST API |
| **Data Processing** | **Pandas**, **NumPy** | Vectorized matrix transformations, rolling statistics & simulation loops |
| **Server Runtime** | **Uvicorn** | ASGI web server implementation |
| **Frontend Framework** | **React 18**, **Vite** | Fast component rendering with Instant Hot Module Replacement (HMR) |
| **Styling & Design** | **Tailwind CSS 3.4**, **Vanilla CSS** | Executive Dark Navy (`#070B14`, `#0B1120`) & Teal/Emerald palette |
| **Charting & Analytics** | **Recharts 2.12**, **Plotly.js 2.35** | Responsive SVG charts and canvas WebGL/SVG Fan charts |
| **Icons & Typography** | **Lucide React**, **Inter**, **JetBrains Mono** | Financial data legibility and crisp visual hierarchy |

---

## 🚀 Installation & Local Setup

### 1. Prerequisites
- **Python**: Version 3.10 or higher
- **Node.js**: Version 18.0 or higher
- **Package Managers**: `pip` and `npm`

---

### 2. Backend Setup (FastAPI)

1. Open your terminal in the repository root directory:
   ```bash
   cd Liquidity_Management
   ```

2. (Optional but recommended) Create and activate a Python virtual environment:
   ```bash
   # On Windows PowerShell
   python -m venv venv
   .\venv\Scripts\Activate.ps1

   # On macOS / Linux
   python3 -m venv venv
   source venv/bin/activate
   ```

3. Install required Python packages:
   ```bash
   pip install -r backend/requirements.txt
   ```

4. Start the FastAPI backend server:
   ```bash
   python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
   ```

5. Verify backend health:
   - **Swagger Interactive API Documentation**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
   - **Automated Health Check**: [http://127.0.0.1:8000/api/health](http://127.0.0.1:8000/api/health)

---

### 3. Frontend Setup (React + Vite)

1. Open a new terminal window and navigate into the `frontend/` directory:
   ```bash
   cd Liquidity_Management/frontend
   ```

2. Install npm dependencies:
   ```bash
   npm install
   ```

3. Start the Vite development server:
   ```bash
   npm run dev
   ```

4. Open the application in your browser:
   - **Treasury Dashboard**: [http://localhost:5173/](http://localhost:5173/)

*(Vite is pre-configured to proxy all `/api/*` network requests automatically to `http://localhost:8000`.)*

---

## 📡 API Endpoint Directory

All endpoints return standardized JSON payloads and use ISO 8601 dates (`YYYY-MM-DD`) and INR currency (`₹`).

### 1. Executive Overview & Health
| Method | Endpoint | Query Parameters | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | None | System status and dataset automated validation report. |
| `GET` | `/api/kpis` | `start_date`, `end_date`, `min_threshold` | Closing cash, runway, burn rate, quick ratio, CCC, and solvency buffer. |
| `GET` | `/api/cash-position` | `start_date`, `end_date`, `limit` | 365-day daily cash ledger (opening, closing, inflows, outflows, minimum reserve). |
| `GET` | `/api/alerts` | `min_threshold` | Active liquidity warnings, buffer status, and threshold breach flags. |

### 2. Cash Flow Dynamics & Projections
| Method | Endpoint | Query Parameters | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/transactions` | `start_date`, `end_date`, `category`, `period_type`, `limit` | 1,460 categorized transaction rows with period aggregations. |
| `GET` | `/api/transactions/waterfall`| `start_date`, `end_date`, `category` | Inflow/outflow category reconciliation bridge from opening to closing balance. |
| `GET` | `/api/forecast` | `limit` | 90-day daily operational forecast baseline. |
| `GET` | `/api/forecast/combined` | `start_date`, `end_date` | Unified historical cash trajectory seamlessly stitched with 90-day forward forecast. |

### 3. Working Capital Management (AR & AP)
| Method | Endpoint | Query Parameters | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/ar-ap` | `start_date`, `end_date`, `limit`, `offset` | Receivables & payables totals, DSO, DPO, aging brackets (0–30, 31–60, 61–90, 90+), and top counterparties. |

### 4. Interactive Stress Testing & Stochastic Simulation
| Method | Endpoint | Request Body Schema | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/scenarios` | None | Returns all 22 preset stress test scenarios enriched with minimum cash and ending balances. |
| `POST` | `/api/stress/run` | `StressRunRequest` | Applies deterministic liquidity shocks; returns baseline vs. stressed trajectories, breach date, runway, min cash, and Safe/Warning/Critical status. |
| `POST` | `/api/stress/monte-carlo` | `MonteCarloRequest` | Runs 500 to 1,000 stochastic log-normal simulations; returns 5th, 25th, 50th, 75th, 95th percentile fan bands and breach probability. |

#### `StressRunRequest` Schema
```json
{
  "scenario_id": "SCN005",
  "inflow_reduction_pct": 50.0,
  "outflow_increase_pct": 30.0,
  "collection_delay_days": 15,
  "credit_line_reduction_pct": 0.0,
  "minimum_cash_threshold": 750000.0,
  "projection_horizon": 90
}
```

#### `MonteCarloRequest` Schema
```json
{
  "scenario_id": "SCN005",
  "inflow_reduction_pct": 50.0,
  "outflow_increase_pct": 30.0,
  "collection_delay_days": 15,
  "credit_line_reduction_pct": 0.0,
  "minimum_cash_threshold": 750000.0,
  "projection_horizon": 90,
  "simulations": 1000,
  "inflow_volatility_pct": 25.0,
  "outflow_volatility_pct": 15.0
}
```

---

## 📐 Key Financial Performance Indicators (KPIs)

| Metric | Formula / Mathematical Definition | Institutional Interpretation |
| :--- | :--- | :--- |
| **Cash Conversion Cycle (CCC)** | $\text{CCC} = \text{DIO} + \text{DSO} - \text{DPO}$ | Days required to convert working capital investments into liquid cash flows. |
| **Days Sales Outstanding (DSO)** | $\text{DSO} = \frac{\text{Accounts Receivable}}{\text{Total Credit Sales}} \times 365$ | Average collection delay across billed customer invoices. |
| **Days Payable Outstanding (DPO)** | $\text{DPO} = \frac{\text{Accounts Payable}}{\text{Cost of Goods / Outflows}} \times 365$ | Average duration before supplier liabilities are settled. |
| **Solvency Buffer Ratio** | $\text{Buffer Ratio} = \frac{\text{Closing Cash Balance}}{\text{Minimum Required Cash Threshold}}$ | Multiplier of safety reserve. Values $> 1.25\times$ indicate safe buffer; values $< 1.0\times$ trigger breach. |
| **Quick Ratio (Acid-Test)** | $\text{Quick Ratio} = \frac{\text{Cash} + \text{Marketable Securities} + \text{Accounts Receivable}}{\text{Current Liabilities}}$ | Liquidity test measuring ability to cover short-term debt with near-cash assets. |
| **Net Daily Burn Rate** | $\text{Burn Rate} = \frac{\sum \text{Outflows} - \sum \text{Inflows}}{N \text{ Days}}$ | Net daily liquidity consumption when outflows exceed inflows. |
| **Cash Runway** | $\text{Runway (Days)} = \begin{cases} \text{First Day } t \text{ where } C(t) < \text{Threshold} & \text{if breach occurs} \\ > H \text{ Days} & \text{if } C(t) \ge \text{Threshold } \forall t \end{cases}$ | Operational survival horizon before cash reserves hit zero or breach regulatory floors. |
| **Minimum Required Floor** | Baseline ₹$7,50,000$ floor | Unencumbered High-Quality Liquid Asset (HQLA) operational reserve. |

---

## 🔬 Stress-Testing & Monte Carlo Methodology

### 1. Deterministic Shock Compounding
The deterministic shock engine calculates day-by-day closing balances across horizon $H = 90$ days using three simultaneous shock levers:
1. **Revenue Reduction Shock ($\delta_{\text{in}} \in [0, 1]$)**: Proportional haircut applied to operational inflows.
2. **Collection Lag Operator ($L^d$)**: Receivables collection delay shifting inflow realization forward by $d$ days:
   $$I_{\text{delayed}}(t) = \begin{cases} 0 & t \le d \\ I_{\text{base}}(t - d) \times (1 - \delta_{\text{in}}) & t > d \end{cases}$$
3. **Expenditure Surge Shock ($\delta_{\text{out}} \ge 0$)**: Cost inflation or emergency contingency spending:
   $$O_{\text{stressed}}(t) = O_{\text{base}}(t) \times (1 + \delta_{\text{out}})$$
4. **Recursive Cash Compounding**:
   $$C(t) = C(t-1) + I_{\text{delayed}}(t) - O_{\text{stressed}}(t)$$
5. **Solvency Classification**:
   - **Safe**: $\min_t C(t) > 1.25 \times \text{Threshold}$
   - **Warning**: $\text{Threshold} \le \min_t C(t) \le 1.25 \times \text{Threshold}$
   - **Critical**: $\exists t : C(t) < \text{Threshold}$

---

### 2. Stochastic Monte Carlo Volatility Engine
To account for non-deterministic cash volatility, the engine executes $N = 1,000$ stochastic iterations around the stressed expected path:
1. **Log-Normal Multiplier Formulation**:
   Daily inflows and outflows follow log-normal distributions to preserve non-negativity:
   $$M_{\text{in}}(t) = \exp\left(-\frac{1}{2}\sigma_{\text{in}}^2 + \sigma_{\text{in}} Z_1\right), \quad Z_1 \sim \mathcal{N}(0, 1)$$
   $$M_{\text{out}}(t) = \exp\left(-\frac{1}{2}\sigma_{\text{out}}^2 + \sigma_{\text{out}} Z_2\right), \quad Z_2 \sim \mathcal{N}(0, 1)$$
   *(The $-\frac{1}{2}\sigma^2$ drift term applies Jensen's Inequality correction to preserve mathematical expected value $\mathbb{E}[M] = 1$.)*
2. **Historical Volatility Calibration**:
   - Inflow volatility: $\sigma_{\text{in}} = 25.0\%$ (calibrated against empirical 365-day inflow standard deviation / mean)
   - Outflow volatility: $\sigma_{\text{out}} = 15.0\%$ (calibrated against empirical 365-day outflow variance)
3. **Probability of Threshold Breach**:
   $$P(\text{Breach}) = \frac{1}{N} \sum_{i=1}^{N} \mathbb{I}\left( \min_{t \in [1, H]} C_i(t) < \text{Threshold} \right) \times 100\%$$

---

## 🔒 Data Integrity & Governance Notice

All corporate records in `data/` are treated as **STRICTLY READ-ONLY**:
- No script or backend route writes, modifies, renames, or appends to any file in `data/`.
- All operational forecasts and scenarios are simulated in-memory using pure NumPy/Pandas pipelines.
- **Double-Counting Prevention**: Daily cash balance summaries (`cash_position_365_days.csv`) and transaction line items (`cash_flow_transactions_1460_rows.csv`) represent identical movements at different granularities and must never be aggregated together.
- Corporate entity records indicate an equity-funded balance sheet without external revolving debt or credit facilities; credit line reduction parameters are tracked for regulatory compatibility.

---

## 📄 License & Compliance

This project is licensed under the MIT License. Developed for enterprise liquidity risk management and compliant with Basel Committee on Banking Supervision (BCBS) Basel III liquidity stress-testing principles.
