# 🔬 FuelPro Enterprise Formula Registry & KPI Contracts (v7.0)

> **Execution Law:** Every KPI displayed in FuelPro MUST declare a unique **Formula ID** mapped to an explicit contract definition. Dummy numbers, hardcoded static values, or un-mapped KPIs are strictly prohibited.

---

## 📜 1. Master KPI Formula Contracts Matrix

### 01. Financial & Executive KPIs

#### `FIN-001` — Today's Gross Sales Revenue
- **Formula ID**: `FIN-001`
- **Collection / Table**: `shifts` / `sales_transactions`
- **Realtime Stream**: `onSnapshot(collection(db, "shifts"))`
- **Engine Service**: `useAnalyticsComputeEngine`
- **Calculation Formula**: $\sum (\text{endMeter} - \text{startMeter} - \text{testDrops}) \times \text{retailRate}$
- **Refresh Interval**: Realtime (Instantaneous on shift tick)
- **Target Drilldown Register**: `Nozzle Sales Register` (`FS_REGISTER`)
- **Role Permissions**: `Owner`, `Manager`, `Auditor`

#### `FIN-002` — Net Retained Operating Profit
- **Formula ID**: `FIN-002`
- **Collection / Table**: `general_ledger` / `journal_entries`
- **Realtime Stream**: Live double-entry ledger stream
- **Engine Service**: `LedgerEngine`
- **Calculation Formula**: $\text{Gross Sales Revenue} - \text{COGS} - \text{Total Operating Expenses (OpEx)}$
- **Refresh Interval**: Realtime
- **Target Drilldown Register**: `General Ledger Statement` (`L1`)
- **Role Permissions**: `Owner`, `Manager`

#### `FIN-003` — Liquid Cash Vault Position
- **Formula ID**: `FIN-003`
- **Collection / Table**: `cash_books`
- **Realtime Stream**: Vault cash register snapshot
- **Engine Service**: `TreasuryFinanceEngine`
- **Calculation Formula**: $\text{Opening Cash} + \text{Shift Drops} - \text{Bank Deposits} - \text{OpEx Vouchers}$
- **Refresh Interval**: Realtime
- **Target Drilldown Register**: `Vault Cash Book Ledger` (`FIN_CASHBOOK`)
- **Role Permissions**: `Owner`, `Manager`, `Cashier`

#### `FIN-004` — Reconciled Bank Account Position
- **Formula ID**: `FIN-004`
- **Collection / Table**: `bank_accounts`
- **Realtime Stream**: Bank ledger snapshot
- **Engine Service**: `TreasuryFinanceEngine`
- **Calculation Formula**: $\sum \text{Verified Bank Balances} - \text{Uncleared Cheques}$
- **Refresh Interval**: Realtime
- **Target Drilldown Register**: `Bank Reconciliation Ledger` (`FIN_BANK`)
- **Role Permissions**: `Owner`, `Manager`

---

### 02. Inventory & Tank Telemetry KPIs

#### `INV-001` — Total Inventory Asset Valuation
- **Formula ID**: `INV-001`
- **Collection / Table**: `tanks` / `products`
- **Realtime Stream**: Live tank volume & lube quantity stream
- **Engine Service**: `InventoryComputeEngine`
- **Calculation Formula**: $\sum (\text{Tank Volume Liters} \times \text{Cost Rate}) + \sum (\text{Lube Qty} \times \text{Cost Rate})$
- **Refresh Interval**: Realtime
- **Target Drilldown Register**: `Tank Inventory Register` (`INV_TANK_REG`)
- **Role Permissions**: `Owner`, `Manager`, `Auditor`

#### `INV-002` — Total Tank Fuel Volume (Liters)
- **Formula ID**: `INV-002`
- **Collection / Table**: `tanks` / `dip_logs`
- **Realtime Stream**: ATG sensor stream / Manual dip snapshot
- **Engine Service**: `InventoryComputeEngine`
- **Calculation Formula**: $\sum \text{Physical Manual Dip Volume (Liters)}$
- **Refresh Interval**: Realtime
- **Target Drilldown Register**: `Manual Tank Dip Register` (`INV_DIP`)
- **Role Permissions**: `Owner`, `Manager`, `Auditor`

#### `INV-003` — Evaporation Stock Loss Percentage
- **Formula ID**: `INV-003`
- **Collection / Table**: `dip_logs` / `nozzle_readings`
- **Realtime Stream**: Dip reconciliation stream
- **Engine Service**: `InventoryComputeEngine`
- **Calculation Formula**: $\frac{\text{Opening Dip} + \text{GRN Additions} - \text{Meter Sales} - \text{Closing Dip}}{\text{Opening Dip} + \text{GRN Additions}} \times 100$
- **Refresh Interval**: Daily Shift Close
- **Target Drilldown Register**: `Stock Reconciliation & Loss Register` (`INV_RECON`)
- **Role Permissions**: `Owner`, `Manager`

---

### 03. Customers & Accounts Receivable (AR) KPIs

#### `AR-001` — Total Accounts Receivable Outstanding
- **Formula ID**: `AR-001`
- **Collection / Table**: `customers` / `customer_ledgers`
- **Realtime Stream**: Customer ledger snapshot
- **Engine Service**: `CustomerCreditArEngine`
- **Calculation Formula**: $\sum \text{Customer Credit Balances}$
- **Refresh Interval**: Realtime
- **Target Drilldown Register**: `Customer Directory & Credit Register` (`CUS_REGISTER`)
- **Role Permissions**: `Owner`, `Manager`, `Auditor`

#### `AR-002` — Days Sales Outstanding (DSO)
- **Formula ID**: `AR-002`
- **Collection / Table**: `customer_ledgers` / `sales_transactions`
- **Realtime Stream**: AR aging computation stream
- **Engine Service**: `CustomerCreditArEngine`
- **Calculation Formula**: $\frac{\text{Total Accounts Receivable}}{\text{Total Credit Sales (30 Days)}} \times 30$
- **Refresh Interval**: Realtime
- **Target Drilldown Register**: `Accounts Receivable Aging Analysis` (`CUS_AGING`)
- **Role Permissions**: `Owner`, `Manager`

---

### 04. Suppliers & Accounts Payable (AP) KPIs

#### `AP-001` — Total Accounts Payable Liabilities
- **Formula ID**: `AP-001`
- **Collection / Table**: `suppliers` / `supplier_ledgers`
- **Realtime Stream**: Supplier ledger snapshot
- **Engine Service**: `SupplierPayableApEngine`
- **Calculation Formula**: $\sum \text{Pending OMC Supplier GRN Liabilities}$
- **Refresh Interval**: Realtime
- **Target Drilldown Register**: `Supplier Payables Register` (`AP_REGISTER`)
- **Role Permissions**: `Owner`, `Manager`

#### `AP-002` — Days Payable Outstanding (DPO)
- **Formula ID**: `AP-002`
- **Collection / Table**: `supplier_ledgers` / `grns`
- **Realtime Stream**: AP aging computation stream
- **Engine Service**: `SupplierPayableApEngine`
- **Calculation Formula**: $\frac{\text{Total Accounts Payable}}{\text{Total COGS Purchases (30 Days)}} \times 30$
- **Refresh Interval**: Realtime
- **Target Drilldown Register**: `Accounts Payable Aging Analysis` (`AP_AGING`)
- **Role Permissions**: `Owner`, `Manager`

---

### 05. Workforce & Payroll KPIs

#### `HR-001` — Active Workforce Count
- **Formula ID**: `HR-001`
- **Collection / Table**: `attendance` / `staff`
- **Realtime Stream**: Shift check-in snapshot
- **Engine Service**: `StaffPayrollEngine`
- **Calculation Formula**: $\text{COUNT}(\text{Staff Check-In Logs Today})$
- **Refresh Interval**: Realtime
- **Target Drilldown Register**: `Shift Attendance Register` (`HR_ATTENDANCE`)
- **Role Permissions**: `Owner`, `Manager`

#### `HR-002` — Cashier Shortage Accuracy Index (%)
- **Formula ID**: `HR-002`
- **Collection / Table**: `shifts` / `staff`
- **Realtime Stream**: Shift handover audit stream
- **Engine Service**: `StaffPayrollEngine`
- **Calculation Formula**: $100 - \left( \frac{\sum \text{Cash Shortages}}{\sum \text{Shift Collections}} \times 100 \right)$
- **Refresh Interval**: Realtime
- **Target Drilldown Register**: `Staff Cash Shortage Audit` (`HR_SHORTAGES`)
- **Role Permissions**: `Owner`, `Manager`

---

### 06. Pricing & Tariff KPIs

#### `PRC-001` — Active OGRA Retail Price (Super Petrol)
- **Formula ID**: `PRC-001`
- **Collection / Table**: `fuel_prices`
- **Realtime Stream**: Active rate board stream
- **Engine Service**: `OGRAPricingEngine`
- **Calculation Formula**: $\text{Cost Rate} + \text{Dealer Margin} + \text{Petroleum Levy} + \text{IFEM} + \text{GST}$
- **Refresh Interval**: Realtime
- **Target Drilldown Register**: `Active OGRA Price Board` (`PRC_BOARD`)
- **Role Permissions**: `Owner`, `Manager`, `Auditor`, `Cashier`
