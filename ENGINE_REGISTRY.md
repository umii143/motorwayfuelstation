# ⚙️ FuelPro Enterprise Engine Registry Specification

> **System Standard:** All business logic, financial calculations, telemetry transformations, and KPI aggregations must be computed deterministically through centralized Engine services. Inline component calculations are strictly prohibited.

---

## 🏛 1. Core Engine Inventory & Service Contracts

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                          FUELPRO ENTERPRISE ENGINE REGISTRY                            │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ 1. AnalyticsComputeEngine   (Aggregates multi-station revenue, net profit, AI forecasts)│
│ 2. FuelOperationsEngine     (Computes nozzle meter deltas, test drops, pump flow rates)│
│ 3. InventoryComputeEngine   (Computes tank dips, stock valuation, evaporation loss)    │
│ 4. ProcurementEngine        (Processes OMC POs, GRN offload gains/losses, lead times) │
│ 5. TreasuryFinanceEngine    (Manages vault cash drops, bank deposits, OpEx vouchers)   │
│ 6. DoubleEntryLedgerEngine  (Generates balanced JVs, Trial Balance, P&L, Balance Sheet)  │
│ 7. CustomerCreditArEngine   (Enforces credit limits, DSO aging buckets, recovery logs) │
│ 8. SupplierPayableApEngine  (Tracks OMC liabilities, DPO aging, rebate settlements)   │
│ 9. StaffPayrollEngine       (Computes shift attendance, shortage deductions, payslips) │
│ 10. OGRAPricingEngine       (Calculates tariff revisions, dealer margins, revaluations)│
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 2. Realtime Data Pipeline & Data Source Registry

| Data Source (PostgreSQL / Firestore) | Processing Engine | Transformed Output | Downstream Dependent Widgets |
| :--- | :--- | :--- | :--- |
| `shifts` & `nozzles` | `FuelOperationsEngine` | `nozzleMeterDelta`, `shiftGrossRevenue` | Gross Sales Revenue (`FIN-001`), Active Nozzles (`PUMP-001`) |
| `tanks` & `dip_logs` | `InventoryComputeEngine` | `physicalStockLiters`, `evaporationLossPct` | Tank Stock Valuation (`INV-001`), Reorder Alarm (`INV-003`) |
| `purchase_orders` & `grns` | `ProcurementEngine` | `grnOffloadGainLoss`, `apInvoiceAmount` | Total Procurement Spend (`PUR-001`), AP Liability (`AP-001`) |
| `cash_books` & `bank_accounts` | `TreasuryFinanceEngine` | `liquidVaultCash`, `reconciledBankBalance` | Vault Cash Balance (`FIN-003`), Bank Position (`FIN-004`) |
| `journal_entries` & `general_ledger` | `DoubleEntryLedgerEngine` | `balancedTrialBalance`, `netProfitPnl` | Net Retained Operating Profit (`FIN-002`), Asset Value (`ACC-002`) |
| `customers` & `credit_invoices` | `CustomerCreditArEngine` | `arAgingBuckets`, `dsoDays` | Total AR Outstanding (`AR-001`), Overdue >30d (`AR-003`) |
| `suppliers` & `supplier_ledgers` | `SupplierPayableApEngine` | `apAgingBuckets`, `dpoDays` | Total AP Outstanding (`AP-001`), 7-Day Upcoming AP (`AP-003`) |
| `staff` & `attendance` | `StaffPayrollEngine` | `netPayrollExpense`, `shortageAccuracyIndex` | Active Staff Count (`HR-001`), Shortage Accuracy (`HR-002`) |
| `fuel_prices` & `ogra_circulars` | `OGRAPricingEngine` | `retailRatePerLiter`, `dealerMarginPerLiter` | Super Petrol Rate (`PRC-001`), Revaluation Gain/Loss (`PRC-003`) |

---

## ⛓ 3. Cross-Module Dependency Graph

```
Nozzle Meter Delta Reading (Fuel Ops)
  │
  ▼
Shift Closing Audit (Fuel Ops) ──► Pricing Tariff (Pricing)
  │
  ▼
Sales Register Transaction (Sales / Fuel Ops)
  │
  ├──────────────────────────────────┐
  ▼                                  ▼
Tank Stock Dip Drop (Inventory)    Shift Cash Collection (Finance)
  │                                  │
  ▼                                  ▼
Inventory Asset Revaluation        Vault Cash Drop & Bank Deposit (Finance)
  │                                  │
  └─────────────────┬────────────────┘
                    ▼
          Automated Journal Entry (Ledgers)
                    │
                    ▼
          General Ledger & Trial Balance (Ledgers)
                    │
                    ▼
          Executive Profitability & AI Forecast (Analytics)
```
