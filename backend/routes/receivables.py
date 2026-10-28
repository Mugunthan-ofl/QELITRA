from fastapi import APIRouter, Query, HTTPException
from typing import Optional, List, Dict, Any
from datetime import datetime
import pandas as pd
from backend.core.data_loader import get_data_loader
from backend.core.utils import validate_date_range, validate_date_str, sanitize_dict
from backend.core.cache import cache_manager
from backend.core.metrics import calculate_dso_and_dpo

router = APIRouter(prefix="/api", tags=["Working Capital (AR & AP)"])

@router.get("/ar-ap")
def get_ar_ap(
    start_date: Optional[str] = Query(None, description="Filter invoices billed on or after (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="Filter invoices billed on or before (YYYY-MM-DD)"),
    invoice_type: Optional[str] = Query(None, description="Filter by 'receivable' or 'payable'"),
    status: Optional[str] = Query(None, description="Filter by 'Paid', 'Partially paid', or 'Unpaid'"),
    counterparty_id: Optional[str] = Query(None, description="Filter by counterparty (e.g. PARTNER018)"),
    search: Optional[str] = Query(None, description="Search counterparty_id or invoice_id"),
    as_of_date: Optional[str] = Query(None, description="Reference date for aging calculations (defaults to 2025-12-31)"),
    sort_by: Optional[str] = Query(None, description="Column to sort by"),
    sort_order: str = Query("desc", pattern="^(asc|desc)$", description="Sort order: 'asc' or 'desc'"),
    limit: int = Query(50, ge=1, le=1000, description="Page limit"),
    offset: int = Query(0, ge=0, description="Page offset")
):
    """
    Returns working capital invoice records with comprehensive aging schedule buckets,
    aggregate balance totals (including DSO & DPO), overdue vs on-time breakdowns,
    and top customer/supplier counterparties.
    """
    validate_date_range(start_date, end_date)

    if invoice_type and invoice_type.lower() not in ("receivable", "payable"):
        raise HTTPException(status_code=400, detail="Invalid invoice_type. Must be 'receivable' or 'payable'.")

    valid_statuses = ("paid", "partially paid", "unpaid")
    if status and status.lower() not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status '{status}'. Must be one of: 'Paid', 'Partially paid', 'Unpaid'.")

    loader = get_data_loader()
    df = loader.get_invoices()

    # Reference date for aging calculation (default: 2025-12-31)
    if as_of_date:
        validate_date_str(as_of_date, "as_of_date")
        ref_dt = datetime.strptime(as_of_date, "%Y-%m-%d")
        ref_date_str = as_of_date
    else:
        ref_date_str = "2025-12-31"
        ref_dt = datetime.strptime(ref_date_str, "%Y-%m-%d")

    # Apply filters
    if start_date:
        df = df[df["invoice_date"] >= start_date]
    if end_date:
        df = df[df["invoice_date"] <= end_date]
    if invoice_type:
        df = df[df["invoice_type"].str.lower() == invoice_type.lower()]
    if status:
        df = df[df["status"].str.lower() == status.lower()]
    if counterparty_id:
        df = df[df["counterparty_id"].str.upper() == counterparty_id.upper()]
    if search:
        s = search.strip().lower()
        df = df[
            df["counterparty_id"].str.lower().str.contains(s, na=False) |
            df["invoice_id"].str.lower().str.contains(s, na=False)
        ]

    # 1. High-Level Working Capital Totals
    ar_all = df[df["invoice_type"] == "receivable"]
    ap_all = df[df["invoice_type"] == "payable"]

    ar_invoiced = float(ar_all["invoice_amount_inr"].sum()) if not ar_all.empty else 0.0
    ar_paid = float(ar_all["amount_paid_inr"].sum()) if not ar_all.empty else 0.0
    ar_outstanding = float(ar_all["outstanding_amount_inr"].sum()) if not ar_all.empty else 0.0

    ap_invoiced = float(ap_all["invoice_amount_inr"].sum()) if not ap_all.empty else 0.0
    ap_paid = float(ap_all["amount_paid_inr"].sum()) if not ap_all.empty else 0.0
    ap_outstanding = float(ap_all["outstanding_amount_inr"].sum()) if not ap_all.empty else 0.0

    # Calculate DSO and DPO based on current filtered records or dataset
    dso_metrics = calculate_dso_and_dpo(df, as_of_date=ref_date_str)

    totals = {
        "as_of_date": ref_date_str,
        "receivables": {
            "total_invoiced_inr": round(ar_invoiced, 2),
            "total_collected_inr": round(ar_paid, 2),
            "total_outstanding_inr": round(ar_outstanding, 2),
            "collection_rate_pct": round((ar_paid / ar_invoiced * 100.0), 1) if ar_invoiced > 0 else 0.0,
            "invoice_count": len(ar_all),
            "pending_count": int((ar_all["status"] != "Paid").sum()) if not ar_all.empty else 0
        },
        "payables": {
            "total_billed_inr": round(ap_invoiced, 2),
            "total_settled_inr": round(ap_paid, 2),
            "total_outstanding_inr": round(ap_outstanding, 2),
            "settlement_rate_pct": round((ap_paid / ap_invoiced * 100.0), 1) if ap_invoiced > 0 else 0.0,
            "invoice_count": len(ap_all),
            "pending_count": int((ap_all["status"] != "Paid").sum()) if not ap_all.empty else 0
        },
        "net_working_capital_gap_inr": round(ar_outstanding - ap_outstanding, 2),
        "gap_status": "Net Inflow Expected" if (ar_outstanding - ap_outstanding) >= 0 else "Net Outflow Demand",
        "dso_days": dso_metrics["dso_days"],
        "dpo_days": dso_metrics["dpo_days"],
        "cash_conversion_gap_days": dso_metrics["cash_conversion_gap_days"]
    }

    # 2. Aging Buckets (Days Past Due relative to ref_date)
    unpaid_df = df[df["status"] != "Paid"].copy()
    if not unpaid_df.empty:
        unpaid_df["due_dt"] = pd.to_datetime(unpaid_df["due_date"])
        unpaid_df["days_past_due"] = (ref_dt - unpaid_df["due_dt"]).dt.days
    else:
        unpaid_df["days_past_due"] = pd.Series(dtype=int)

    buckets_def = [
        {"key": "current", "label": "Current (Not Due)", "min_days": -9999, "max_days": 0},
        {"key": "1_30", "label": "1 - 30 Days", "min_days": 1, "max_days": 30},
        {"key": "31_60", "label": "31 - 60 Days", "min_days": 31, "max_days": 60},
        {"key": "61_90", "label": "61 - 90 Days", "min_days": 61, "max_days": 90},
        {"key": "90_plus", "label": "90+ Days", "min_days": 91, "max_days": 9999},
    ]

    aging_buckets = []
    for b in buckets_def:
        b_sub = unpaid_df[(unpaid_df["days_past_due"] >= b["min_days"]) & (unpaid_df["days_past_due"] <= b["max_days"])]
        b_ar = b_sub[b_sub["invoice_type"] == "receivable"]
        b_ap = b_sub[b_sub["invoice_type"] == "payable"]

        ar_amt = float(b_ar["outstanding_amount_inr"].sum()) if not b_ar.empty else 0.0
        ap_amt = float(b_ap["outstanding_amount_inr"].sum()) if not b_ap.empty else 0.0

        aging_buckets.append({
            "bucket_key": b["key"],
            "bucket_label": b["label"],
            "receivables_amount_inr": round(ar_amt, 2),
            "receivables_count": len(b_ar),
            "payables_amount_inr": round(ap_amt, 2),
            "payables_count": len(b_ap),
            "net_impact_inr": round(ar_amt - ap_amt, 2)
        })

    # 3. Overdue vs On-time Breakdown
    ar_unpaid = unpaid_df[unpaid_df["invoice_type"] == "receivable"]
    ap_unpaid = unpaid_df[unpaid_df["invoice_type"] == "payable"]

    ar_overdue = ar_unpaid[ar_unpaid["days_past_due"] > 0]
    ar_ontime = ar_unpaid[ar_unpaid["days_past_due"] <= 0]

    ap_overdue = ap_unpaid[ap_unpaid["days_past_due"] > 0]
    ap_ontime = ap_unpaid[ap_unpaid["days_past_due"] <= 0]

    ar_overdue_amt = float(ar_overdue["outstanding_amount_inr"].sum()) if not ar_overdue.empty else 0.0
    ar_ontime_amt = float(ar_ontime["outstanding_amount_inr"].sum()) if not ar_ontime.empty else 0.0
    ap_overdue_amt = float(ap_overdue["outstanding_amount_inr"].sum()) if not ap_overdue.empty else 0.0
    ap_ontime_amt = float(ap_ontime["outstanding_amount_inr"].sum()) if not ap_ontime.empty else 0.0

    overdue_breakdown = {
        "receivables": {
            "overdue_amount_inr": round(ar_overdue_amt, 2),
            "overdue_count": len(ar_overdue),
            "ontime_amount_inr": round(ar_ontime_amt, 2),
            "ontime_count": len(ar_ontime),
            "overdue_pct": round((ar_overdue_amt / ar_outstanding * 100.0), 1) if ar_outstanding > 0 else 0.0
        },
        "payables": {
            "overdue_amount_inr": round(ap_overdue_amt, 2),
            "overdue_count": len(ap_overdue),
            "ontime_amount_inr": round(ap_ontime_amt, 2),
            "ontime_count": len(ap_ontime),
            "overdue_pct": round((ap_overdue_amt / ap_outstanding * 100.0), 1) if ap_outstanding > 0 else 0.0
        },
        "combined": {
            "total_overdue_amount_inr": round(ar_overdue_amt + ap_overdue_amt, 2),
            "total_ontime_amount_inr": round(ar_ontime_amt + ap_ontime_amt, 2),
            "total_overdue_count": len(ar_overdue) + len(ap_overdue),
            "total_ontime_count": len(ar_ontime) + len(ap_ontime)
        }
    }

    # 4. Top Counterparties by Outstanding Balance
    top_ar_counterparties = []
    if not ar_all.empty:
        ar_cp = ar_all.groupby("counterparty_id")["outstanding_amount_inr"].agg(["sum", "count"]).reset_index()
        ar_cp = ar_cp[ar_cp["sum"] > 0].sort_values("sum", ascending=False).head(8)
        for _, r in ar_cp.iterrows():
            top_ar_counterparties.append({
                "counterparty_id": r["counterparty_id"],
                "outstanding_amount_inr": round(float(r["sum"]), 2),
                "invoices_count": int(r["count"])
            })

    top_ap_counterparties = []
    if not ap_all.empty:
        ap_cp = ap_all.groupby("counterparty_id")["outstanding_amount_inr"].agg(["sum", "count"]).reset_index()
        ap_cp = ap_cp[ap_cp["sum"] > 0].sort_values("sum", ascending=False).head(8)
        for _, r in ap_cp.iterrows():
            top_ap_counterparties.append({
                "counterparty_id": r["counterparty_id"],
                "outstanding_amount_inr": round(float(r["sum"]), 2),
                "invoices_count": int(r["count"])
            })

    # 5. Status Breakdown
    status_summary = []
    for s_val in ["Paid", "Partially paid", "Unpaid"]:
        sub_s = df[df["status"] == s_val]
        status_summary.append({
            "status": s_val,
            "count": len(sub_s),
            "total_invoiced_inr": round(float(sub_s["invoice_amount_inr"].sum()), 2) if not sub_s.empty else 0.0,
            "total_outstanding_inr": round(float(sub_s["outstanding_amount_inr"].sum()), 2) if not sub_s.empty else 0.0
        })

    # 6. Sorting & Paginated Rows
    total_matching = len(df)
    if sort_by and sort_by in df.columns:
        df_sorted = df.sort_values(sort_by, ascending=(sort_order == "asc"))
    else:
        df_sorted = df.sort_values("invoice_date", ascending=(sort_order == "asc"))

    paged = df_sorted.iloc[offset : offset + limit]
    rows = paged.to_dict(orient="records")

    return {
        "totals": totals,
        "aging_schedule": aging_buckets,
        "overdue_vs_ontime": overdue_breakdown,
        "top_counterparties": {
            "receivables": top_ar_counterparties,
            "payables": top_ap_counterparties
        },
        "status_breakdown": status_summary,
        "pagination": {
            "total": total_matching,
            "offset": offset,
            "limit": limit,
            "returned": len(rows)
        },
        "data": [sanitize_dict(r) for r in rows]
    }
