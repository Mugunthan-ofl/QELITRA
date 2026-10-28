"""
Core Financial Metrics & Corporate Liquidity Calculations.

Strictly utilizes columns present in the audited datasets:
- cash_position_365_days.csv: date, opening_cash_balance_inr, cash_inflow_inr, cash_outflow_inr,
                              net_cash_flow_inr, closing_cash_balance_inr, minimum_required_cash_inr
- receivables_payables_1000_rows.csv: invoice_id, invoice_type, counterparty_id, invoice_date, due_date,
                                      invoice_amount_inr, amount_paid_inr, outstanding_amount_inr,
                                      status, days_to_due
- cash_flow_transactions_1460_rows.csv: transaction_id, transaction_date, transaction_type, category,
                                        amount_inr, payment_status, expected_payment_date, counterparty_id
- dashboard_kpi_summary.csv: precomputed baseline reconciliation totals
"""

from typing import Dict, Any, Optional, Tuple, List
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from backend.core.data_loader import get_data_loader
from backend.core.cache import cache_manager

# ==============================================================================
# 1. CASH BALANCE & POSITION
# ==============================================================================

def calculate_cash_balance(df_cash: pd.DataFrame, as_of_date: Optional[str] = None) -> Dict[str, Any]:
    """
    Computes the closing cash balance as of a specified date or the latest recorded date.
    
    Columns used:
      - date: calendar date (string YYYY-MM-DD)
      - closing_cash_balance_inr: ending balance for that date
      - opening_cash_balance_inr: opening balance for that date
    """
    if df_cash.empty:
        return {"as_of_date": as_of_date, "closing_cash_inr": 0.0, "opening_cash_inr": 0.0}

    df_sorted = df_cash.sort_values("date").reset_index(drop=True)
    if as_of_date:
        filtered = df_sorted[df_sorted["date"] <= as_of_date]
        if not filtered.empty:
            row = filtered.iloc[-1]
        else:
            row = df_sorted.iloc[0]
    else:
        row = df_sorted.iloc[-1]

    return {
        "as_of_date": str(row["date"]),
        "closing_cash_inr": float(row["closing_cash_balance_inr"]),
        "opening_cash_inr": float(row["opening_cash_balance_inr"]),
    }

# ==============================================================================
# 2. NET CASH FLOW
# ==============================================================================

def calculate_net_cash_flow(
    df_cash: pd.DataFrame,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None
) -> Dict[str, Any]:
    """
    Computes total cash inflows, outflows, and net cash flow (inflow - outflow)
    over a designated period.

    Columns used:
      - cash_inflow_inr: daily cash receipts
      - cash_outflow_inr: daily cash disbursements
      - net_cash_flow_inr: daily net difference
    """
    df = df_cash.copy()
    if start_date:
        df = df[df["date"] >= start_date]
    if end_date:
        df = df[df["date"] <= end_date]

    if df.empty:
        return {
            "period_days": 0,
            "total_inflow_inr": 0.0,
            "total_outflow_inr": 0.0,
            "net_cash_flow_inr": 0.0,
            "net_margin_pct": 0.0
        }

    total_inflow = float(df["cash_inflow_inr"].sum())
    total_outflow = float(df["cash_outflow_inr"].sum())
    net_flow = total_inflow - total_outflow
    margin_pct = (net_flow / total_inflow * 100.0) if total_inflow > 0 else 0.0

    return {
        "period_days": len(df),
        "total_inflow_inr": round(total_inflow, 2),
        "total_outflow_inr": round(total_outflow, 2),
        "net_cash_flow_inr": round(net_flow, 2),
        "net_margin_pct": round(margin_pct, 2)
    }

# ==============================================================================
# 3. CASH BURN & CASH RUNWAY
# ==============================================================================

def calculate_cash_runway(
    df_cash: pd.DataFrame,
    as_of_date: Optional[str] = None,
    lookback_days: int = 90
) -> Dict[str, Any]:
    """
    Calculates average daily cash burn rate and cash runway (days and months).
    
    Formula:
      - Average Daily Burn = sum(cash_outflow_inr over lookback period) / lookback_days
      - Runway (Days) = current_closing_cash / avg_daily_burn
      - Runway (Months) = runway_days / 30.0

    Columns used:
      - date, cash_outflow_inr, closing_cash_balance_inr
    """
    balance_info = calculate_cash_balance(df_cash, as_of_date)
    current_cash = balance_info["closing_cash_inr"]
    ref_date = balance_info["as_of_date"]

    df = df_cash[df_cash["date"] <= ref_date].sort_values("date").tail(lookback_days)
    days_count = len(df)
    if days_count == 0:
        return {
            "avg_daily_cash_burn_inr": 0.0,
            "cash_runway_days": 999.0,
            "cash_runway_months": 33.3,
            "lookback_days": 0
        }

    total_outflows = float(df["cash_outflow_inr"].sum())
    avg_daily_burn = total_outflows / days_count if days_count > 0 else 1.0

    if avg_daily_burn > 0:
        runway_days = round(current_cash / avg_daily_burn, 1)
        runway_months = round(runway_days / 30.0, 1)
    else:
        runway_days = 999.0
        runway_months = 33.3

    return {
        "avg_daily_cash_burn_inr": round(avg_daily_burn, 2),
        "cash_runway_days": runway_days,
        "cash_runway_months": runway_months,
        "lookback_days": days_count
    }

# ==============================================================================
# 4. WORKING CAPITAL & LIQUIDITY RATIOS
# ==============================================================================

def calculate_working_capital_and_ratios(
    df_cash: pd.DataFrame,
    df_invoices: pd.DataFrame,
    as_of_date: Optional[str] = None
) -> Dict[str, Any]:
    """
    Computes Working Capital, Current Ratio, Quick Ratio, and Cash Ratio
    using the available balance and invoice columns.

    Definitions from available datasets:
      - Current Assets: Closing Cash + Outstanding Receivables (AR)
        (No inventory exists in the corporate treasury ledger)
      - Current Liabilities: Outstanding Payables (AP)
      - Net Working Capital: Current Assets - Current Liabilities = Cash + AR - AP
      - Working Capital Gap (Operational): Outstanding AR - Outstanding AP
      - Current Ratio: Current Assets / Current Liabilities = (Cash + AR) / AP
      - Quick Ratio (Acid-Test): Quick Assets / Current Liabilities = (Cash + AR) / AP
      - Cash Ratio: Cash / Current Liabilities = Cash / AP

    Columns used:
      - df_cash: closing_cash_balance_inr, date
      - df_invoices: invoice_type ('receivable', 'payable'), outstanding_amount_inr, invoice_date
    """
    cash_info = calculate_cash_balance(df_cash, as_of_date)
    cash_val = cash_info["closing_cash_inr"]
    ref_date = cash_info["as_of_date"]

    # Filter invoices up to ref_date
    inv = df_invoices[df_invoices["invoice_date"] <= ref_date] if ref_date else df_invoices

    ar_outstanding = float(inv[inv["invoice_type"] == "receivable"]["outstanding_amount_inr"].sum())
    ap_outstanding = float(inv[inv["invoice_type"] == "payable"]["outstanding_amount_inr"].sum())

    current_assets = cash_val + ar_outstanding
    current_liabilities = ap_outstanding
    net_working_capital = current_assets - current_liabilities
    working_capital_gap = ar_outstanding - ap_outstanding

    if current_liabilities > 0:
        current_ratio = round(current_assets / current_liabilities, 3)
        quick_ratio = round(current_assets / current_liabilities, 3)  # Cash + AR as quick assets
        cash_ratio = round(cash_val / current_liabilities, 3)
    else:
        current_ratio = 99.0
        quick_ratio = 99.0
        cash_ratio = 99.0

    return {
        "closing_cash_inr": cash_val,
        "receivables_outstanding_inr": round(ar_outstanding, 2),
        "payables_outstanding_inr": round(ap_outstanding, 2),
        "current_assets_inr": round(current_assets, 2),
        "current_liabilities_inr": round(current_liabilities, 2),
        "net_working_capital_inr": round(net_working_capital, 2),
        "working_capital_gap_inr": round(working_capital_gap, 2),
        "current_ratio": current_ratio,
        "quick_ratio": quick_ratio,
        "cash_ratio": cash_ratio
    }

# ==============================================================================
# 5. DSO & DPO (DAYS SALES / PAYABLES OUTSTANDING)
# ==============================================================================

def calculate_dso_and_dpo(
    df_invoices: pd.DataFrame,
    period_days: int = 365,
    as_of_date: Optional[str] = None
) -> Dict[str, Any]:
    """
    Calculates Days Sales Outstanding (DSO) and Days Payables Outstanding (DPO).

    Textbook Accounting Formulas:
      - Annualized DSO = (Total Outstanding AR / Total Invoiced Credit Sales) * 365
      - Annualized DPO = (Total Outstanding AP / Total Billed Payables) * 365
      - Working Capital Conversion Delta = DSO - DPO

    Columns used:
      - invoice_type: 'receivable' vs 'payable'
      - outstanding_amount_inr: unpaid balance
      - invoice_amount_inr: total billed amount
      - invoice_date: to scope to period
    """
    df = df_invoices[df_invoices["invoice_date"] <= as_of_date] if as_of_date else df_invoices

    ar_df = df[df["invoice_type"] == "receivable"]
    ap_df = df[df["invoice_type"] == "payable"]

    ar_outstanding = float(ar_df["outstanding_amount_inr"].sum())
    total_sales = float(ar_df["invoice_amount_inr"].sum())

    ap_outstanding = float(ap_df["outstanding_amount_inr"].sum())
    total_payables = float(ap_df["invoice_amount_inr"].sum())

    # Annualized standard (365 days)
    annualized_dso = round((ar_outstanding / total_sales * 365.0), 1) if total_sales > 0 else 0.0
    annualized_dpo = round((ap_outstanding / total_payables * 365.0), 1) if total_payables > 0 else 0.0
    annualized_gap = round(annualized_dso - annualized_dpo, 1)

    # Period-based (if window is different than 365)
    period_dso = round((ar_outstanding / total_sales * period_days), 1) if total_sales > 0 else 0.0
    period_dpo = round((ap_outstanding / total_payables * period_days), 1) if total_payables > 0 else 0.0

    return {
        "receivables_outstanding_inr": round(ar_outstanding, 2),
        "total_credit_sales_inr": round(total_sales, 2),
        "dso_days": annualized_dso,
        "period_dso_days": period_dso,
        "payables_outstanding_inr": round(ap_outstanding, 2),
        "total_billed_payables_inr": round(total_payables, 2),
        "dpo_days": annualized_dpo,
        "period_dpo_days": period_dpo,
        "cash_conversion_gap_days": annualized_gap
    }

# ==============================================================================
# 6. LIQUIDITY BUFFER
# ==============================================================================

def calculate_liquidity_buffer(
    cash_balance: float,
    minimum_threshold: float = 750000.0
) -> Dict[str, Any]:
    """
    Calculates the liquidity buffer surplus/deficit against the minimum cash policy reserve.

    Columns/Inputs:
      - cash_balance: current closing cash
      - minimum_threshold: policy reserve (default 750,000.00 INR from minimum_required_cash_inr)
    """
    buffer_inr = cash_balance - minimum_threshold
    buffer_ratio = (cash_balance / minimum_threshold) if minimum_threshold > 0 else 0.0

    return {
        "current_cash_inr": round(cash_balance, 2),
        "minimum_required_cash_inr": round(minimum_threshold, 2),
        "liquidity_buffer_inr": round(buffer_inr, 2),
        "liquidity_buffer_ratio": round(buffer_ratio, 2),
        "is_above_minimum": buffer_inr >= 0
    }

# ==============================================================================
# 7. ROLLING AVERAGES
# ==============================================================================

def calculate_rolling_averages(
    df_cash: pd.DataFrame,
    windows: Tuple[int, int] = (7, 30)
) -> pd.DataFrame:
    """
    Computes 7-day and 30-day rolling averages of net cash flows and closing cash balances.

    Columns used:
      - net_cash_flow_inr: daily net flow
      - closing_cash_balance_inr: daily closing cash
      - date: calendar date
    """
    df = df_cash.sort_values("date").copy().reset_index(drop=True)
    w1, w2 = windows

    df[f"rolling_net_{w1}d"] = df["net_cash_flow_inr"].rolling(window=w1, min_periods=1).mean().round(2)
    df[f"rolling_net_{w2}d"] = df["net_cash_flow_inr"].rolling(window=w2, min_periods=1).mean().round(2)
    df[f"rolling_cash_{w1}d"] = df["closing_cash_balance_inr"].rolling(window=w1, min_periods=1).mean().round(2)
    df[f"rolling_cash_{w2}d"] = df["closing_cash_balance_inr"].rolling(window=w2, min_periods=1).mean().round(2)

    return df

# ==============================================================================
# 8. LIQUIDITY STATUS CLASSIFICATION
# ==============================================================================

def evaluate_liquidity_status(
    buffer_ratio: float,
    runway_days: float,
    current_ratio: Optional[float] = None
) -> Dict[str, Any]:
    """
    Evaluates corporate solvency into Safe / Warning / Critical.

    Threshold Definitions (documented):
      - CRITICAL:
          * Buffer Ratio < 1.0 (Cash has breached the minimum policy reserve) OR
          * Cash Runway < 30 days (Less than 1 month operating burn) OR
          * Current Ratio < 1.0 (Current liabilities exceed liquid current assets)
      - WARNING:
          * Buffer Ratio between 1.0 and 1.5 (Operating close to threshold) OR
          * Cash Runway between 30 and 90 days (1 to 3 months burn remaining) OR
          * Current Ratio between 1.0 and 1.15 (Tight working capital margin)
      - SAFE:
          * Buffer Ratio >= 1.5 AND
          * Cash Runway >= 90 days (3+ months operating runway) AND
          * Current Ratio >= 1.15
    """
    reasons = []
    level = "Safe"

    # Critical conditions
    if buffer_ratio < 1.0:
        level = "Critical"
        reasons.append(f"Cash balance has breached minimum reserve threshold (Buffer ratio: {buffer_ratio:.2f}x < 1.0x)")
    if runway_days < 30.0:
        level = "Critical"
        reasons.append(f"Severely depleted cash runway ({runway_days:.1f} days < 30 days)")
    if current_ratio is not None and current_ratio < 1.0:
        level = "Critical"
        reasons.append(f"Working capital insolvency: Current ratio {current_ratio:.2f} < 1.0")

    # Warning conditions (only if not already Critical)
    if level != "Critical":
        if buffer_ratio < 1.5:
            level = "Warning"
            reasons.append(f"Liquidity buffer is tight ({buffer_ratio:.2f}x; target >= 1.5x)")
        if runway_days < 90.0:
            level = "Warning"
            reasons.append(f"Cash runway under 3 months ({runway_days:.1f} days < 90 days)")
        if current_ratio is not None and current_ratio < 1.15:
            level = "Warning"
            reasons.append(f"Narrow working capital margin (Current ratio: {current_ratio:.2f} < 1.15)")

    if level == "Safe":
        reasons.append(f"Solvent: Buffer {buffer_ratio:.2f}x, Runway {runway_days:.1f}d, Current Ratio {current_ratio if current_ratio else 'N/A'}")

    return {
        "status": level,
        "buffer_ratio": round(buffer_ratio, 2),
        "runway_days": round(runway_days, 1),
        "current_ratio": round(current_ratio, 2) if current_ratio else None,
        "reasons": reasons,
        "is_safe": level == "Safe",
        "is_warning": level == "Warning",
        "is_critical": level == "Critical"
    }

# ==============================================================================
# 9. COMPREHENSIVE KPIS WITH PERIOD COMPARISON
# ==============================================================================

def get_comprehensive_kpis(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    min_threshold: float = 750000.0
) -> Dict[str, Any]:
    """
    Computes all corporate liquidity KPIs for the selected period,
    along with comparison deltas vs. the immediate previous equivalent period.
    """
    loader = get_data_loader()
    df_cash = loader.get_cash_position()
    df_inv = loader.get_invoices()

    all_dates = df_cash.sort_values("date")["date"].tolist()
    min_date, max_date = all_dates[0], all_dates[-1]

    # Resolve date boundaries
    cur_end = end_date if end_date else max_date
    if start_date:
        cur_start = start_date
    else:
        # Default current period: last 30 days
        end_dt = datetime.strptime(cur_end, "%Y-%m-%d")
        start_dt = max(datetime.strptime(min_date, "%Y-%m-%d"), end_dt - timedelta(days=29))
        cur_start = start_dt.strftime("%Y-%m-%d")

    # Current period metrics
    cur_cash_info = calculate_cash_balance(df_cash, cur_end)
    cur_flow = calculate_net_cash_flow(df_cash, cur_start, cur_end)
    cur_runway = calculate_cash_runway(df_cash, cur_end, lookback_days=cur_flow["period_days"] or 30)
    cur_wc = calculate_working_capital_and_ratios(df_cash, df_inv, cur_end)
    cur_dso_dpo = calculate_dso_and_dpo(df_inv, period_days=cur_flow["period_days"] or 365, as_of_date=cur_end)
    cur_buffer = calculate_liquidity_buffer(cur_cash_info["closing_cash_inr"], min_threshold)
    cur_status = evaluate_liquidity_status(
        cur_buffer["liquidity_buffer_ratio"],
        cur_runway["cash_runway_days"],
        cur_wc["current_ratio"]
    )

    # Determine Previous Equivalent Period
    cur_start_dt = datetime.strptime(cur_start, "%Y-%m-%d")
    cur_end_dt = datetime.strptime(cur_end, "%Y-%m-%d")
    period_length_days = (cur_end_dt - cur_start_dt).days + 1

    prev_end_dt = cur_start_dt - timedelta(days=1)
    prev_start_dt = prev_end_dt - timedelta(days=period_length_days - 1)
    prev_start = prev_start_dt.strftime("%Y-%m-%d")
    prev_end = prev_end_dt.strftime("%Y-%m-%d")

    # Previous period metrics
    prev_cash_info = calculate_cash_balance(df_cash, prev_end)
    prev_flow = calculate_net_cash_flow(df_cash, prev_start, prev_end)
    prev_runway = calculate_cash_runway(df_cash, prev_end, lookback_days=prev_flow["period_days"] or 30)
    prev_buffer = calculate_liquidity_buffer(prev_cash_info["closing_cash_inr"], min_threshold)

    # Compute Changes (Current vs Previous)
    cash_change_inr = cur_cash_info["closing_cash_inr"] - prev_cash_info["closing_cash_inr"]
    cash_change_pct = (cash_change_inr / prev_cash_info["closing_cash_inr"] * 100.0) if prev_cash_info["closing_cash_inr"] > 0 else 0.0

    net_flow_change_inr = cur_flow["net_cash_flow_inr"] - prev_flow["net_cash_flow_inr"]
    net_flow_change_pct = (net_flow_change_inr / abs(prev_flow["net_cash_flow_inr"]) * 100.0) if prev_flow["net_cash_flow_inr"] != 0 else 0.0

    inflow_change_inr = cur_flow["total_inflow_inr"] - prev_flow["total_inflow_inr"]
    outflow_change_inr = cur_flow["total_outflow_inr"] - prev_flow["total_outflow_inr"]

    return {
        "period": {
            "current_start": cur_start,
            "current_end": cur_end,
            "period_days": period_length_days,
            "previous_start": prev_start,
            "previous_end": prev_end,
        },
        "current": {
            "closing_cash_inr": cur_cash_info["closing_cash_inr"],
            "opening_cash_inr": cur_cash_info["opening_cash_inr"],
            "total_inflow_inr": cur_flow["total_inflow_inr"],
            "total_outflow_inr": cur_flow["total_outflow_inr"],
            "net_cash_flow_inr": cur_flow["net_cash_flow_inr"],
            "net_margin_pct": cur_flow["net_margin_pct"],
            "avg_daily_cash_burn_inr": cur_runway["avg_daily_cash_burn_inr"],
            "cash_runway_days": cur_runway["cash_runway_days"],
            "cash_runway_months": cur_runway["cash_runway_months"],
            "minimum_required_cash_inr": cur_buffer["minimum_required_cash_inr"],
            "liquidity_buffer_inr": cur_buffer["liquidity_buffer_inr"],
            "liquidity_buffer_ratio": cur_buffer["liquidity_buffer_ratio"],
            "liquidity_status": cur_status["status"],
            "status_details": cur_status,
            "current_assets_inr": cur_wc["current_assets_inr"],
            "current_liabilities_inr": cur_wc["current_liabilities_inr"],
            "net_working_capital_inr": cur_wc["net_working_capital_inr"],
            "working_capital_gap_inr": cur_wc["working_capital_gap_inr"],
            "current_ratio": cur_wc["current_ratio"],
            "quick_ratio": cur_wc["quick_ratio"],
            "cash_ratio": cur_wc["cash_ratio"],
            "receivables_outstanding_inr": cur_dso_dpo["receivables_outstanding_inr"],
            "payables_outstanding_inr": cur_dso_dpo["payables_outstanding_inr"],
            "dso_days": cur_dso_dpo["dso_days"],
            "dpo_days": cur_dso_dpo["dpo_days"],
            "cash_conversion_gap_days": cur_dso_dpo["cash_conversion_gap_days"]
        },
        "change_vs_previous": {
            "cash_change_inr": round(cash_change_inr, 2),
            "cash_change_pct": round(cash_change_pct, 2),
            "net_flow_change_inr": round(net_flow_change_inr, 2),
            "net_flow_change_pct": round(net_flow_change_pct, 2),
            "inflow_change_inr": round(inflow_change_inr, 2),
            "outflow_change_inr": round(outflow_change_inr, 2),
            "runway_days_change": round(cur_runway["cash_runway_days"] - prev_runway["cash_runway_days"], 1),
            "buffer_ratio_change": round(cur_buffer["liquidity_buffer_ratio"] - prev_buffer["liquidity_buffer_ratio"], 2)
        }
    }
