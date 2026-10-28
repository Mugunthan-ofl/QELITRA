import os
import json
from pathlib import Path
from typing import Dict, Any, Optional
import pandas as pd

class DataLoader:
    """
    Read-only data loader for corporate liquidity datasets.
    Loads and caches CSV files and validation reports in memory.
    Strictly treats the data/ directory as READ-ONLY.
    """
    _instance: Optional["DataLoader"] = None

    def __new__(cls) -> "DataLoader":
        if cls._instance is None:
            cls._instance = super(DataLoader, cls).__new__(cls)
            cls._instance._initialize()
        return cls._instance

    def _initialize(self) -> None:
        # Base directory resolution
        base_dir = Path(__file__).resolve().parent.parent.parent
        self.data_dir = base_dir / "data"
        self.cache_dir = base_dir / "backend" / "cache"
        self.cache_dir.mkdir(parents=True, exist_ok=True)

        self._cache: Dict[str, Any] = {}
        self.reload_all()

    def reload_all(self) -> None:
        """Loads all CSVs and reports strictly in read-only mode with parsed dates."""
        # 1. Cash Position (365 days)
        cp_path = self.data_dir / "cash_position_365_days.csv"
        df_cp = pd.read_csv(cp_path)
        df_cp["date"] = pd.to_datetime(df_cp["date"]).dt.strftime("%Y-%m-%d")
        self._cache["cash_position"] = df_cp

        # 2. Transactions (1460 rows)
        txn_path = self.data_dir / "cash_flow_transactions_1460_rows.csv"
        df_txn = pd.read_csv(txn_path)
        df_txn["transaction_date"] = pd.to_datetime(df_txn["transaction_date"]).dt.strftime("%Y-%m-%d")
        df_txn["expected_payment_date"] = pd.to_datetime(df_txn["expected_payment_date"]).dt.strftime("%Y-%m-%d")
        self._cache["transactions"] = df_txn

        # 3. Receivables & Payables (1000 rows)
        inv_path = self.data_dir / "receivables_payables_1000_rows.csv"
        df_inv = pd.read_csv(inv_path)
        df_inv["invoice_date"] = pd.to_datetime(df_inv["invoice_date"]).dt.strftime("%Y-%m-%d")
        df_inv["due_date"] = pd.to_datetime(df_inv["due_date"]).dt.strftime("%Y-%m-%d")
        self._cache["invoices"] = df_inv

        # 4. Forecast (90 days)
        fc_path = self.data_dir / "cash_flow_forecast_90_days.csv"
        df_fc = pd.read_csv(fc_path)
        df_fc["forecast_date"] = pd.to_datetime(df_fc["forecast_date"]).dt.strftime("%Y-%m-%d")
        self._cache["forecast"] = df_fc

        # 5. Stress Testing (22 scenarios)
        sc_path = self.data_dir / "stress_testing_22_scenarios.csv"
        df_sc = pd.read_csv(sc_path)
        self._cache["scenarios"] = df_sc

        # 6. Dashboard KPI Summary
        kpi_path = self.data_dir / "dashboard_kpi_summary.csv"
        df_kpi = pd.read_csv(kpi_path)
        self._cache["kpi_summary"] = df_kpi

        # 7. Validation Report JSON
        val_path = self.data_dir / "validation_report.json"
        if val_path.exists():
            with open(val_path, "r", encoding="utf-8") as f:
                self._cache["validation_report"] = json.load(f)
        else:
            self._cache["validation_report"] = {}

    def get_cash_position(self) -> pd.DataFrame:
        return self._cache["cash_position"].copy()

    def get_transactions(self) -> pd.DataFrame:
        return self._cache["transactions"].copy()

    def get_invoices(self) -> pd.DataFrame:
        return self._cache["invoices"].copy()

    def get_forecast(self) -> pd.DataFrame:
        return self._cache["forecast"].copy()

    def get_scenarios(self) -> pd.DataFrame:
        return self._cache["scenarios"].copy()

    def get_kpi_summary(self) -> pd.DataFrame:
        return self._cache["kpi_summary"].copy()

    def get_validation_report(self) -> Dict[str, Any]:
        return dict(self._cache.get("validation_report", {}))


# Singleton instance helper
def get_data_loader() -> DataLoader:
    return DataLoader()
