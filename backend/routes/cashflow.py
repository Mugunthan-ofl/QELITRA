from fastapi import APIRouter, Query, HTTPException
from typing import Optional, List, Dict, Any
import pandas as pd
from backend.core.data_loader import get_data_loader
from backend.core.utils import validate_date_range, sanitize_dict
from backend.core.cache import cache_manager

router = APIRouter(prefix="/api", tags=["Cash Flow & Transactions"])

@router.get("/transactions")
def get_transactions(
    start_date: Optional[str] = Query(None, description="Filter from transaction date YYYY-MM-DD"),
    end_date: Optional[str] = Query(None, description="Filter to transaction date YYYY-MM-DD"),
    transaction_type: Optional[str] = Query(None, description="Filter by 'inflow' or 'outflow'"),
    category: Optional[str] = Query(None, description="Filter by transaction category"),
    payment_status: Optional[str] = Query(None, description="Filter by payment status ('Received' or 'Paid')"),
    counterparty_id: Optional[str] = Query(None, description="Filter by counterparty (e.g. PARTNER008)"),
    search: Optional[str] = Query(None, description="Search by counterparty, category, description, or transaction_id"),
    min_amount: Optional[float] = Query(None, ge=0.0, description="Minimum transaction amount in INR"),
    max_amount: Optional[float] = Query(None, ge=0.0, description="Maximum transaction amount in INR"),
    period_type: str = Query("monthly", description="'monthly' or 'weekly'"),
    sort_by: Optional[str] = Query(None, description="Column to sort by"),
    sort_order: str = Query("desc", pattern="^(asc|desc)$", description="Sort order: 'asc' or 'desc'"),
    limit: int = Query(50, ge=1, le=1460, description="Number of rows to return per page"),
    offset: int = Query(0, ge=0, description="Pagination offset")
):
    """
    Returns cash flow transaction records with multi-dimensional filtering,
    category aggregations, periodic breakdown (weekly/monthly), search, sorting, and paginated rows.
    """
    validate_date_range(start_date, end_date)

    if transaction_type and transaction_type.lower() not in ("inflow", "outflow"):
        raise HTTPException(status_code=400, detail="Invalid transaction_type. Must be 'inflow' or 'outflow'.")

    loader = get_data_loader()
    df = loader.get_transactions()

    # Apply filters
    if start_date:
        df = df[df["transaction_date"] >= start_date]
    if end_date:
        df = df[df["transaction_date"] <= end_date]
    if transaction_type:
        df = df[df["transaction_type"].str.lower() == transaction_type.lower()]
    if category:
        df = df[df["category"].str.lower() == category.lower()]
    if payment_status:
        df = df[df["payment_status"].str.lower() == payment_status.lower()]
    if counterparty_id:
        df = df[df["counterparty_id"].str.upper() == counterparty_id.upper()]
    if min_amount is not None:
        df = df[df["amount_inr"] >= min_amount]
    if max_amount is not None:
        df = df[df["amount_inr"] <= max_amount]
    if search:
        s = search.strip().lower()
        search_mask = (
            df["counterparty_id"].str.lower().str.contains(s, na=False) |
            df["category"].str.lower().str.contains(s, na=False) |
            df["transaction_id"].str.lower().str.contains(s, na=False)
        )
        if "description" in df.columns:
            search_mask = search_mask | df["description"].str.lower().str.contains(s, na=False)
        df = df[search_mask]

    total_count = len(df)

    # 1. Overall Summary
    total_inflow = float(df[df["transaction_type"] == "inflow"]["amount_inr"].sum()) if not df.empty else 0.0
    total_outflow = float(df[df["transaction_type"] == "outflow"]["amount_inr"].sum()) if not df.empty else 0.0
    summary = {
        "total_transactions": total_count,
        "total_inflow_inr": round(total_inflow, 2),
        "total_outflow_inr": round(total_outflow, 2),
        "net_amount_inr": round(total_inflow - total_outflow, 2),
        "avg_transaction_inr": round(float(df["amount_inr"].mean()), 2) if total_count > 0 else 0.0
    }

    # 2. Aggregation by Category
    category_aggs = []
    if not df.empty:
        cat_grp = df.groupby(["category", "transaction_type"])["amount_inr"].agg(["sum", "count"]).reset_index()
        cat_grp = cat_grp.sort_values("sum", ascending=False)
        for _, r in cat_grp.iterrows():
            t_type = r["transaction_type"]
            denom = total_inflow if t_type == "inflow" else total_outflow
            share = (r["sum"] / denom * 100.0) if denom > 0 else 0.0
            category_aggs.append({
                "category": r["category"],
                "transaction_type": t_type,
                "total_amount_inr": round(float(r["sum"]), 2),
                "transaction_count": int(r["count"]),
                "share_pct": round(share, 1)
            })

    # 3. Aggregation by Period (Monthly or Weekly)
    period_aggs = []
    if not df.empty:
        df_per = df.copy()
        if period_type == "weekly":
            df_per["period"] = pd.to_datetime(df_per["transaction_date"]).dt.to_period("W").dt.start_time.dt.strftime("%Y-%m-%d")
        else:
            df_per["period"] = df_per["transaction_date"].str.slice(0, 7)

        for period_val, grp in df_per.groupby("period"):
            m_inflow = float(grp[grp["transaction_type"] == "inflow"]["amount_inr"].sum())
            m_outflow = float(grp[grp["transaction_type"] == "outflow"]["amount_inr"].sum())
            period_aggs.append({
                "period": str(period_val),
                "inflow_inr": round(m_inflow, 2),
                "outflow_inr": round(m_outflow, 2),
                "net_flow_inr": round(m_inflow - m_outflow, 2),
                "count": len(grp)
            })
        period_aggs.sort(key=lambda x: x["period"])

    # 4. Sorting and Paginated Raw Rows
    if sort_by and sort_by in df.columns:
        df_sorted = df.sort_values(sort_by, ascending=(sort_order == "asc"))
    else:
        df_sorted = df.sort_values("transaction_date", ascending=(sort_order == "asc"))

    paged = df_sorted.iloc[offset : offset + limit]
    rows = paged.to_dict(orient="records")

    return {
        "summary": summary,
        "by_category": category_aggs,
        "by_period": period_aggs,
        "pagination": {
            "total": total_count,
            "offset": offset,
            "limit": limit,
            "returned": len(rows)
        },
        "data": [sanitize_dict(r) for r in rows]
    }

@router.get("/transactions/waterfall")
def get_waterfall(
    start_date: Optional[str] = Query(None, description="Start date YYYY-MM-DD"),
    end_date: Optional[str] = Query(None, description="End date YYYY-MM-DD"),
    category: Optional[str] = Query(None, description="Optional category filter")
):
    """
    Returns opening balance, inflows by category, outflows by category, and closing balance
    formatted for a financial Waterfall chart showing total liquidity movement.
    """
    validate_date_range(start_date, end_date)
    loader = get_data_loader()
    cp_df = loader.get_cash_position()
    txn_df = loader.get_transactions()

    # Filter cash position for opening and closing cash
    cp_sub = cp_df.copy()
    if start_date:
        cp_sub = cp_sub[cp_sub["date"] >= start_date]
    if end_date:
        cp_sub = cp_sub[cp_sub["date"] <= end_date]

    if cp_sub.empty:
        opening_cash = float(cp_df.iloc[0]["opening_cash_balance_inr"])
        closing_cash = float(cp_df.iloc[-1]["closing_cash_balance_inr"])
    else:
        opening_cash = float(cp_sub.iloc[0]["opening_cash_balance_inr"])
        closing_cash = float(cp_sub.iloc[-1]["closing_cash_balance_inr"])

    # Filter transactions
    txn_sub = txn_df.copy()
    if start_date:
        txn_sub = txn_sub[txn_sub["transaction_date"] >= start_date]
    if end_date:
        txn_sub = txn_sub[txn_sub["transaction_date"] <= end_date]
    if category:
        txn_sub = txn_sub[txn_sub["category"].str.lower() == category.lower()]

    inflow_grp = txn_sub[txn_sub["transaction_type"] == "inflow"].groupby("category")["amount_inr"].sum().to_dict()
    outflow_grp = txn_sub[txn_sub["transaction_type"] == "outflow"].groupby("category")["amount_inr"].sum().to_dict()

    total_inflow = float(sum(inflow_grp.values()))
    total_outflow = float(sum(outflow_grp.values()))
    net_movement = total_inflow - total_outflow

    # Structured items for Plotly Waterfall
    items = []
    items.append({
        "label": "Opening Cash",
        "amount": round(opening_cash, 2),
        "measure": "absolute",
        "type": "opening",
        "color": "#3B82F6"
    })

    for cat_name, amt in sorted(inflow_grp.items(), key=lambda x: x[1], reverse=True):
        items.append({
            "label": cat_name,
            "amount": round(amt, 2),
            "measure": "relative",
            "type": "inflow",
            "color": "#14B8A6"
        })

    for cat_name, amt in sorted(outflow_grp.items(), key=lambda x: x[1], reverse=True):
        items.append({
            "label": cat_name,
            "amount": round(-amt, 2),
            "raw_amount": round(amt, 2),
            "measure": "relative",
            "type": "outflow",
            "color": "#F43F5E"
        })

    effective_closing = round(opening_cash + net_movement, 2) if category else round(closing_cash, 2)

    items.append({
        "label": "Closing Cash",
        "amount": effective_closing,
        "measure": "total",
        "type": "closing",
        "color": "#06B6D4"
    })

    return {
        "summary": {
            "opening_cash_inr": round(opening_cash, 2),
            "total_inflows_inr": round(total_inflow, 2),
            "total_outflows_inr": round(total_outflow, 2),
            "net_movement_inr": round(net_movement, 2),
            "closing_cash_inr": effective_closing,
            "start_date": start_date or str(cp_df.iloc[0]["date"]),
            "end_date": end_date or str(cp_df.iloc[-1]["date"])
        },
        "items": items
    }

@router.get("/forecast/combined")
def get_combined_forecast(
    start_date: Optional[str] = Query(None, description="Filter start date YYYY-MM-DD"),
    end_date: Optional[str] = Query(None, description="Filter end date YYYY-MM-DD"),
    include_forecast: bool = Query(True, description="Whether to append the 90-day forward forecast")
):
    """
    Returns a unified historical (actual) and 90-day forecast timeline with
    shaded boundary indicators and minimum threshold guidelines.
    """
    validate_date_range(start_date, end_date)
    loader = get_data_loader()
    actual_df = loader.get_cash_position().copy()
    fc_df = loader.get_forecast().copy()

    actual_last_date = str(actual_df.iloc[-1]["date"])
    fc_start_date = str(fc_df.iloc[0]["forecast_date"])
    fc_end_date = str(fc_df.iloc[-1]["forecast_date"])

    series = []
    # Historical actuals
    for _, r in actual_df.iterrows():
        d_str = str(r["date"])
        if start_date and d_str < start_date:
            continue
        # If end_date is specified and before the actual last date, respect it
        if end_date and d_str > end_date:
            continue
        series.append({
            "date": d_str,
            "actual_cash_inr": round(float(r["closing_cash_balance_inr"]), 2),
            "forecast_cash_inr": None,
            "inflow_inr": round(float(r["cash_inflow_inr"]), 2),
            "outflow_inr": round(float(r["cash_outflow_inr"]), 2),
            "net_flow_inr": round(float(r["net_cash_flow_inr"]), 2),
            "is_forecast": False
        })

    # Seamless connection on transition date
    if include_forecast and series:
        series[-1]["forecast_cash_inr"] = series[-1]["actual_cash_inr"]

    # Forecast records (90 days forward)
    if include_forecast:
        for _, r in fc_df.iterrows():
            d_str = str(r["forecast_date"])
            # If an explicit end_date was provided that is within the forecast period, cap at end_date
            if end_date and end_date >= fc_start_date and d_str > end_date:
                continue
            series.append({
                "date": d_str,
                "actual_cash_inr": None,
                "forecast_cash_inr": round(float(r["forecast_closing_balance_inr"]), 2),
                "inflow_inr": round(float(r["expected_cash_inflow_inr"]), 2),
                "outflow_inr": round(float(r["expected_cash_outflow_inr"]), 2),
                "net_flow_inr": round(float(r["expected_cash_inflow_inr"] - r["expected_cash_outflow_inr"]), 2),
                "is_forecast": True
            })

    return {
        "metadata": {
            "historical_end_date": actual_last_date,
            "forecast_start_date": fc_start_date,
            "forecast_end_date": fc_end_date,
            "minimum_required_cash_inr": 750000.0,
            "total_points": len(series)
        },
        "data": series
    }

@router.get("/forecast")
def get_forecast(
    start_date: Optional[str] = Query(None, description="Filter from forecast date YYYY-MM-DD"),
    end_date: Optional[str] = Query(None, description="Filter to forecast date YYYY-MM-DD"),
    limit: Optional[int] = Query(None, ge=1, le=90, description="Limit days returned (up to 90)")
):
    """
    Returns the 90-day cash flow forecast baseline with comprehensive summary projections.
    """
    validate_date_range(start_date, end_date)

    loader = get_data_loader()
    df = loader.get_forecast()

    if start_date:
        df = df[df["forecast_date"] >= start_date]
    if end_date:
        df = df[df["forecast_date"] <= end_date]
    if limit:
        df = df.head(limit)

    if df.empty:
        return {
            "summary": {
                "forecast_days": 0,
                "opening_cash_balance_inr": 0.0,
                "projected_closing_cash_inr": 0.0,
                "total_expected_inflow_inr": 0.0,
                "total_expected_outflow_inr": 0.0,
                "forecast_net_cash_flow_inr": 0.0,
                "minimum_required_cash_inr": 750000.0,
                "projected_surplus_deficit_inr": -750000.0
            },
            "data": []
        }

    opening = float(df.iloc[0]["opening_cash_balance_inr"])
    closing = float(df.iloc[-1]["forecast_closing_balance_inr"])
    inflow_sum = float(df["expected_cash_inflow_inr"].sum())
    outflow_sum = float(df["expected_cash_outflow_inr"].sum())
    net_sum = inflow_sum - outflow_sum
    min_cash = float(df.iloc[0]["minimum_required_cash_inr"])
    surplus = closing - min_cash

    summary = {
        "forecast_days": len(df),
        "forecast_horizon_start": str(df.iloc[0]["forecast_date"]),
        "forecast_horizon_end": str(df.iloc[-1]["forecast_date"]),
        "opening_cash_balance_inr": round(opening, 2),
        "projected_closing_cash_inr": round(closing, 2),
        "total_expected_inflow_inr": round(inflow_sum, 2),
        "total_expected_outflow_inr": round(outflow_sum, 2),
        "forecast_net_cash_flow_inr": round(net_sum, 2),
        "minimum_required_cash_inr": round(min_cash, 2),
        "projected_surplus_deficit_inr": round(surplus, 2),
        "solvency_status": "Above minimum" if surplus >= 0 else "Breached"
    }

    records = df.to_dict(orient="records")
    return {
        "summary": summary,
        "data": [sanitize_dict(r) for r in records]
    }
