import math
from datetime import datetime
from typing import Optional, Tuple, Any
from fastapi import HTTPException

def validate_date_str(date_str: Optional[str], param_name: str) -> Optional[datetime]:
    """
    Validates that a date string matches the YYYY-MM-DD format.
    Raises HTTPException(400) if invalid.
    """
    if not date_str:
        return None
    try:
        return datetime.strptime(date_str, "%Y-%m-%d")
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid date format for '{param_name}': '{date_str}'. Expected format is YYYY-MM-DD (e.g. 2025-06-30)."
        )

def validate_date_range(start_date: Optional[str], end_date: Optional[str]) -> Tuple[Optional[str], Optional[str]]:
    """
    Validates and verifies that start_date <= end_date.
    Raises HTTPException(400) on invalid range.
    """
    dt_start = validate_date_str(start_date, "start_date")
    dt_end = validate_date_str(end_date, "end_date")

    if dt_start and dt_end and dt_start > dt_end:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid date range: start_date '{start_date}' cannot be after end_date '{end_date}'."
        )

    return start_date, end_date

def sanitize_value(val: Any) -> Any:
    """
    Ensures floats and ints are JSON-compliant (converts NaN and Inf to None).
    """
    if isinstance(val, float):
        if math.isnan(val) or math.isinf(val):
            return None
        return round(val, 2)
    return val

def sanitize_dict(d: dict) -> dict:
    """Recursively cleans dictionary values for JSON compliance."""
    clean = {}
    for k, v in d.items():
        if isinstance(v, dict):
            clean[k] = sanitize_dict(v)
        elif isinstance(v, list):
            clean[k] = [sanitize_dict(item) if isinstance(item, dict) else sanitize_value(item) for item in v]
        else:
            clean[k] = sanitize_value(v)
    return clean
