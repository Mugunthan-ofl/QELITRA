Corporate Liquidity Management & Interactive Stress Testing — Dataset Pack

DATA NOTICE
All records are synthetic, generated for project demonstration. They are not real company or bank records. Currency is INR. Dates use YYYY-MM-DD. The 90-day forecast is generated from synthetic assumptions and is not a trained ML prediction.

FILES
1. cash_position_365_days.csv — 365 daily balances, inflows, outflows, net cash flow and minimum cash threshold.
2. cash_flow_transactions_1460_rows.csv — 1,460 transaction rows (four per historical day), reconciled exactly to the daily summary.
3. receivables_payables_1000_rows.csv — 1,000 synthetic invoices with payment status and outstanding balance.
4. cash_flow_forecast_90_days.csv — 90-day forecast with opening/closing cash and expected inflows/outflows.
5. stress_testing_22_scenarios.csv — 6 named scenarios plus a 4x4 matrix of 16 stress combinations.
6. dashboard_kpi_summary.csv — precomputed headline metrics.
7. validation_report.json — automated consistency-check results.

CLEANING / PROCESSING
- Standardized date strings to YYYY-MM-DD.
- Monetary fields are numeric INR values with two decimal places.
- Unique transaction, invoice, and scenario IDs.
- No missing values in required columns.
- Validated cash balance arithmetic.
- Reconciled daily transaction totals to cash position totals.
- Validated invoice outstanding amount arithmetic.
- Validated forecast balance arithmetic.
- Stress outcomes are calculated from baseline forecast totals and scenario shock percentages.

HOW TO USE FOR INTERACTIVE STRESS TESTING
- Display historical cash trend using cash_position_365_days.csv.
- Use cash_flow_transactions_1460_rows.csv for category inflow/outflow charts.
- Use receivables_payables_1000_rows.csv for overdue/outstanding invoice tables.
- Display the 90-day forecast from cash_flow_forecast_90_days.csv.
- Use stress_testing_22_scenarios.csv as presets. For true interactive sliders, calculate at runtime:
  stressed_inflow = baseline_inflow * (1 - inflow_reduction_pct / 100)
  stressed_outflow = baseline_outflow * (1 + outflow_increase_pct / 100)
  projected_closing_cash = opening_cash + stressed_inflow - stressed_outflow
  liquidity_surplus_deficit = projected_closing_cash - minimum_required_cash
- Do not add daily cash summary amounts to transaction amounts; these represent the same flows at different granularity and doing so double-counts.
- Invoice data is a separate illustrative sample and is not reconciled to the transaction ledger.
- Mark dashboard as "Demo / Simulated Data"; do not describe as live banking data.
