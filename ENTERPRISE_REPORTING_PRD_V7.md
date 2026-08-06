# 🏆 Enterprise Reporting PRD v7.0 — Universal Domain Architecture (10/10 Standard)

> **Official Enterprise Standard:** Every FuelPro domain workspace must strictly implement the **Universal 10-Layer Domain Architecture**. No domain may omit Documents, Audit Trail, AI Insights, Workflow Lifecycle, or KPI Drilldowns.
> **Formula Registry & Traceability:** Every displayed KPI card MUST declare a standardized **Formula ID** (e.g. `FIN-001`, `INV-002`, `AR-003`) traceable to verified double-entry database records.

---

## 🏛 1. The Universal 10-Layer Workspace Architecture Standard

Every one of the 10 Core Sidebar Domains follows the exact same 10-layer structural pattern:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        UNIVERSAL 10-LAYER DOMAIN ARCHITECTURE                           │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ Layer 01: 📊 Overview Dashboard         (Always Tab #1 — Domain Control Room)        │
│ Layer 02: ⚡ Realtime KPI Cards          (With Formula ID + Live Status + Confidence)  │
│ Layer 03: 📋 Operational Registers       (Search, Filter, Sort, Pagination & Details)  │
│ Layer 04: 📈 Domain Analytics            (Charts, Heatmaps, Performance Curves)        │
│ Layer 05: 🤖 Domain-Specific AI Advisor  (Context-Aware AI Insights & Recommendations)│
│ Layer 06: 📁 Documents Vault             (PDF Receipts, GRN Seals, Bank Statements)    │
│ Layer 07: 🔄 Workflow Lifecycle Engine   (Draft → Pending → Approved → Settled)        │
│ Layer 08: 📋 Mandatory Audit Trail       (Immutable Who, When, What, Old/New Value Log)│
│ Layer 09: 📄 Reports, Export & Print     (PDF Briefings, Excel Matrix, Print Deck)    │
│ Layer 10: ⚙️ Role-Based Settings         (Configurable Limits, Margins & RBAC)         │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔬 2. Universal Realtime & KPI Drilldown Rule

Every single displayed KPI card in FuelPro MUST follow the strict **Traceability & Drilldown Chain**:

$$\text{KPI Widget} \longrightarrow \text{Formula ID} \longrightarrow \text{Engine Service} \longrightarrow \text{Database Repository} \longrightarrow \text{Realtime Stream} \longrightarrow \text{Drilldown Register}$$

### 🎯 Mandatory Drilldown Mapping Matrix:
| KPI Card | Formula ID | Engine Source | Target Register on Click |
| :--- | :--- | :--- | :--- |
| **Gross Sales Revenue** | `FIN-001` | `useAnalyticsComputeEngine` | **Nozzle Sales Register** (`FS_REGISTER`) |
| **Net Retained Operating Profit** | `FIN-002` | `LedgerEngine` | **General Ledger Statement** (`L1`) |
| **Total Tank Inventory Valuation** | `INV-001` | `useInventoryStore` | **Tank Inventory Register** (`INV_TANK_REG`) |
| **Total Accounts Receivable (AR)** | `AR-001` | `useCustomerStore` | **Customer Credit Register** (`CUS_REGISTER`) |
| **Days Sales Outstanding (DSO)** | `AR-002` | `useCustomerStore` | **AR Aging Analysis** (`CUS_AGING`) |
| **Total Accounts Payable (AP)** | `AP-001` | `useSupplierStore` | **Supplier Payables Aging** (`AP_AGING`) |
| **Days Payable Outstanding (DPO)** | `AP-002` | `useSupplierStore` | **Supplier AP Register** (`AP_REGISTER`) |
| **Liquid Vault Cash Balance** | `FIN-003` | `useFinancialStore` | **Vault Cash Book Ledger** (`FIN_CASHBOOK`) |
| **Verified Bank Position** | `FIN-004` | `useFinancialStore` | **Bank Reconciliation Ledger** (`FIN_BANK`) |
| **Active Workforce Count** | `HR-001` | `useStaffStore` | **Staff Attendance Register** (`HR_ATTENDANCE`) |
| **Cash Shortage Accuracy Index** | `HR-002` | `useStaffStore` | **Shift Shortages Audit** (`HR_SHORTAGES`) |
| **Super Petrol Retail Rate** | `PRC-001` | `usePricingStore` | **Active OGRA Price Board** (`PRC_BOARD`) |

---

## 🤖 3. Domain-Specific AI Advisor Matrix (AI in Every Module)

AI is no longer isolated to the Executive Analytics workspace. Every operational domain features a dedicated, context-aware **AI Advisor**:

```
🤖 DOMAIN AI ADVISORS MATRIX
├── ⛽ Fuel Operations:   AI Nozzle Drift & Meter Calibration Advisor
├── 📦 Inventory:         AI Tank Evaporation Risk & Stockout Prediction Advisor
├── 🛒 Purchases:         AI OMC Freight Rebate & Vendor Rate Optimization Advisor
├── 💰 Finance:           AI Liquidity & Cash Flow Waterfall Advisor
├── 📒 Ledgers:           AI Double-Entry Discrepancy & Fraud Detection Advisor
├── 👥 Customers (AR):    AI Credit Default & Recovery Risk Advisor
├── 🚛 Suppliers (AP):    AI Discount Capture & Payment Optimization Advisor
├── 👨‍💼 Staff & HR:        AI Cashier Shortage Anomaly & Performance Advisor
├── 🏷️ Pricing:          AI OGRA Rate Change Margin Compression Advisor
└── 📊 Analytics:        AI Enterprise Strategy & Board Briefing Advisor
```

---

## 📁 4. Mandatory Documents Vault Matrix

Every domain workspace incorporates Layer 06 (**Documents Vault**) for complete digital audit compliance:

- **Fuel Operations**: Meter Calibration Certificates, Bowser Seal Photos, Shift Meter Sheets.
- **Inventory**: Manual Dip Logsheets, ATG Calibration Reports, Lube Goods Received Receipts.
- **Purchases**: OMC Bowser Delivery Invoices, Freight Vouchers, Quality & Density Lab Reports.
- **Finance**: Bank Deposit Receipts, Stamped Cheque Copies, Operating Expense Bills (Utility, Generator Diesel).
- **Ledgers**: Signed Journal Vouchers (JV), Annual Audit Statements, Tax Compliance Certificates.
- **Customers (AR)**: Customer Credit Agreements, Bank Guarantee Documents, Signed Fleet Delivery Receipts.
- **Suppliers (AP)**: OMC Supply Contracts, Supplier Payment Cheque Copies, Tax Exemption Certificates.
- **Staff & HR**: Employee CNIC Copies, Signed Salary Payslips, Advance Request Vouchers.
- **Pricing**: Official OGRA Gazette Price Circulars, Ministry Directives.
- **Analytics**: Historical Board Briefing Decks (PDFs), Signed Executive Summaries.

---

## 🔗 5. Cross-Module Navigation & Deep Linking

FuelPro enforces seamless end-to-end operational traceability across workspaces:

```
Customer Profile ──► Credit Invoice ──► Customer Ledger ──► Payment Voucher ──► Journal Entry (JV) ──► General Ledger ──► Executive Analytics
```

Clicking any document reference or transaction ID in any module immediately opens the inspector drawer or navigates to the corresponding source record without losing workspace state.

---

## 🛠 6. Complete 10-Domain Universal Architecture Map

### 01. ⛽ Fuel Operations Workspace
- **Layer 01 (Overview)**: Operations Cockpit, Live Dispenser Status, Active Shifts
- **Layer 02 (KPIs)**: Total Fuel Revenue (`FIN-001`), Liters Dispensed (`VOL-001`), Active Nozzles (`PUMP-001`)
- **Layer 03 (Registers)**: Shift Operations, Nozzle Sales Register, Dispenser Status Table
- **Layer 04 (Analytics)**: Hourly Sales Demand Profile, Nozzle Volume Histogram
- **Layer 05 (AI Advisor)**: **AI Nozzle Meter Drift & Calibration Advisor**
- **Layer 06 (Documents)**: Calibration Certificates, Seal Photos, Meter Sheets
- **Layer 07 (Workflow)**: Open Shift $\rightarrow$ Record Meter Deltas $\rightarrow$ Reconcile Drops $\rightarrow$ Close Shift & Lock
- **Layer 08 (Audit Trail)**: Shift Locks, Calibration Stamps, Override Actions
- **Layer 09 (Reports)**: Daily Nozzle Meter Audit, Shift Closing Summary
- **Layer 10 (Settings)**: Pump Calibration Tolerance ($\pm 0.05\%$), Shift Lock Rules

### 02. 📦 Inventory Management Workspace (Fuel & Lube)
- **Layer 01 (Overview)**: Stock Valuation Cockpit, Tank Capacities, Reorder Alarms
- **Layer 02 (KPIs)**: Total Stock Valuation (`INV-001`), Tank Volume (`INV-002`), Evaporation Loss % (`INV-003`)
- **Layer 03 (Registers)**: Fuel Tank Register, Manual Dip Logbook (Primary), Lube Stock Register
- **Layer 04 (Analytics)**: ATG Tank Gauges, ABC Turnover Pareto Curve, Dip Variance Chart
- **Layer 05 (AI Advisor)**: **AI Tank Evaporation & Stockout Risk Advisor**
- **Layer 06 (Documents)**: Manual Dip Sheets, Lube Delivery Receipts, ATG Test Reports
- **Layer 07 (Workflow)**: Receive Stock $\rightarrow$ Record Pre/Post Dips $\rightarrow$ Reconcile Meters $\rightarrow$ Adjust Variance
- **Layer 08 (Audit Trail)**: Dip Adjustments, Stock Revaluations, Damage Logs
- **Layer 09 (Reports)**: ATG & Dip Reconciliation Report, Inventory Valuation Report
- **Layer 10 (Settings)**: Reorder Point Thresholds (20%), Safe Fill Limits

### 03. 🛒 Purchases Workspace
- **Layer 01 (Overview)**: OMC Procurement Cockpit, In-Transit Bowsers, Outstanding POs
- **Layer 02 (KPIs)**: Total Procurement Spend (`PUR-001`), Delivery Lead Time (`PUR-002`), AP Liabilities (`AP-001`)
- **Layer 03 (Registers)**: PO Register, GRN Offload Register, Bowser Inspection Logbook
- **Layer 04 (Analytics)**: OMC Rate Evolution, Bowser Delivery Punctuality Trend
- **Layer 05 (AI Advisor)**: **AI OMC Freight Rebate & Procurement Advisor**
- **Layer 06 (Documents)**: OMC Invoices, Bowser Seal Inspection Photos, Density Lab Reports
- **Layer 07 (Workflow)**: Draft PO $\rightarrow$ OMC Approval $\rightarrow$ Bowser In-Transit $\rightarrow$ Decanting GRN $\rightarrow$ Invoice Matching $\rightarrow$ Settlement
- **Layer 08 (Audit Trail)**: PO Approvals, Decanting Gain/Loss Logs, Price Overrides
- **Layer 09 (Reports)**: OMC Procurement Summary, GRN Offload Log, Lead Time Scorecard
- **Layer 10 (Settings)**: OMC Vendor Contracts, Approved Delivery Depots

### 04. 💰 Finance Workspace (Treasury, Cash & OpEx)
- **Layer 01 (Overview)**: Liquid Capital Position Cockpit, Vault Cash, Bank Accounts
- **Layer 02 (KPIs)**: Liquid Capital (`FIN-003`), Vault Balance (`FIN-004`), Monthly OpEx (`EXP-001`)
- **Layer 03 (Registers)**: Vault Cash Book, Bank Deposit Register, Expense Voucher Log
- **Layer 04 (Analytics)**: Cash Flow Waterfall Diagram, OpEx Category Breakdown
- **Layer 05 (AI Advisor)**: **AI Liquidity & Cash Flow Advisor**
- **Layer 06 (Documents)**: Bank Deposit Slips, Utility Bills, Expense Receipts
- **Layer 07 (Workflow)**: Shift Cash Drop $\rightarrow$ Vault Entry $\rightarrow$ Bank Deposit Slip $\rightarrow$ Bank Statement Clearing
- **Layer 08 (Audit Trail)**: Cash Drops, Expense Approvals, Bank Adjustments
- **Layer 09 (Reports)**: Daily Cash Book Reconciliation, OpEx Audit Statement
- **Layer 10 (Settings)**: Cash Vault Limit, Approval Thresholds

### 05. 📒 Ledgers Workspace (Accounting & Ledgers)
- **Layer 01 (Overview)**: Accounting Control Room, Trial Balance Status, Double-Entry Check
- **Layer 02 (KPIs)**: Double-Entry Balance Verification (`ACC-001`), Net Profit (`FIN-002`), Total Assets (`ACC-002`)
- **Layer 03 (Registers)**: Chart of Accounts, General Ledger, Customer Ledger, Supplier Ledger, Journal Entries
- **Layer 04 (Analytics)**: P&L Waterfall Diagram, Balance Sheet Asset/Liability Distribution
- **Layer 05 (AI Advisor)**: **AI Double-Entry Discrepancy & Fraud Detector**
- **Layer 06 (Documents)**: Signed Journal Vouchers, Audit Statements, Tax Certificates
- **Layer 07 (Workflow)**: Transaction Event $\rightarrow$ Auto-Generate JV $\rightarrow$ Post to GL $\rightarrow$ Trial Balance $\rightarrow$ Period Closing
- **Layer 08 (Audit Trail)**: JV Postings, Period Close Logs, Account Modifications
- **Layer 09 (Reports)**: General Ledger Statement, Trial Balance, Formal P&L & Balance Sheet
- **Layer 10 (Settings)**: Chart of Accounts Structure, Fiscal Period Locks

### 06. 👥 Customers Workspace (Accounts Receivable - AR)
- **Layer 01 (Overview)**: Credit Control Cockpit, AR Portfolio Balance, Overdue Alarms
- **Layer 02 (KPIs)**: Total AR Outstanding (`AR-001`), DSO (`AR-002`), Overdue >30d (`AR-003`)
- **Layer 03 (Registers)**: Customer Directory, Credit Limits, AR Aging Master Register, Recovery Log
- **Layer 04 (Analytics)**: AR Aging Bucket Chart, Top Fleet Customers Revenue Share
- **Layer 05 (AI Advisor)**: **AI Fleet Credit Default & Recovery Risk Advisor**
- **Layer 06 (Documents)**: Credit Agreements, Bank Guarantees, Signed Billing Receipts
- **Layer 07 (Workflow)**: Credit Sale $\rightarrow$ Credit Invoiced $\rightarrow$ Statement Generation $\rightarrow$ Recovery Receipt $\rightarrow$ Allocation
- **Layer 08 (Audit Trail)**: Credit Limit Revisions, Debt Write-offs, Blocked Accounts
- **Layer 09 (Reports)**: Master AR Aging Analysis, Commercial Billing Statements
- **Layer 10 (Settings)**: Credit Terms (15/30 Days), Auto-Block Thresholds

### 07. 🚛 Suppliers Workspace (Accounts Payable - AP)
- **Layer 01 (Overview)**: AP Liability Cockpit, OMC Supplier Accounts, Upcoming Payments
- **Layer 02 (KPIs)**: Total AP Balance (`AP-001`), DPO (`AP-002`), 7-Day Due Payments (`AP-003`)
- **Layer 03 (Registers)**: OMC Directory, AP Aging Register, Payment Voucher Log
- **Layer 04 (Analytics)**: AP Aging Breakdown, Procurement Expenditure Share
- **Layer 05 (AI Advisor)**: **AI Supplier Discount Capture & Payment Advisor**
- **Layer 06 (Documents)**: Supply Contracts, Cheque Copies, Tax Exemption Certificates
- **Layer 07 (Workflow)**: GRN Bill $\rightarrow$ Invoice Matching $\rightarrow$ Payment Voucher $\rightarrow$ Bank Transfer $\rightarrow$ Ledger Clearing
- **Layer 08 (Audit Trail)**: Payment Approvals, Rebate Adjustments, Bank Wire Logs
- **Layer 09 (Reports)**: Master AP Aging Report, OMC Payment History
- **Layer 10 (Settings)**: Payment Terms, Approved OMC Payment Methods

### 08. 👨‍💼 Staff & HR Workspace
- **Layer 01 (Overview)**: Workforce Cockpit, Today's Attendance, Shift Roster Grid
- **Layer 02 (KPIs)**: Active Staff (`HR-001`), Cashier Accuracy % (`HR-002`), Monthly Payroll (`HR-003`)
- **Layer 03 (Registers)**: Employee Directory, Shift Attendance Log, Shortage Deductions, Payroll Table
- **Layer 04 (Analytics)**: Attendance Distribution, Cash Shortage Trends per Salesman
- **Layer 05 (AI Advisor)**: **AI Cashier Shortage Anomaly & Staff Performance Advisor**
- **Layer 06 (Documents)**: Staff CNIC Copies, Signed Payslips, Advance Requests
- **Layer 07 (Workflow)**: Shift Check-In $\rightarrow$ Cash Handover Audit $\rightarrow$ Log Shortages $\rightarrow$ Payroll Generation $\rightarrow$ Disbursal
- **Layer 08 (Audit Trail)**: Shortage Deductions, Salary Advances, Attendance Edits
- **Layer 09 (Reports)**: Master Payroll Summary, Staff Attendance & Shortage Audit
- **Layer 10 (Settings)**: Basic Salary Bands, Commission Rates, Shortage Deduction Cap

### 09. 🏷️ Pricing Workspace
- **Layer 01 (Overview)**: Price Control Room, Current OGRA Retail Rates, Margins
- **Layer 02 (KPIs)**: Super Petrol Rate (`PRC-001`), Dealer Margin (`PRC-002`), Tax Levy / Liter (`PRC-003`)
- **Layer 03 (Registers)**: Active Price Board, Price Revision History, Revaluation Logbook
- **Layer 04 (Analytics)**: 12-Month Tariff Evolution, Price Component Breakdown Stack
- **Layer 05 (AI Advisor)**: **AI OGRA Rate Change Margin Compression Advisor**
- **Layer 06 (Documents)**: Official OGRA Gazette Price Circulars, Ministry Directives
- **Layer 07 (Workflow)**: OGRA Announcement $\rightarrow$ Schedule Price Revision $\rightarrow$ Owner Approval $\rightarrow$ POS & Tank Revaluation Broadcast
- **Layer 08 (Audit Trail)**: Price Approvals, Rate Revisions, Tank Revaluation JVs
- **Layer 09 (Reports)**: Official Price Board Report, Inventory Revaluation Audit
- **Layer 10 (Settings)**: Dealer Margins, Automated POS Sync Rules

### 10. 📊 Analytics Workspace (Executive Intelligence)
- **Layer 01 (Overview)**: Executive Briefing Cockpit, Network Performance Banner
- **Layer 02 (KPIs)**: Enterprise Gross Revenue (`FIN-001`), Net Profit (`FIN-002`), Total Fuel Volume (`VOL-001`)
- **Layer 03 (Registers)**: Multi-Station Network Matrix, Target Scorecards, Governance Alert Log
- **Layer 04 (Analytics)**: Profitability Sankey Diagram, 5-Year Trend Curves, Multi-Branch Radar Chart
- **Layer 05 (AI Advisor)**: **AI Enterprise Strategy & Board Briefing Advisor**
- **Layer 06 (Documents)**: Board Briefing Decks (PDFs), Signed Executive Summaries
- **Layer 07 (Workflow)**: Realtime Data Stream $\rightarrow$ Compute Engine $\rightarrow$ AI Briefing $\rightarrow$ Board Deck Export
- **Layer 08 (Audit Trail)**: Governance Violations, System Configuration Audits
- **Layer 09 (Reports)**: Board Briefing Deck PDF, Network Matrix CSV Exporter
- **Layer 10 (Settings)**: Executive Target Scorecards, Email Briefing Schedules
