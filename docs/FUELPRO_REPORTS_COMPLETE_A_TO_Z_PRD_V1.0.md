# FuelPro — Reports Module: The Complete A-to-Z PRD
### "Har Report Aik Kahani Sunata Hai — Aur Har Kahani Sach Hoti Hai"
### (Every Report Tells a Story — And Every Story Is True)
## Version 1.0 — Release Specification
### Document Classification: STRICTLY CONFIDENTIAL — FuelPro Enterprise Architecture
### Primary Product: FuelPro Enterprise Reports Platform (reports-v2 workspace)

---

# 1. Document Control

| Attribute | Value |
|---|---|
| **Document** | FuelPro Reports Module — Complete A-to-Z PRD |
| **Version** | v1.0 |
| **Status** | Release Specification (Phase 1 ✅ · Phase 2 ✅ · Phase 3 ✅ — v1.0) |
| **Tagline** | ہر رپورٹ ایک کہانی سناتی ہے — اور ہر کہانی سچ ہوتی ہے |
| **Scope** | 26 A–Z Intelligence Domains • 47 Registered Reports • Live Data Rendering |
| **Related Docs** | `FUELPRO_ENTERPRISE_REPORTS_MASTER_PRD_V2.0.md` • `FUELPRO_ENTERPRISE_REPORTING_BIBLE_V1.0.md` |
| **Governing Rules** | AGENTS.md Global Engineering Rules #1–#126 |

---

# 2. Executive Vision

## 2.1 Vision Statement

FuelPro Reports Platform ایک **Enterprise Operational Intelligence System** ہے — صرف رپورٹس کا مجموعہ نہیں۔ ہر رپورٹ ایک کہانی سناتی ہے: *کہانی اس بات کی کہ اسٹیشن پر کیا ہوا، کیا توجہ چاہتا ہے، اور اگلا عمل کیا ہونا چاہیے۔*

ہر کہانی **سچ** ہوتی ہے کیونکہ ہر عدد:

- ✅ **Live** — براہِ راست Google Firebase آپریشنل ریکارڈز سے
- ✅ **Traceable** — ہر KPI اپنے ماخذ ٹرانزیکشن تک واپس جاتا ہے
- ✅ **Explainable** — ہر نمبر کی وضاحت Formula Registry سے
- ✅ **Auditable** — ہر عمل SHA-256 proof کے ساتھ محفوظ
- ✅ **Reproducible** — وہی ان پٹ، وہی نتیجہ، سالوں بعد بھی

## 2.2 Product Principles (reports-v2)

1. **A–Z Discoverability (Rule #125):** ہر آپریشنل عمل A–Z کیٹلاگ، Daily Operations، Business Process اور Role-Based نیویگیشن سے دریافت ہوتا ہے۔
2. **Manifest-Driven (Rule #125):** رپورٹ صرف Manifest ہے؛ تمام حساب Query/Formula/Report Engines کرتے ہیں۔
3. **Single Backend (Rule #121):** صرف ایک Query Engine Firebase سے بات کرتا ہے — `organizations/{orgId}/stations/{stationId}/…`۔
4. **Zero Fabrication (Rules #1, #100, #120):** کوئی Dummy Data، Mock، Hardcoded عدد، یا Placeholder Skeleton نہیں۔
5. **Business-First Progressive Disclosure (Rule #126):** Developer Metadata صرف Developer Mode میں۔

---

# 3. Enterprise Philosophy — The Five Questions

ہر رپورٹ درج ذیل پانچ سوالات کا جواب دینے کے قابل ہونی چاہیے:

| # | سوال | جواب |
|---|---|---|
| 1️⃣ | یہ نمبر کہاں سے آیا؟ | `Collection → Document → Field → Formula → Result` |
| 2️⃣ | کس نے / کس سیاق میں؟ | `User • Role • Org • Station • Timestamp` |
| 3️⃣ | کس Formula سے؟ | `Formula ID • Version • Engine` |
| 4️⃣ | کیا Audit کیا جا سکتا ہے؟ | `YES — SHA-256 + provenance` |
| 5️⃣ | کیا Raw Firebase تک واپس جا سکتے ہیں؟ | `YES (ہمیشہ YES)` |

---

# 4. Golden Principles

- **Rule #001**: Google Firebase Firestore ہی System of Record ہے۔ UI کبھی ڈیٹا Calculate نہیں کرے گا۔
- **Rule #002**: تمام Calculations `Formula Registry` سے آئیں گی۔
- **Rule #003**: تمام Reports `Report Engine` سے Generate ہوں گی۔
- **Rule #004**: UI کبھی Business Logic نہیں رکھے گی۔
- **Rule #005**: ہر KPI Drill Down کر سکے گا (Related Report / Register تک)۔
- **Rule #006**: ہر Report Print Ready ہوگی۔
- **Rule #007**: ہر Number Explainable ہوگا (Explain Modal)۔
- **Rule #008**: Dummy Data **FORBIDDEN**
- **Rule #009**: Mock Data **FORBIDDEN**
- **Rule #010**: Hardcoded Numbers **FORBIDDEN**
- **Rule #015/#053**: Realtime Listeners — ڈیٹا تبدیل ہوتے ہی UI خودکار اپ ڈیٹ ہوگا (Phase 2)۔
- **Rule #090**: ہر اسکرین پر Live Health/DB Status (real probe, کبھی simulated)۔
- **Rule #101**: کوئی Hardcoded Business Value نہیں — `activeStationId`/`orgId` Auth سے آتے ہیں۔
- **Rule #125**: ہر Report Manifest سے پیدا ہوتی ہے۔
- **Rule #126**: Developer Metadata (Registry, JSON, Engine, Formula Version) صرف Developer Mode میں۔

---

# 5. Enterprise Architecture (Implemented)

```text
Google Firebase Firestore  (organizations/{orgId}/stations/{stationId}/…)
        │
        ▼
Enterprise Query Engine  (engines/QueryEngine.ts — ONLY Firebase layer)
        │
        ▼
KPI Engine │ Chart Engine │ Register Engine     (engines/*.ts)
        │
        ▼
Enterprise Report Engine  (ReportEngine.ts — Master Orchestrator)
        │
        ▼
Enterprise Report Registry + Manifest  (foundation/EnterpriseReportRegistry.ts)
        │
        ▼
Enterprise Reports Workspace (reports-v2 UI)
   ├── Universal Workspace Header (LIVE badge ← real DB probe)
   ├── Universal Toolbar │ Universal Filter Framework
   ├── Enterprise Report Explorer (A–Z │ Daily Ops │ Process)
   ├── Report Canvas (LiveReportRenderer / R001 EBIP)
   ├── AI Copilot Dock (live — analyzes current report's verified engine output)
   └── Audit Footer (derived counts, dev-mode gated)
```

### Data Flow (Rule #121 — UI is presentation only)

```text
Report Canvas (UI)
   → ReportEngine.execute(reportId, engineType, context)
      → KPIEngine / ChartEngine / RegisterEngine (parallel)
         → QueryEngine.query(domain, context)  ← ONLY Firebase access
   → returns { kpis, charts, register, dataQuality, executionTimeMs }
   → LiveReportRenderer renders verified results only
```

---

# 6. The A–Z Intelligence Domains (26)

| Domain | Intelligence Area | Emoji |
|---|---|---|
| **A** | Executive Dashboard | 👑 |
| **B** | Sales Reports | 📈 |
| **C** | Fuel Stock Reports | 🛢️ |
| **D** | Fuel Purchase Reports | 🚛 |
| **E** | Fuel Price Reports | 💲 |
| **F** | Tank & Dip Reports | 📏 |
| **G** | Pump & Nozzle Reports | ⛽ |
| **H** | Shift Reports | 🔄 |
| **I** | Cash Reports | 💵 |
| **J** | Bank Reports | 🏦 |
| **K** | Digital Payment Reports | 📱 |
| **L** | Ledger Reports | 📚 |
| **M** | Customer Reports | 👥 |
| **N** | Supplier Reports | 🤝 |
| **O** | Expense Reports | 💸 |
| **P** | Staff & HR Reports | 👨💼 |
| **Q** | Fleet & Vehicle Reports | 🚚 |
| **R** | Compliance Reports | 📑 |
| **S** | AI Intelligence Reports | 🤖 |
| **T** | Treasury Reports | 🏛️ |
| **U** | Inventory Reports | 📦 |
| **V** | Tax & Regulatory | ⚖️ |
| **W** | Multi-Branch Reports | 🏢 |
| **X** | Enterprise Asset | 🏢 |
| **Y** | Analytics & Forecast | 📊 |
| **Z** | System Administration | ⚙️ |

---

# 7. The Complete Report Catalog (47 Reports — A to Z)

> ہر رپورٹ کے لیے: **Engine Type** (کون سا Engine رپورٹ چلاتا ہے) • **Collections** (ماخذ ڈیٹا) • **Permissions** (کون دیکھ سکتا ہے) • **Certification**۔

### 👑 A — Executive Dashboard (3)

| ID | Report | Engine | Collections | Permissions | Status |
|---|---|---|---|---|---|
| A-001 | Executive Business Score | BusinessDashboard | sales, inventory, expenses, shifts, tankTelemetry | OWNER, AUDITOR | READY |
| A-002 | Revenue Summary | BusinessDashboard | sales, payments | OWNER | UNDER_DEVELOPMENT |
| A-003 | Operational Alerts | BusinessDashboard | system_logs, tankTelemetry | OWNER, MANAGER | DRAFT |

### 📈 B — Sales Reports (2)

| ID | Report | Engine | Collections | Permissions | Status |
|---|---|---|---|---|---|
| B-001 | Daily Sales Performance | SalesRegister | sales, salesItems, payments, customers, products | OWNER, MANAGER, ACCOUNTANT, OPERATOR | READY |
| B-002 | Product-wise Sales Analysis | SalesRegister | salesItems, products | OWNER, MANAGER, ACCOUNTANT | DRAFT |

### 🛢️ C — Fuel Stock Reports (1)

| ID | Report | Engine | Collections | Permissions | Status |
|---|---|---|---|---|---|
| C-001 | Enterprise Stock Position | StockDashboard | tanks, tankReadings, dipReadings | OWNER, MANAGER, OPERATOR | UNDER_DEVELOPMENT |

### 🚛 D — Fuel Purchase Reports (2)

| ID | Report | Engine | Collections | Permissions | Status |
|---|---|---|---|---|---|
| D-001 | Fuel Purchase Summary | PurchaseRegister | fuelPurchases, suppliers, inventoryMovements | OWNER, MANAGER, ACCOUNTANT | READY |
| D-002 | Delivery Chalan Register | PurchaseRegister | fuelPurchases, inventoryMovements | OWNER, MANAGER, OPERATOR | UNDER_DEVELOPMENT |

### 💲 E — Fuel Price Reports (2)

| ID | Report | Engine | Collections | Permissions | Status |
|---|---|---|---|---|---|
| E-001 | Price History & Revisions | PriceHistory | fuelPrices, rateHistory, products | OWNER, MANAGER | READY |
| E-002 | OGRA Price Compliance | PriceHistory | fuelPrices, products | OWNER, ACCOUNTANT | DRAFT |

### 📏 F — Tank & Dip Reports (2)

| ID | Report | Engine | Collections | Permissions | Status |
|---|---|---|---|---|---|
| F-001 | Tank Dip Register | TankDipReport | tankReadings, dipReadings, tanks | OWNER, MANAGER, OPERATOR, TECHNICIAN | READY |
| F-002 | Tank Calibration & Capacity | TankDipReport | tanks, dipReadings | OWNER, TECHNICIAN | DRAFT |

### ⛽ G — Pump & Nozzle Reports (2)

| ID | Report | Engine | Collections | Permissions | Status |
|---|---|---|---|---|---|
| G-001 | Pump Sales Performance | PumpNozzleReport | pumpReadings, nozzleReadings, salesItems | OWNER, MANAGER, OPERATOR | READY |
| G-002 | Nozzle Meter Readings | PumpNozzleReport | pumpReadings, nozzleReadings, shiftReadings | OWNER, MANAGER, OPERATOR, TECHNICIAN | UNDER_DEVELOPMENT |

### 🔄 H — Shift Reports (1)

| ID | Report | Engine | Collections | Permissions | Status |
|---|---|---|---|---|---|
| H-001 | Daily Shift Closing Report | ShiftSummary | shifts, shiftReadings, cashLedger, sales | OWNER, MANAGER, OPERATOR, ACCOUNTANT | READY |

### 💵 I — Cash Reports (2)

| ID | Report | Engine | Collections | Permissions | Status |
|---|---|---|---|---|---|
| I-001 | Cash Collection Register | CashSummary | cashLedger, shifts, staff | OWNER, MANAGER, ACCOUNTANT | READY |
| I-002 | Cash Variance Analysis | CashSummary | cashLedger, shifts, staff | OWNER, MANAGER, AUDITOR | UNDER_DEVELOPMENT |

### 🏦 J — Bank Reports (2)

| ID | Report | Engine | Collections | Permissions | Status |
|---|---|---|---|---|---|
| J-001 | Bank Reconciliation | BankPosition | bankAccounts, bankTransactions, cashLedger | OWNER, ACCOUNTANT | READY |
| J-002 | Bank Deposits Register | BankPosition | bankTransactions, bankAccounts | OWNER, MANAGER, ACCOUNTANT | READY |

### 📱 K — Digital Payment Reports (2)

| ID | Report | Engine | Collections | Permissions | Status |
|---|---|---|---|---|---|
| K-001 | Digital Wallet Transactions | DigitalPayments | wallets, walletTransactions, digitalAccounts | OWNER, ACCOUNTANT | READY |
| K-002 | Payment Gateway Settlement | DigitalPayments | walletTransactions, payments | OWNER, ACCOUNTANT | DRAFT |

### 📚 L — Ledger Reports (2)

| ID | Report | Engine | Collections | Permissions | Status |
|---|---|---|---|---|---|
| L-001 | General Ledger | LedgerView | generalLedger, journalEntries | OWNER, ACCOUNTANT, AUDITOR | READY |
| L-002 | Journal Entries Register | LedgerView | journalEntries, generalLedger | OWNER, ACCOUNTANT, AUDITOR | CERTIFIED |

### 👥 M — Customer Reports (2)

| ID | Report | Engine | Collections | Permissions | Status |
|---|---|---|---|---|---|
| M-001 | Customer Ledger | CustomerLedger | customers, sales, ledger | OWNER, MANAGER, ACCOUNTANT | READY |
| M-002 | Customer Credit Aging | CustomerLedger | customers, ledger | OWNER, MANAGER | UNDER_DEVELOPMENT |

### 🤝 N — Supplier Reports (2)

| ID | Report | Engine | Collections | Permissions | Status |
|---|---|---|---|---|---|
| N-001 | Supplier Ledger | SupplierLedger | suppliers, fuelPurchases, ledger | OWNER, MANAGER, ACCOUNTANT | READY |
| N-002 | Supplier Payments Register | SupplierLedger | suppliers, bankTransactions, cashLedger | OWNER, ACCOUNTANT | READY |

### 💸 O — Expense Reports (2)

| ID | Report | Engine | Collections | Permissions | Status |
|---|---|---|---|---|---|
| O-001 | Expense Register | ExpenseRegister | expenses, staff | OWNER, MANAGER, ACCOUNTANT | READY |
| O-002 | Expense Category Analysis | ExpenseRegister | expenses | OWNER, ACCOUNTANT | UNDER_DEVELOPMENT |

### 👨💼 P — Staff & HR Reports (1)

| ID | Report | Engine | Collections | Permissions | Status |
|---|---|---|---|---|---|
| P-005 | Enterprise Staff Attendance | StaffRegister | attendance, employees | OWNER, MANAGER | DRAFT |

### 🚚 Q — Fleet & Vehicle Reports (2)

| ID | Report | Engine | Collections | Permissions | Status |
|---|---|---|---|---|---|
| Q-001 | Fleet Fuel Consumption | FleetReport | fleetAccounts, sales, customers | OWNER, MANAGER | DRAFT |
| Q-002 | Corporate Card Transactions | FleetReport | customers, sales | OWNER, MANAGER | DRAFT |

### 📑 R — Compliance Reports (2)

| ID | Report | Engine | Collections | Permissions | Status |
|---|---|---|---|---|---|
| R-101 | Enterprise Compliance Checklist | ComplianceReport | auditLogs, system_logs, assets | OWNER, MANAGER | DRAFT |
| R-102 | License & Certification Expiry | ComplianceReport | assets, system_logs | OWNER | DRAFT |

### 🤖 S — AI Intelligence Reports (2)

| ID | Report | Engine | Collections | Permissions | Status |
|---|---|---|---|---|---|
| S-001 | AI Business Diagnostics | AIIntelligence | sales, tankTelemetry, shifts | OWNER, MANAGER | UNDER_DEVELOPMENT |
| S-002 | AI Recommendation Confidence | AIIntelligence | sales, expenses | OWNER, AUDITOR | DRAFT |

### 🏛️ T — Treasury Reports (1)

| ID | Report | Engine | Collections | Permissions | Status |
|---|---|---|---|---|---|
| T-003 | Treasury Cash Position | TreasuryDashboard | cashLedger, bankAccounts, wallets | OWNER, ACCOUNTANT | UNDER_DEVELOPMENT |

### 📦 U — Inventory Reports (2)

| ID | Report | Engine | Collections | Permissions | Status |
|---|---|---|---|---|---|
| U-001 | Inventory Valuation | StockDashboard | inventory, inventoryMovements, products | OWNER, ACCOUNTANT, AUDITOR | UNDER_DEVELOPMENT |
| U-002 | Stock Aging Analysis | StockDashboard | inventory, inventoryMovements | OWNER, MANAGER | DRAFT |

### ⚖️ V — Tax & Regulatory (2)

| ID | Report | Engine | Collections | Permissions | Status |
|---|---|---|---|---|---|
| V-001 | Sales Tax (FBR) Summary | TaxReport | sales, ledger, journalEntries | OWNER, ACCOUNTANT | UNDER_DEVELOPMENT |
| V-002 | Withholding Tax Register | TaxReport | ledger, journalEntries, suppliers | OWNER, ACCOUNTANT | DRAFT |

### 🏢 W — Multi-Branch Reports (2)

| ID | Report | Engine | Collections | Permissions | Status |
|---|---|---|---|---|---|
| W-001 | Multi-Branch Consolidated Sales | BranchComparison | sales, shifts | OWNER | UNDER_DEVELOPMENT |
| W-002 | Branch Performance Comparison | BranchComparison | sales, shifts | OWNER | DRAFT |

### 🏢 X — Enterprise Asset (1)

| ID | Report | Engine | Collections | Permissions | Status |
|---|---|---|---|---|---|
| X-001 | Asset Maintenance History | AssetRegister | assets, maintenanceLogs | OWNER, TECHNICIAN, MANAGER | DRAFT |

### 📊 Y — Analytics & Forecast (2)

| ID | Report | Engine | Collections | Permissions | Status |
|---|---|---|---|---|---|
| Y-001 | Sales Forecast | AnalyticsDashboard | sales, salesItems | OWNER, MANAGER | UNDER_DEVELOPMENT |
| Y-002 | Trend & Seasonality Analysis | AnalyticsDashboard | sales, shifts | OWNER, MANAGER | DRAFT |

### ⚙️ Z — System Administration (1)

| ID | Report | Engine | Collections | Permissions | Status |
|---|---|---|---|---|---|
| Z-001 | RBAC Security Audit | AuditLog | auditLogs, users | OWNER, AUDITOR | CERTIFIED |

---

# 8. Universal Report Standard (Every Report Renders)

```text
Enterprise Header (Station • Role • LIVE/DB Status • Version)
        │
     Filters (Date • Branch • Shift • Product • Tank • Pump • Operator)
        │
Executive KPI Smart Cards (Live, from KPI Engine)
        │
   Trend / Comparison Charts (chartAdapter → Recharts)
        │
      Detailed Register Table (search, export CSV, print)
        │
   Provenance Line (Report ID • Engine • Records • Query Time • Data Quality)
```

## 8.1 States (نہ کبھی Placeholder، نہ کبھی Skeleton)

| State | Condition | UI |
|---|---|---|
| **Loading** | Engine executing | "Executing live query…" (resolves — never infinite) |
| **Empty** | `dataQuality === 'EMPTY'` | "No verified operational records found." + Refresh |
| **Error** | Engine/query failure | Professional error with recovery |
| **No Station** | `!orgId \|\| !stationId` | "Select an active station…" (کبھی fabricate نہیں) |
| **Verified** | Data present | KPIs + Charts + Register render |

## 8.2 KPI Smart Card (EnterpriseKPICard)

Primary Value (formatted live) • Unit • Trend ▲▼ • Status (SUCCESS/WARNING/DANGER) • LIVE badge • ƒx formula badge • **Explain** (lineage modal) • **Drilldown** (→ related report via `setActiveReportId`).

---

# 9. Engine Architecture (Rule #110 — تمام حساب Engines میں)

| Engine | Responsibility |
|---|---|
| **QueryEngine** | Only layer that touches Firebase (Firestore). Tenant-isolated: `organizations/{orgId}/stations/{stationId}/{collection}`. Client-side date filtering. |
| **KPIEngine** | Resolves per-engine-type KPI definitions; batch queries domains; computes values + status rules. |
| **ChartEngine** | Decides chart type (bar/line/area/pie); transforms raw docs → chart data. |
| **RegisterEngine** | Builds register columns, rows, summary totals per engine type. |
| **ReportEngine** | Master orchestrator — executes KPI/Chart/Register in parallel, computes dataQuality (VERIFIED/PARTIAL/EMPTY/ERROR) + execution time. |

### Engine Types (25) — every A–Z report maps to one

`BusinessDashboard` • `SalesRegister` • `StockDashboard` • `ShiftSummary` • `CashSummary` • `ExpenseRegister` • `CustomerLedger` • `SupplierLedger` • `BankPosition` • `DigitalPayments` • `PurchaseRegister` • `PriceHistory` • `TankDipReport` • `PumpNozzleReport` • `LedgerView` • `StaffRegister` • `TreasuryDashboard` • `TaxReport` • `AuditLog` • `AssetRegister` • `AnalyticsDashboard` • `FleetReport` • `ComplianceReport` • `BranchComparison` • `AIIntelligence`

---

# 10. RBAC & Permissions Matrix

| Role | Visible Domains (sample) | Notes |
|---|---|---|
| **OWNER** | All 26 domains / all 47 reports | Unrestricted |
| **MANAGER** | Executive, Sales, Stock, Shift, Cash, Customer, Supplier, Expense, Fleet, Compliance, AI, Forecast | No Security Audit (Z) or License (R-102) |
| **ACCOUNTANT** | Financial, Ledger, Bank, Digital, Supplier, Expense, Tax, Treasury, Inventory Valuation | No Tank Calibration (F-002) |
| **OPERATOR** | Daily Sales, Stock, Shift, Dip, Nozzle, Chalan | Operational read-only |
| **TECHNICIAN** | Tank Calibration, Nozzle Meters, Asset Maintenance | Technical scope |
| **AUDITOR** | Executive, Cash Variance, Ledger, Audit, Security | Read-only audit scope |

> Enforcement: Explorer filters `report.permission.includes(activeRole)`; `activeRole` is derived from the authenticated session (`mapAuthRoleToEnterprise`), overridable only in Developer Mode.

---

# 11. Navigation Modes (Rule #125)

| Mode | Groups | Example |
|---|---|---|
| **A–Z Catalog** | 26 domains → modules → reports | A → Executive Dashboard → A-001 |
| **Daily Operations** | `dailyCategory` groups | ⛽ Fuel Sales • 💰 Cash • 🏦 Banks • 🛢 Fuel Stock • 📋 Expenses • 👥 Customers… |
| **Business Process** | `businessProcess` workflows (pipeline view) | Shift Closing Workflow → Purchase → Dip Verification → Banking & Settlement… |

---

# 12. Data Integrity & Security Rules (Non-Negotiable)

1. **Real DB only (Rule #1):** ہر عدد Firebase سے۔ R001 EBIP Engine + LiveReportRenderer دونوں اسی Firestore path پر۔
2. **Deterministic SHA-256 provenance (Rule #51/#57/#83/#125):** `AuditMetadataManager.generateHash(metricId + org + station + role + formulaId/version + records + dateRange)` — اسی ان پٹ کا ہمیشہ وہی hash۔
3. **Real LIVE badge (Rule #15/#90):** `getDocsFromServer` probe — cache کبھی LIVE نہیں بنا سکتا؛ window focus پر دوبارہ probe۔
4. **Tenant isolation:** QueryEngine `!orgId || !stationId` پر empty return کرتا ہے — کبھی cross-tenant ڈیٹا نہیں۔
5. **No fabricated claims:** Integrity Score 100% یا "SYSTEM SECURE (SHA-256)" جیسے جھوٹے دعوے ہٹا دیے گئے؛ سب کچھ derived ہے۔
6. **EIDE (Rule #121):** UI کبھی Firebase کو directly نہیں چھوتا؛ سب کچھ QueryEngine کے ذریعے۔

---

# 13. Performance Standards

- Zero hardcoded data • Zero duplicate queries
- Parallel KPI/Chart/Register execution (Promise.all)
- Lazy-loaded workspace (React.lazy)
- Batch domain queries (`queryMultiple`)
- Client-side date filtering (schema-tolerant, no composite indexes)
- Target: < 2s report load • < 500ms cached KPI refresh

---

# 14. Definition of Done — Acceptance Criteria

A report is **COMPLETE** only when:

- [ ] Manifest registered in `EnterpriseReportRegistry` (A–Z ID, engine, collections, permissions, certification)
- [ ] Engine mapping in `REPORT_ENGINE_TYPES` + KPI/Register definitions exist
- [ ] Renders live data via `LiveReportRenderer` (never a skeleton)
- [ ] Empty / Error / No-Station states handled professionally
- [ ] RBAC enforced (role-filtered in Explorer + session-derived role)
- [ ] Provenance line + Explain + Drilldown functional
- [ ] Urdu/English naming both present
- [ ] Typecheck passes (`npx tsc --noEmit`)

## 14.1 Automated Test Coverage (v1.0 — 69 tests, all green)

| Suite | File | Covers |
|---|---|---|
| EBIP Formulas | `src/tests/reportsFormulaRegistry.test.ts` | All 23 deterministic formulas — revenue, net profit, stock field tolerance, cash movement, health score cap, divide-by-zero guards, determinism (21 tests) |
| Engine Metric Map | `src/tests/reportsEngineMetricMap.test.ts` | All 25 engine types map to non-empty sets; every metric resolves in the Semantic Layer; dateAware semantics; unit formatting (9 tests) |
| Historical Archive | `src/tests/reportsHistoricalArchive.test.ts` | LRU 400-window cap, TTL expiry, tenant-isolated keys, frozen-doc immutability, snapshot persist/cap/clear (9 tests) |
| Delta Logic | `src/tests/reportsDeltaLogic.test.ts` | pctDelta (null on zero baseline), statusFor UP/DOWN/FLAT/NA with higherIsBetter semantics (11 tests) |
| Legacy suites | `tests/*.test.ts` + `src/tests/inventoryRevaluationEngine.test.ts` | Pre-existing shift/financial/e2e/ATC/revaluation coverage (19 tests) |

---

# 15. Roadmap

| Phase | Scope | Status |
|---|---|---|
| **Phase 1** | A–Z catalog (47 reports/26 domains), real context wiring, SHA-256 provenance, real LIVE badge, live rendering, dev-mode gating | ✅ **Complete (v1.0)** |
| **Phase 2** | Realtime `onSnapshot` subscriptions (QueryEngine.subscribeCollection → debounced re-execute), date-range filter wiring (Today/7d/30d/90d/custom → WorkspaceState), generic daily-activity fallback charts for all 25 engine types | ✅ **Complete (v1.0)** |
| **Phase 3** | Export suite (PDF/Excel/CSV/WhatsApp/Print) + live AI Copilot Dock + per-report EBIP deep analytics + 10-year archival engine (Time Machine) | ✅ **Complete (v1.0)** |

> **Phase 2 delivered (v1.0):** Realtime listeners (Rule #15/#53) — every report subscribes to its source collections and re-executes automatically on change (800ms debounce, silent refresh, leak-free unsubscription). Date filters are real: presets + custom range drive every report's query window. Every engine type renders a genuine records-per-day chart derived from its own live data (Firestore Timestamp-safe).

> **Phase 3 delivered (v1.0):** Enterprise Export Suite (Rules #24/#25) — the decorative button bar is gone. `EnterpriseExport` now ships the verified live register in five formats: **PDF** (project `pdfGenerator` → `generatePdfBlob`), **Excel** (`excelExporter.exportToExcel`, real columns/rows), **CSV** (BOM-escaped UTF-8), **WhatsApp** (`generateWhatsAppLink` — top-20 summary share), and **Print**. Export filenames carry the report ID + date. The dead Export/Print toolbar buttons in the ReportCanvas header were removed — one export entry point, inside the report body.

> **Phase 3 delivered (v1.0):** AI Copilot Dock (Rules #11/#121/#123–#125) — the disabled-input placeholder is now a live copilot. It builds a capped context snapshot exclusively from the current report's **verified ReportEngine result** (KPIs, register sample rows ≤ 8, columns, data quality, tenant context, resolved date window) and routes every question through the shared `aiAssistantService` (Groq → Gemini → local deterministic engine fallback). No fabricated numbers: if the snapshot is still building, provenance honestly reports `PENDING`. Each answer carries a provenance line (report • provider • model • latency • data quality), action buttons navigate via react-router, and the conversation resets per report.

> **Phase 3 delivered (v1.0):** Per-report EBIP Deep Analytics (Rules #1/#100/#110/#123) — every non-A-001 report now renders an `EBIPDeepAnalyticsPanel` below its live register. It executes the report's curated EBIP metric set (engine-type → metric map, 25 engine types covered) against the real tenant context + workspace date window **and** the previous equal-length window, then renders: a current-vs-previous comparison table with Δ% and status chips; **deterministic rule-based findings** (revenue trend, net-profit margin, expense ratio, per-metric deltas — never AI-estimated); per-metric Explain modals (SHA-256 provenance, formula version, source records); and a provenance footer (min data quality, total query time, metric hashes). Point-in-time metrics (stock, balances) honestly show N/A for the previous window. Formula Registry grew to 23 deterministic formulas and the Semantic Layer to 25 metrics; the EBIP query engine's date filtering is now schema-tolerant (`timestamp\|date\|createdAt`) with zero regression to R001.

> **Phase 3 delivered (v1.0):** 10-Year Deep Archival Engine (Rules #55/#92/#94/#106) — `HistoricalArchive` is a bounded LRU window cache (write-through on every verified fetch; archive-mode read-through) plus an immutable localStorage snapshot store. `ReportEngine.execute(…, { useArchive: true })` resolves repeat historical windows from cache in well under 5s; every live fetch is written through (zero-data-loss style, Rule #94); snapshots capture verified report state with tenant tags — replay is **blocked on a different org/station** (Rules #106/#125). The toolbar's new **🕰 History** button opens the Time Machine modal: custom-window replay (real cache hit/miss reporting from archive counters), Apply-to-workspace (sets the date window), and snapshot capture/list/replay. Note (honest scope): the collection-window cache is in-memory (per session); only captured snapshots persist across reloads.

---

# 16. Appendix — Implementation Map (v1.0)

| File | Responsibility |
|---|---|
| `src/lib/reports-v2/foundation/EnterpriseReportRegistry.ts` | 26 domains + 47 manifests + `REPORT_ENGINE_TYPES` |
| `src/lib/reports-v2/engines/QueryEngine.ts` | Sole Firebase layer (Firestore, tenant-isolated) |
| `src/lib/reports-v2/engines/KPIEngine.ts` | 25 engine-type KPI definitions |
| `src/lib/reports-v2/engines/RegisterEngine.ts` | 25 engine-type register definitions |
| `src/lib/reports-v2/engines/ChartEngine.ts` | Chart transforms + Timestamp-safe daily fallback |
| `src/lib/reports-v2/engines/QueryEngine.ts` | Sole Firebase layer: one-shot + `subscribeCollection()` realtime |
| `src/lib/reports-v2/engines/ReportEngine.ts` | Master orchestrator + dataQuality |
| `src/lib/reports-v2/ebip/engine/queryEngine.ts` | EBIP metric execution + SHA-256 provenance |
| `src/components/features/reports-v2/EnterpriseReportsWorkspace.tsx` | Workspace shell (real context props) |
| `src/components/features/reports-v2/framework/WorkspaceStateManager.tsx` | Lifecycle, real DB probe, role mapping |
| `src/components/features/reports-v2/framework/LiveReportRenderer.tsx` | Live KPI/chart/register renderer |
| `src/components/features/reports-v2/framework/ReportCanvas.tsx` | Report canvas (R001 EBIP + generic renderer) |
| `src/components/features/reports-v2/framework/AICopilotDock.tsx` | Live copilot — verified snapshot → `aiAssistantService` chat, provenance per answer |
| `src/components/features/reports-v2/ebip/EBIPDeepAnalyticsPanel.tsx` | Generic per-report deep analytics — period comparison + derived findings + Explain |
| `src/lib/reports-v2/ebip/reports/engineMetricMap.ts` | Engine type → curated EBIP metric set (25 types) |
| `src/lib/reports-v2/ebip/formulas/formulaRegistry.ts` | 23 deterministic formulas (Rule #110) |
| `src/lib/reports-v2/ebip/metrics/semanticLayer.ts` | 25 registered metrics |
| `src/lib/reports-v2/archival/HistoricalArchive.ts` | LRU window cache + immutable tenant-tagged snapshots (Rules #92/#94/#106) |
| `src/components/features/reports-v2/framework/HistoricalReplayModal.tsx` | Time Machine — replay / capture / tenant guard |
| `src/lib/reports-v2/engines/QueryEngine.ts` | Sole Firebase layer — `useArchive` read/write-through (Rules #92/#94) |
| `src/components/features/reports-v2/components/export/EnterpriseExport.tsx` | Real export suite — PDF (`generatePdfBlob`) • Excel (`exportToExcel`) • CSV (BOM) • WhatsApp (`generateWhatsAppLink`) • Print |
| `src/components/features/reports-v2/framework/EnterpriseReportExplorer.tsx` | A–Z / Daily / Process navigation, RBAC filter |
| `src/router/index.tsx` | `/reports` route wires auth context into workspace |

---

*This document is the authoritative PRD for the FuelPro Reports Module A-to-Z release. Every report tells a story — and every story is true.*
