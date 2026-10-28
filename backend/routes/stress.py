from typing import Optional
from fastapi import APIRouter
from pydantic import BaseModel, Field
from backend.core.stress import (
    get_scenarios,
    run_stress_test,
    run_monte_carlo,
)

router = APIRouter(prefix="/api", tags=["Stress Testing"])

class StressRunRequest(BaseModel):
    scenario_id: Optional[str] = Field(default=None, description="Preset scenario ID (e.g. SCN001)")
    inflow_reduction_pct: Optional[float] = Field(default=None, ge=0.0, le=100.0, description="Revenue / Inflow reduction percentage")
    outflow_increase_pct: Optional[float] = Field(default=None, ge=0.0, le=200.0, description="Expense / Outflow increase percentage")
    collection_delay_days: Optional[int] = Field(default=0, ge=0, le=90, description="Receivables collection delay in days")
    credit_line_reduction_pct: Optional[float] = Field(default=0.0, ge=0.0, le=100.0, description="Credit line reduction percentage")
    minimum_cash_threshold: Optional[float] = Field(default=None, ge=0.0, description="Minimum reserve cash threshold in INR")
    projection_horizon: Optional[int] = Field(default=90, ge=1, le=90, description="Projection horizon in days (up to 90)")

class MonteCarloRequest(BaseModel):
    scenario_id: Optional[str] = Field(default=None, description="Preset scenario ID")
    inflow_reduction_pct: Optional[float] = Field(default=None, ge=0.0, le=100.0, description="Inflow shock percentage")
    outflow_increase_pct: Optional[float] = Field(default=None, ge=0.0, le=200.0, description="Outflow shock percentage")
    collection_delay_days: Optional[int] = Field(default=0, ge=0, le=90, description="Collection delay in days")
    credit_line_reduction_pct: Optional[float] = Field(default=0.0, ge=0.0, le=100.0, description="Credit line reduction percentage")
    minimum_cash_threshold: Optional[float] = Field(default=None, ge=0.0, description="Minimum required cash threshold in INR")
    projection_horizon: Optional[int] = Field(default=90, ge=1, le=90, description="Projection horizon days")
    simulations: int = Field(default=1000, ge=100, le=2000, description="Number of stochastic simulations (500 to 1000)")
    inflow_volatility_pct: float = Field(default=25.0, ge=1.0, le=100.0, description="Inflow daily standard deviation %")
    outflow_volatility_pct: float = Field(default=15.0, ge=1.0, le=100.0, description="Outflow daily standard deviation %")

@router.get("/scenarios")
def list_scenarios():
    """Returns the 22 pre-configured stress testing scenarios with parameters."""
    return get_scenarios()

@router.post("/stress/run")
def execute_stress_test(payload: StressRunRequest):
    """
    Applies deterministic liquidity shocks to the cash forecast and returns
    baseline vs. stressed cash series, breach date, runway, min cash, and status.
    """
    return run_stress_test(
        scenario_id=payload.scenario_id,
        inflow_reduction_pct=payload.inflow_reduction_pct,
        outflow_increase_pct=payload.outflow_increase_pct,
        collection_delay_days=payload.collection_delay_days,
        credit_line_reduction_pct=payload.credit_line_reduction_pct,
        minimum_cash_threshold=payload.minimum_cash_threshold,
        projection_horizon=payload.projection_horizon,
    )

@router.post("/stress/monte-carlo")
def execute_monte_carlo(payload: MonteCarloRequest):
    """
    Performs 500 to 1000 stochastic Monte Carlo simulations around the chosen
    scenario, returning percentile bands (5th, 25th, 50th, 75th, 95th) and breach probability.
    """
    return run_monte_carlo(
        scenario_id=payload.scenario_id,
        inflow_reduction_pct=payload.inflow_reduction_pct,
        outflow_increase_pct=payload.outflow_increase_pct,
        collection_delay_days=payload.collection_delay_days,
        credit_line_reduction_pct=payload.credit_line_reduction_pct,
        minimum_cash_threshold=payload.minimum_cash_threshold,
        projection_horizon=payload.projection_horizon,
        simulations=payload.simulations,
        inflow_volatility_pct=payload.inflow_volatility_pct,
        outflow_volatility_pct=payload.outflow_volatility_pct,
    )

