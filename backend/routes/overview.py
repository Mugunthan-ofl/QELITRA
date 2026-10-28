from fastapi import APIRouter, Query, HTTPException
from typing import Optional, List, Dict, Any
from datetime import datetime
from backend.core.data_loader import get_data_loader
from backend.core.metrics import (
    get_comprehensive_kpis,
    calculate_rolling_averages,
    calculate_cash_runway,
    calculate_working_capital_and_ratios,
    calculate_liquidity_buffer
)
from backend.core.utils import validate_date_range, sanitize_dict
from backend.core.cache import cache_manager

router = APIRouter(prefix="/api", tags=["Overview & KPIs"])

@router.get("/kpis")
def get_kpis(
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD) for analysis window"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD) for analysis window"),
    min_threshold: float = Query(750000.0, ge=0.0, description="Configurable minimum liquidity threshold in INR")
):
    """
    Returns headline corporate liquidity KPIs, working capital ratios, DSO, DPO,
    and period-over-period comparative deltas.
    """
    validate_date_range(start_date, end_date)

    cache_key = f"kpis:{start_date}:{end_date}:{min_threshold}"
    cached_val = cache_manager.get(cache_key)
    if cached_val is not None:
        return cached_val

    kpis = get_comprehensive_kpis(
        start_date=start_date,
        end_date=end_date,
        min_threshold=min_threshold
    )

    clean_result = sanitize_dict(kpis)
    cache_manager.set(cache_key, clean_result, ttl_seconds=120)
    return clean_result

@router.get("/cash-position")
def get_cash_position(
    start_date: Optional[str] = Query(None, description="Filter from start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="Filter to end date (YYYY-MM-DD)"),
    limit: Optional[int] = Query(None, ge=1, le=365, description="Limit rows returned")
):
    """
    Returns the daily historical cash position series with 7-day and 30-day
    rolling averages of net cash flows and balances.
    """
    validate_date_range(start_date, end_date)

    cache_key = f"cash_pos:{start_date}:{end_date}:{limit}"
    cached_val = cache_manager.get(cache_key)
    if cached_val is not None:
        return cached_val

    loader = get_data_loader()
    df_raw = loader.get_cash_position()

    # Compute rolling metrics on the full continuous series first
    df_rolling = calculate_rolling_averages(df_raw, windows=(7, 30))

    # Apply date filters
    if start_date:
        df_rolling = df_rolling[df_rolling["date"] >= start_date]
    if end_date:
        df_rolling = df_rolling[df_rolling["date"] <= end_date]
    if limit:
        df_rolling = df_rolling.tail(limit)

    records = df_rolling.to_dict(orient="records")
    clean_result = [sanitize_dict(r) for r in records]
    cache_manager.set(cache_key, clean_result, ttl_seconds=120)
    return clean_result

@router.get("/alerts")
def get_alerts(
    min_threshold: float = Query(750000.0, ge=0.0, description="Configurable minimum liquidity threshold in INR"),
    as_of_date: Optional[str] = Query(None, description="Reference evaluation date (YYYY-MM-DD, defaults to latest)")
):
    """
    Auto-generates intelligent risk warnings and alerts for executive action:
    - Runway under 3 months (< 90 days)
    - Cash balance approaching or breaching policy threshold
    - Working capital solvency / Current ratio under 1.0 or 1.15
    - Overdue receivables collection pressure
    - Payables liquidity demand
    """
    loader = get_data_loader()
    df_cash = loader.get_cash_position()
    df_inv = loader.get_invoices()

    # Determine reference date
    ref_date = as_of_date if as_of_date else df_cash["date"].max()

    # Calculate current metrics
    df_filtered_cash = df_cash[df_cash["date"] <= ref_date]
    if df_filtered_cash.empty:
        raise HTTPException(status_code=400, detail=f"No cash records found on or before {ref_date}")

    latest_row = df_filtered_cash.sort_values("date").iloc[-1]
    closing_cash = float(latest_row["closing_cash_balance_inr"])
    buffer_info = calculate_liquidity_buffer(closing_cash, min_threshold)
    runway_info = calculate_cash_runway(df_cash, as_of_date=ref_date, lookback_days=90)
    wc_info = calculate_working_capital_and_ratios(df_cash, df_inv, as_of_date=ref_date)

    alerts: List[Dict[str, Any]] = []
    alert_id = 1

    # 1. Cash Buffer Alert
    if buffer_info["liquidity_buffer_ratio"] < 1.0:
        alerts.append({
            "id": alert_id,
            "code": "CASH_BREACH",
            "level": "critical",
            "title": "Critical Minimum Cash Reserve Breached",
            "message": f"Closing cash (₹{closing_cash:,.2f}) has breached the required threshold (₹{min_threshold:,.2f}) by ₹{abs(buffer_info['liquidity_buffer_inr']):,.2f}.",
            "metric": "Buffer Ratio",
            "value": f"{buffer_info['liquidity_buffer_ratio']:.2f}x",
            "threshold": "1.00x",
            "action_required": "Activate immediate credit drawdowns or defer non-critical expenditures."
        })
        alert_id += 1
    elif buffer_info["liquidity_buffer_ratio"] < 1.5:
        alerts.append({
            "id": alert_id,
            "code": "CASH_WARNING",
            "level": "warning",
            "title": "Liquidity Buffer Compression",
            "message": f"Cash balance is {buffer_info['liquidity_buffer_ratio']:.2f}x minimum reserve (₹{min_threshold:,.2f}). Target buffer is >= 1.50x.",
            "metric": "Buffer Ratio",
            "value": f"{buffer_info['liquidity_buffer_ratio']:.2f}x",
            "threshold": "1.50x",
            "action_required": "Review upcoming 14-day payable settlements."
        })
        alert_id += 1
    else:
        alerts.append({
            "id": alert_id,
            "code": "CASH_HEALTHY",
            "level": "success",
            "title": "Robust Liquidity Buffer",
            "message": f"Cash balance of ₹{closing_cash:,.2f} provides a healthy {buffer_info['liquidity_buffer_ratio']:.2f}x buffer over the minimum policy reserve.",
            "metric": "Buffer Ratio",
            "value": f"{buffer_info['liquidity_buffer_ratio']:.2f}x",
            "threshold": "1.50x",
            "action_required": "No immediate cash injection needed."
        })
        alert_id += 1

    # 2. Runway Alert (< 3 months / 90 days)
    runway_days = runway_info["cash_runway_days"]
    if runway_days < 30.0:
        alerts.append({
            "id": alert_id,
            "code": "RUNWAY_CRITICAL",
            "level": "critical",
            "title": "Cash Runway Critical (< 30 Days)",
            "message": f"Operating cash runway is currently {runway_days:.1f} days ({runway_info['cash_runway_months']:.1f} months) at current burn rate ₹{runway_info['avg_daily_cash_burn_inr']:,.2f}/day.",
            "metric": "Cash Runway",
            "value": f"{runway_days:.1f} Days",
            "threshold": "30.0 Days",
            "action_required": "Emergency liquidity steering committee review required."
        })
        alert_id += 1
    elif runway_days < 90.0:
        alerts.append({
            "id": alert_id,
            "code": "RUNWAY_WARNING",
            "level": "warning",
            "title": "Cash Runway Under 3 Months",
            "message": f"Operating cash runway is {runway_days:.1f} days ({runway_info['cash_runway_months']:.1f} months), below the 90-day institutional comfort threshold.",
            "metric": "Cash Runway",
            "value": f"{runway_days:.1f} Days",
            "threshold": "90.0 Days",
            "action_required": "Accelerate customer invoice collections."
        })
        alert_id += 1
    else:
        alerts.append({
            "id": alert_id,
            "code": "RUNWAY_HEALTHY",
            "level": "info",
            "title": "Adequate Cash Runway",
            "message": f"Estimated cash runway stands at {runway_days:.1f} days ({runway_info['cash_runway_months']:.1f} months) based on 90-day trailing burn.",
            "metric": "Cash Runway",
            "value": f"{runway_days:.1f} Days",
            "threshold": "90.0 Days",
            "action_required": "Maintain standard cash flow forecast cadence."
        })
        alert_id += 1

    # 3. Current Ratio Alert
    cr = wc_info["current_ratio"]
    if cr < 1.0:
        alerts.append({
            "id": alert_id,
            "code": "CURRENT_RATIO_CRITICAL",
            "level": "critical",
            "title": "Working Capital Deficit (Current Ratio < 1.0)",
            "message": f"Current liabilities (₹{wc_info['current_liabilities_inr']:,.2f}) exceed liquid assets (₹{wc_info['current_assets_inr']:,.2f}). Current Ratio: {cr:.2f}.",
            "metric": "Current Ratio",
            "value": f"{cr:.2f}",
            "threshold": "1.00",
            "action_required": "Renegotiate supplier payment terms immediately."
        })
        alert_id += 1
    elif cr < 1.15:
        alerts.append({
            "id": alert_id,
            "code": "CURRENT_RATIO_WARNING",
            "level": "warning",
            "title": "Tight Working Capital Coverage",
            "message": f"Current ratio is {cr:.2f}, near unity. Payables obligations closely match liquid assets.",
            "metric": "Current Ratio",
            "value": f"{cr:.2f}",
            "threshold": "1.15",
            "action_required": "Prioritize collections on accounts receivable aging past 30 days."
        })
        alert_id += 1

    # 4. Overdue Invoices Alert
    inv_unpaid = df_inv[df_inv["status"] != "Paid"].copy()
    inv_unpaid["due_dt"] = inv_unpaid["due_date"]
    overdue_ar = inv_unpaid[(inv_unpaid["invoice_type"] == "receivable") & (inv_unpaid["due_dt"] < ref_date)]
    overdue_ar_amount = float(overdue_ar["outstanding_amount_inr"].sum())

    if overdue_ar_amount > 5000000.0:  # > 50 Lakhs overdue
        alerts.append({
            "id": alert_id,
            "code": "AR_OVERDUE_SURGE",
            "level": "warning",
            "title": "Elevated Overdue Receivables",
            "message": f"{len(overdue_ar)} customer invoices totaling ₹{overdue_ar_amount:,.2f} are past due as of {ref_date}.",
            "metric": "Overdue AR Amount",
            "value": f"₹{overdue_ar_amount:,.2f}",
            "threshold": "₹50.00L",
            "action_required": "Issue dunning letters and contact top overdue counterparties."
        })
        alert_id += 1

    # Summary count
    critical_count = sum(1 for a in alerts if a["level"] == "critical")
    warning_count = sum(1 for a in alerts if a["level"] == "warning")
    info_count = sum(1 for a in alerts if a["level"] in ("info", "success"))

    overall_health = "Critical" if critical_count > 0 else ("Warning" if warning_count > 0 else "Safe")

    return {
        "as_of_date": ref_date,
        "overall_health": overall_health,
        "summary": {
            "total_alerts": len(alerts),
            "critical_count": critical_count,
            "warning_count": warning_count,
            "info_count": info_count
        },
        "alerts": alerts
    }
