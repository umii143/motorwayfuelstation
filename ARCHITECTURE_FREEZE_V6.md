# 🔒 FuelPro Enterprise Architecture Freeze Specification (v6.0 Final Locked)

> **Official Directive:** FuelPro Architecture & Contract Specification is officially **100% LOCKED & FROZEN**. No new PRDs, Master Architecture redesigns, or top-level domain changes will be created. All future engineering work is strictly focused on **Production Execution & Verification**.
> **UI-Sidebar Alignment:** The 10 Core Sidebar Workspaces ARE the 10 Core Reporting Domains.
> **Database Standard:** Google Firestore is the Primary Operational Database. PostgreSQL/MySQL/Oracle are abstracted pluggable adapters via the Repository Layer.
> **Operational Source of Truth:** Manual Tank Dip and Manual Mechanical Meter Reading are the Immutable Primary System of Record. ATG sensors, pulse encoders, and IoT are Optional Telemetry Verification Adapters.

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

---

## ⚙️ 2. Core Production Architecture Stack

```
   ┌────────────────────────────────────────────────────────┐
   │                   React UI Components                  │
   └───────────────────────────┬────────────────────────────┘
                               │
                               ▼
   ┌────────────────────────────────────────────────────────┐
   │              Zustand Domain State Stores               │
   └───────────────────────────┬────────────────────────────┘
                               │
                               ▼
   ┌────────────────────────────────────────────────────────┐
   │                Universal Compute Engine                │
   │      (Formula Registry + Engine Calculation Cache)     │
   └───────────────────────────┬────────────────────────────┘
                               │
                               ▼
   ┌────────────────────────────────────────────────────────┐
   │               Domain Repository Layer                  │
   │  (InventoryRepo, CustomerRepo, LedgerRepo, StaffRepo)   │
   └───────────────────────────┬────────────────────────────┘
                               │
            ┌──────────────────┴──────────────────┐
            ▼                                     ▼
┌──────────────────────┐              ┌──────────────────────┐
│  Primary Database    │              │  Offline Queue &     │
│  (Google Firestore)  │              │  Sync Engine         │
└──────────────────────┘              └──────────────────────┘
            │                                     │
            └──────────────────┬──────────────────┘
                               ▼
            ┌────────────────────────────────────┐
            │    Pluggable Database Adapters     │
            │  (PostgreSQL / MySQL / SQL Server) │
            └────────────────────────────────────┘
```

### Key Architectural Standards:
1. **Repository Abstraction Layer**: React components NEVER query Firestore or SQL directly. All data access passes through domain repositories (`InventoryRepository`, `CustomerRepository`, `LedgerRepository`, `SupplierRepository`).
2. **Manual Tank Dip Primary**: Physical manual dip measurement is the primary inventory drop baseline. ATG sensors serve as an automated verification plugin.
3. **Universal Offline Queue**: Changes made while offline are saved to an offline queue, automatically syncing upon network reconnect with conflict resolution.
4. **Universal Notification Engine**: Multi-channel dispatch for system events (`SMS`, `Email`, `FCM Push`, `WhatsApp`, `Audit Vault`).
5. **Scheduler Engine**: Automated background cron runner for nightly backups, payroll processing, monthly closing, and OGRA tariff alerts.
6. **Plugin Architecture**: Core business platform with pluggable domain modules (`Lubes`, `EV Charging`, `Fleet Cards`, `LPG`, `Mart POS`, `Restaurant POS`, `Tyre Shop`).

---

## 🔄 3. Domain Execution Phase Protocol

Every business domain progresses sequentially through the **5-Step Production Execution Cycle**:

```
 ┌────────────────┐
 │ 1. DUMMY CODE  │  Remove all local mock arrays, static strings & placeholder numbers
 │    REMOVAL     │
 └───────┬────────┘
         │
         ▼
 ┌────────────────┐
 │ 2. REPOSITORY &│  Connect domain views directly to Domain Repositories & Engine Hooks
 │    REALTIME    │  (`InventoryRepository`, `CustomerRepository`, `LedgerRepository`)
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
 │ 5. DOMAIN      │  Domain status set to PRODUCTION READY & FROZEN
 │    FREEZE      │
 └────────────────┘
```
