# 🔒 FuelPro Enterprise Architecture Freeze Specification (v6.0 Final)

> **Official Directive:** FuelPro Architecture is officially **FROZEN**. All future engineering work transitions from PRD design phase to **Execution Phase**.
> **UI-Sidebar Alignment:** The 10 Core Sidebar Workspaces ARE the 10 Core Reporting Domains. No separate top-level domains or duplicate workspaces will be created.

---

## 🏛 1. Permanent Core Sidebar Domains (10 Fixed Domains)

The sidebar domains and navigation layout are permanently frozen:

```
📊 FUELPRO ENTERPRISE CORE DOMAINS (100% UI-ALIGNED)
├── 01. ⛽ Fuel Operations (Shifts, Manual Meter Readings, Nozzle Sales Register, Dispensers)
├── 02. 📦 Inventory (Manual Tank Dip Primary, ATG Adapter, Lube Stock, Inventory Valuation)
├── 03. 🛒 Purchases (OMC Bulk Procurement, PO, GRN, Lead Time Scorecards)
├── 04. 💰 Finance (Treasury, Vault Cash, Bank Accounts, Digital Wallets, Station OpEx)
├── 05. 📒 Ledgers (Double-Entry CoA, General Ledger, Customer Ledger, Supplier Ledger, P&L)
├── 06. 👥 Customers (Accounts Receivable - AR, Fleet Credit Limits, Aging, Recovery)
├── 07. 🚛 Suppliers (Accounts Payable - AP, OMC Liabilities, Payables Aging)
├── 08. 👨‍💼 Staff & HR (Shift Attendance, Rosters, Payroll Generator, Cash Shortages)
├── 09. 🏷️ Pricing (OGRA Tariffs, Margins, Inventory Rate Revaluation)
└── 10. 📊 Analytics (Read-Only Executive Cockpit, Executive Dashboard, Board Deck, AI Forecasts)
```

> 🛑 **Rule:** Adding separate top-level domains (e.g. "Executive Dashboard" or "POS Sales") or duplicate workspaces (e.g. "Finance Plus", "Smart Inventory") is strictly prohibited. Executive Dashboard is embedded inside Analytics; Nozzle Sales Register is embedded inside Fuel Operations.

---

## ⚙️ 2. Core Architectural Principles Adopted

### 1. Manual Meter & Manual Tank Dip are Primary Systems of Record
- **Mechanical Meter Reading Primary:** `Previous Meter` $\rightarrow$ `Current Meter` $\rightarrow$ `Volume Sold` $\rightarrow$ `Gross Revenue` $\rightarrow$ `COGS` $\rightarrow$ `General Ledger`.
- **Manual Tank Dip Primary:** Physical dip measurement is the primary inventory drop baseline.
- **ATG / IoT Adapter:** ATG tank sensors and pulse encoders serve as an **automated verification adapter/plugin**, comparing sensor telemetry against manual meter & dip readings.

### 2. Enterprise Hybrid Data Architecture
- **PostgreSQL / NestJS / Redis**: Primary enterprise database, transactional system of record, double-entry financial ledger, and heavy analytics engine.
- **Google Firebase**: Supporting infrastructure for Authentication, Realtime UI Sync (`onSnapshot`), Storage, FCM Notifications, and Presence.

### 3. Centralized Deterministic Business Engine Layer
- All calculations, formulas, KPIs, and risk alerts MUST be processed deterministically through central Engine hooks & services (`useAnalyticsComputeEngine`, `TransactionEngine`, `LedgerEngine`). No UI component may calculate inline business metrics.

### 4. Pure Read-Only Executive Analytics Layer
- The Executive Analytics domain is strictly a **read-only decision support system (DSS)**. It consumes computed metrics from all operational domains and provides executive intelligence, AI forecasts, and board deck generator capabilities with **ZERO operational CRUD**.

### 5. Domain Isolation & Self-Containment
- Each domain operates independently with its own:
  - Dedicated Sub-Workspace Views & Sub-Tabs
  - Dedicated Realtime Store Hooks (`onSnapshot`)
  - Dedicated Engine Calculation Wrappers
  - Dedicated Reports & Audit Logs

---

## 🔄 3. Domain Execution Phase Protocol

Every business domain progresses sequentially through the **5-Step Execution Cycle**:

```
 ┌────────────────┐
 │ 1. DUMMY CODE  │  Remove all local mock arrays, static strings & placeholder numbers
 │    REMOVAL     │
 └───────┬────────┘
         │
         ▼
 ┌────────────────┐
 │ 2. REALTIME    │  Connect domain views directly to live store hooks
 │    ENGINE      │  (`useShiftStore`, `useInventoryStore`, `useCustomerStore`, etc.)
 └───────┬────────┘
         │
         ▼
 ┌────────────────┐
 │ 3. FUNCTIONAL  │  Wire all action buttons to functional report PDF generators, CSV matrix
 │    REPORTS     │  exporters, and audit log inspectors
 └───────┬────────┘
         │
         ▼
 ┌────────────────┐
 │ 4. TESTING &   │  Execute `npx tsc --noEmit` and verify zero layout overflow, high text
 │    VERIFY      │  visibility contrast, and performance budgeting
 └───────┬────────┘
         │
         ▼
 ┌────────────────┐
 │ 5. DOMAIN      │  Domain status set to COMPLETED & FROZEN
 │    FREEZE      │
 └────────────────┘
```

---

## 📅 Domain Execution Readiness Checklist

| Domain | Router Component | Engine & Stores | Realtime Data | Reports & Exporter | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **01. Fuel Operations** | `FuelOperationsWorkspaceView.tsx` | `useShiftStore` | Connected | Live | ✅ **FREEZE** |
| **02. Inventory** | `InventoryWorkspaceView.tsx` | `useInventoryStore` | Connected | Live | ✅ **FREEZE** |
| **03. Purchases** | `PurchasesWorkspaceView.tsx` | `useSupplierStore` | Connected | Live | ✅ **FREEZE** |
| **04. Finance** | `FinanceWorkspaceView.tsx` | `useFinancialStore` | Connected | Live | ✅ **FREEZE** |
| **05. Ledgers** | `LedgersWorkspaceView.tsx` | `LedgerEngine` | Connected | Live | ✅ **FREEZE** |
| **06. Customers (AR)** | `CustomersWorkspaceView.tsx` | `useCustomerStore` | Connected | Live | ✅ **FREEZE** |
| **07. Suppliers (AP)** | `SuppliersWorkspaceView.tsx` | `useSupplierStore` | Connected | Live | ✅ **FREEZE** |
| **08. Staff & HR** | `StaffWorkspaceView.tsx` | `useStaffStore` | Connected | Live | ✅ **FREEZE** |
| **09. Pricing** | `PricingWorkspaceView.tsx` | `usePricingStore` | Connected | Live | ✅ **FREEZE** |
| **10. Analytics** | `AnalyticsWorkspaceView.tsx` | `useAnalyticsComputeEngine` | Connected | Live | ✅ **FREEZE** |
