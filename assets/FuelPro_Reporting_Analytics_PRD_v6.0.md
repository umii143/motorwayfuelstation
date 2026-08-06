# FuelPro Enterprise — Reporting & Analytics Module
## Master Product Requirements Document (PRD) v6.0 — "Execution-Grade Final"
**Status:** DEV-READY — Strict Compliance Required. No section may be skipped, reordered, or reinterpreted without Product Owner sign-off.
**Supersedes:** All prior standalone reporting specs (12-Domain Firestore doc, 10-Workspace Menu doc, A-to-Z Alphabet PRD). This document is the single source of truth — it absorbs the good parts of each and closes every gap found across all prior reviews.
**Author role:** Enterprise ERP Architect (SAP S/4HANA IS-Oil, Oracle NetSuite O&G, Dynamics 365 SCM Petroleum background)

---

## 0. How to Read This Document (Dev Instructions)

1. Section 1–3 = Why/What (business context, non-negotiable principles).
2. Section 4 = System architecture (the Engine Layer) — **build this before touching any workspace.**
3. Section 5 = The 10 Workspaces × 54 Sub-Tabs, each wired to a Report ID, Engine, Formula/Rule Registry entry, and data source. **This is the contract. Every sub-tab must resolve to a row in the Report Registry table (Section 6) before it is coded.**
4. Section 6 = Report Registry — the master table. If a sub-tab has no row here, it is not ready for development — stop and flag it, do not invent logic.
5. Section 7 = Gaps closed in this version (read this to understand what changed and why).
6. Section 8 = Elite-tier features (differentiators vs Petrosoft/Gilbarco/SAP).
7. Section 9 = Non-functional requirements (performance, caching, security, offline).
8. Section 10 = Build order / execution phases.
9. Section 11 = Acceptance checklist — **every box must be checked before a workspace is marked "done."**

---

## 1. Business Context & Non-Negotiable Principles

These principles were established across multiple design iterations and **override any conflicting instruction in any other document, past or future, unless explicitly revised by the Product Owner in writing.**

| # | Principle | Rationale |
|---|---|---|
| P1 | **Manual reading entry (Previous → Current) is the PERMANENT primary system-of-record.** ATG/IoT telemetry is an optional enrichment layer only. | 90%+ of Pakistani stations have no ATG hardware. System must work with zero sensors. |
| P2 | **Current Reading must always be ≥ Previous Reading**, with two distinct exception flows: (a) *Reading Discontinuity* (unexplained gap, needs Manager override) and (b) *Meter Changed* (intentional reset, needs Manager override + new baseline). | Prevents fraud and data corruption; each exception type has a different audit implication. |
| P3 | **Every number on every report must trace to a Formula Registry entry.** No hardcoded business logic anywhere in report code. | Enables audits, avoids logic duplication, allows OGRA rate changes to propagate everywhere automatically. |
| P4 | **Double-entry accounting is mandatory and always balanced** (∑Debits = ∑Credits) at the database transaction level, not just at report-render time. | Statutory compliance, dispute defensibility, bank/FBR audit readiness. |
| P5 | **Postgres + Row Level Security is the system of record.** Firestore/NoSQL may be used only as a *read-optimized cache/mirror*, never as the primary ledger store. | Relational integrity for accounting, joins, RLS-based multi-tenancy — NoSQL cannot safely guarantee this. |
| P6 | **Zero dummy data in production.** Staging and production are physically separate projects/databases. | Prevents an owner ever seeing fake numbers by accident — trust-breaking in a cash business. |
| P7 | **Literacy-first UX.** Every report screen must pass the "Three-Second Rule" — a matric-pass-level attendant/cashier must understand the headline number within 3 seconds, no jargon. | Real end users are shift attendants and station owners, not analysts. |
| P8 | **No new architecture documents after this PRD.** Any future spec must be a "Wiring Addendum" (maps new sub-tabs to existing engines) — never a competing architecture. | Prevents the spec-churn cycle that produced 3 conflicting prior documents. |

---

## 2. Objectives

- Ship a reporting/analytics system covering **10 Workspaces, 54 Sub-Tabs** (as per approved sidebar UI, badge counts 8-8-6-8-5-4-4-4-3-4) that is fully wired to a **single reusable Engine Layer** — no per-report custom backend code.
- Close all previously identified gaps (Section 7) before any new feature work begins.
- Deliver 2 "elite tier" differentiators (Section 8) that no local competitor (Petrosoft, local Excel-based systems) currently offers.
- Guarantee every report is dispute-defensible: any number can be drilled down to its source voucher/reading/JV in ≤3 clicks (Level 1 → Level 2 → Level 3, per prior drilldown standard).

---

## 3. Scope

**In scope:** All 10 Workspaces and 54 sub-tabs listed in Section 5, the Engine Layer (Section 4), Formula/Rule Registries, Report Registry, offline-first sync for report data, RBAC per workspace.

**Out of scope (explicitly deferred, do not build):** Multi-vertical plugin architecture (LPG/Car Wash/EV/ATM) beyond stub hooks; Workflow/Approval Engine beyond a single-level Manager override; full Power BI/Fabric external streaming (API contract only, no live connector build in this phase).

---

## 4. System Architecture — The Engine Layer

This is the layer every sub-tab in Section 5 must call into. **No sub-tab may query the database directly.**

```
                         ┌─────────────────────────────┐
                         │        Postgres (RLS)        │
                         │   System of Record — all      │
                         │   ledgers, readings, JVs      │
                         └───────────────┬───────────────┘
                                         │
                         ┌───────────────▼───────────────┐
                         │         Event Bus (Pub/Sub)     │
                         │  every write emits an event     │
                         └──┬────────────┬────────────┬────┘
                            │            │            │
                 ┌──────────▼──┐  ┌──────▼──────┐ ┌───▼─────────┐
                 │ Query Engine │  │ Aggregation │ │ Formula     │
                 │ (raw fetch)  │  │ Engine      │ │ Engine      │
                 └──────┬───────┘  │ (rollups,   │ │ (True       │
                        │          │ pre-agg     │ │ Profit,     │
                        │          │ snapshots)  │ │ OGRA margin,│
                        │          └──────┬──────┘ │ tax calc)   │
                        │                 │         └─────┬──────┘
                        │          ┌──────▼──────┐         │
                        └─────────►│ Register     │◄────────┘
                                   │ Engine       │
                                   │ (report      │
                                   │ orchestrator)│
                                   └──────┬───────┘
                              ┌───────────┼────────────┐
                       ┌──────▼─────┐┌────▼─────┐┌──────▼──────┐
                       │ Rule Engine││Permission ││ Generic     │
                       │ (aging,    ││ Engine    ││ Renderer    │
                       │ exceptions,││ (RBAC per ││ (KPI Card / │
                       │ overrides) ││ workspace)││ Chart/Table)│
                       └────────────┘└───────────┘└──────┬──────┘
                                                          │
                                                   ┌───────▼───────┐
                                                   │ Drilldown       │
                                                   │ Engine (L1→L2→L3)│
                                                   └─────────────────┘
```

### 4.1 Engine Responsibilities

| Engine | Responsibility | Must NOT do |
|---|---|---|
| Query Engine | Raw parameterized fetch from Postgres | Never contains business logic |
| Aggregation Engine | Pre-computed rollups/snapshots (hourly, daily, MTD) for performance | Never computes financial formulas |
| Formula Engine | Executes registered formulas (True Profit, OGRA margin, tax layers) from the Formula Registry | Never hardcoded per-report — always registry-driven |
| Rule Engine | Aging buckets, exception flows (Reading Discontinuity vs Meter Changed), override validation | Never bypassable without audit log entry |
| Register Engine | Orchestrates: calls Query/Aggregation/Formula/Rule Engines per the Report Registry definition, assembles the response payload | The only entry point sub-tabs are allowed to call |
| Permission Engine | Workspace + sub-tab + row-level RBAC check | Never trusts client-side role claims |
| Generic Renderer | Maps payload → KPI Card / Chart / Table component, using `rendererProfile` metadata | Never has report-specific rendering code |
| Drilldown Engine | Handles Level 1 → Level 2 → Level 3 navigation using the Report Dependency Graph | Never allows drilling past the permitted RBAC depth |
| Event Bus | Decouples writes from downstream recalculation (e.g., a new reading triggers Aggregation Engine refresh) | Never a direct synchronous function call between modules |

### 4.2 Formula Registry (sample entries — full table lives in DB, not hardcoded)

| formula_id | Name | Definition | Used By |
|---|---|---|---|
| `TRUE_PROFIT_V1` | True Profit per Litre | Pump Price − (Landed Cost + Freight + Levy) | P1 report, Domain 11 Pricing |
| `OGRA_MARGIN_V1` | Dealer Margin | Fixed by OGRA circular (currently Rs. 8.64/L reference) | Pricing Board, Inventory Revaluation |
| `DSO_V1` | Days Sales Outstanding | (AR Balance / Credit Sales) × Period Days | Customers workspace |
| `DPO_V1` | Days Payable Outstanding | (AP Balance / Credit Purchases) × Period Days | Suppliers workspace |
| `CASH_ACCURACY_V1` | Cashier Accuracy % | 1 − (|Shortage+Excess| / Expected Cash) | Staff workspace |
| `EVAP_LOSS_V1` | Evaporation Loss % | (Dip Δ − Meter Δ) / Meter Δ, capped alert at 0.15% | Inventory workspace |

### 4.3 Rule Registry (sample entries)

| rule_id | Name | Logic | Requires Override? |
|---|---|---|---|
| `READING_DISCONTINUITY` | Unexplained reading gap | Current < Previous with no Meter Changed flag | Yes — Manager/Owner, logged to `nozzle_reading_audit_log` |
| `METER_CHANGED` | Intentional meter reset | New baseline entry, previous meter archived | Yes — Manager/Owner, new baseline audit entry |
| `AR_AGING_BUCKET` | Aging classification | Current / 1-15 / 16-30 / 31-60 / 60+ days | No |
| `CREDIT_HOLD` | Auto credit block | Utilization ≥ 90% of limit | Yes — Owner override to release |
| `AP_UPCOMING_7D` | Payment due alert | Due date within 7 calendar days | No |

---

## 5. Workspaces & Sub-Tabs — Full Wiring Specification

**Format per sub-tab:** `Sub-Tab Name` → `Report ID` → `Primary Engine Path` → `Key Formulas/Rules` → `Drilldown Path` → `Data Tables`

### 5.1 ⛽ Fuel Operations *(8 tabs)*

| # | Sub-Tab | Report ID | Engine Path | Formulas/Rules | Drilldown (L1→L2→L3) |
|---|---|---|---|---|---|
| 1 | Overview (Operations Cockpit) | `FO-01` | Aggregation→Register→Renderer | Live nozzle status calc | Station → Island → Nozzle |
| 2 | Shift Operations | `FO-02` | Register→Rule→Renderer | Shift open/close validation | Station → Shift → Attendant |
| 3 | Sales Register | `FO-03` | Query→Register→Renderer | — | Station → Nozzle → Ticket |
| 4 | Nozzle Analytics | `FO-04` | Formula(`meter_delta`)→Register | Mechanical delta calc | Station → Nozzle → Reading pair |
| 5 | Dispenser Telemetry | `FO-05` | Aggregation→Register | Calibration tolerance ±0.05% | Station → Dispenser → Calibration log |
| 6 | Tank Dip Reconciliation | `FO-06` | Formula(`EVAP_LOSS_V1`)→Rule→Register | Dip vs meter variance | Station → Tank → Dip entry |
| 7 | Bowser Decanting Logs | `FO-07` | Register→Rule→Renderer | Gain/loss thermal calc | Station → GRN → Chamber dip |
| 8 | Operational Audit Trail | `FO-08` | Query(`audit_logs`)→Renderer | Immutable, append-only | Station → Event → Actor |

### 5.2 📦 Inventory *(8 tabs)*

| # | Sub-Tab | Report ID | Engine Path | Formulas/Rules | Drilldown |
|---|---|---|---|---|---|
| 1 | Overview & Valuation | `INV-01` | Aggregation→Formula(`weighted_avg_cost`)→Renderer | WAC blending | Station → Product → Batch |
| 2 | Fuel Inventory & Tank Register | `INV-02` | Query→Renderer | — | Station → Tank |
| 3 | **Manual Tank Dip Register (Primary)** | `INV-03` | Register→Rule→Renderer | Primary source of truth per P1 | Station → Tank → Dip entry |
| 4 | ATG Sensor Telemetry (Optional) | `INV-04` | Query(external API)→Renderer, flagged `optional=true` | Only active if hardware present | Station → Tank → Sensor feed |
| 5 | Lubricants & Engine Oils | `INV-05` | Query→Register→Renderer | Reorder point calc | Category → SKU → Batch |
| 6 | Stock Movements (GRN) | `INV-06` | Register→Renderer | — | Station → GRN → Line item |
| 7 | Stock Reconciliation & Loss Logs | `INV-07` | Formula(`EVAP_LOSS_V1`)→Renderer | 0.15% alert threshold | Station → Tank → Loss entry |
| 8 | ABC Velocity & Reorder Forecast | `INV-08` | Aggregation→Formula(`pareto_classify`)→Renderer | 80/20 classification | Category → SKU |

### 5.3 🛒 Purchases *(6 tabs)*

| # | Sub-Tab | Report ID | Engine Path | Formulas/Rules | Drilldown |
|---|---|---|---|---|---|
| 1 | Procurement Overview | `PUR-01` | Aggregation→Renderer | — | Month → OMC → PO |
| 2 | Purchase Orders (PO) | `PUR-02` | Register→Renderer | Rate-lock validation | PO list → PO detail |
| 3 | Goods Received Notes (GRN) | `PUR-03` | Register→Rule→Renderer | Chamber dip verification | GRN list → Chamber detail |
| 4 | OMC Rate Comparison | `PUR-04` | Query→Formula(`margin_delta`)→Renderer | Rate variance calc | OMC → Product → Circular |
| 5 | Bowser Freight & Transit | `PUR-05` | Query→Renderer | Lead time calc | Depot → Bowser → Trip |
| 6 | Vendor Scorecards & Payables | `PUR-06` | Formula(`DPO_V1`)→Renderer | On-time delivery % | Vendor → Delivery log |

### 5.4 💰 Finance *(8 tabs)*

| # | Sub-Tab | Report ID | Engine Path | Formulas/Rules | Drilldown |
|---|---|---|---|---|---|
| 1 | Treasury Overview | `FIN-01` | Aggregation→Renderer | Liquid capital sum | Station → Account type |
| 2 | Cash Book & Vault Register | `FIN-02` | Register→Rule→Renderer | Shift cash reconciliation | Date → Shift → Voucher |
| 3 | Bank Accounts & Deposits | `FIN-03` | Query→Renderer | Uncleared cheque flag | Bank → Account → Deposit slip |
| 4 | Digital Wallets & Gateway | `FIN-04` | Query→Renderer | Settlement lag calc | Wallet → Transaction |
| 5 | Operating Expenses (OpEx) | `FIN-05` | Register→Rule(approval)→Renderer | Category budget variance | Category → Voucher |
| 6 | Utility Bills & Overheads | `FIN-06` | Query→Renderer | — | Utility type → Bill |
| 7 | Cash Flow Waterfall | `FIN-07` | Aggregation→Renderer | 7-day rolling net calc | Date → Inflow/Outflow line |
| 8 | Financial Audit Trail | `FIN-08` | Query(`audit_logs`)→Renderer | Immutable | Event → Actor |

### 5.5 📒 Ledgers *(5 tabs)*

| # | Sub-Tab | Report ID | Engine Path | Formulas/Rules | Drilldown |
|---|---|---|---|---|---|
| 1 | Chart of Accounts (CoA) | `LED-01` | Query→Renderer | — | Account tree |
| 2 | General Ledger (GL) Statements | `LED-02` | Register→Renderer | Running balance calc | Account → JV → Source doc |
| 3 | Journal Vouchers (JV) | `LED-03` | Register→Rule(double-entry balance check)→Renderer | ∑Dr=∑Cr enforced at write | JV list → JV detail |
| 4 | Trial Balance | `LED-04` | Aggregation→Renderer | 4/6-column format | Account → Movements |
| 5 | Financial Statements (P&L & BS) | `LED-05` | Formula(`TRUE_PROFIT_V1`)→Register→Renderer | Waterfall calc | Line item → Account → JV |
| — | **Tax & Statutory Compliance** *(NEW — see Section 7.4)* | `LED-06` | Formula(`tax_layer`)→Renderer | FBR Sales Tax / Petroleum Levy / Withholding accumulation | Period → Tax type → Voucher |

### 5.6 👥 Customers *(4 tabs)*

| # | Sub-Tab | Report ID | Engine Path | Formulas/Rules | Drilldown |
|---|---|---|---|---|---|
| 1 | Customer Directory & Profiles | `CUS-01` | Query→Renderer | Credit status calc | Customer list → Profile |
| 2 | Accounts Receivable Aging | `CUS-02` | Rule(`AR_AGING_BUCKET`)→Renderer | Aging buckets | Customer → Invoice |
| 3 | Billing Statements & Invoices | `CUS-03` | Register→Renderer | — | Customer → Invoice → Line |
| 4 | Credit Recovery & Cash Receipts | `CUS-04` | Register→Formula(`DSO_V1`)→Renderer | Recovery allocation | Receipt → Invoice(s) allocated |

### 5.7 🚛 Suppliers *(4 tabs)*

| # | Sub-Tab | Report ID | Engine Path | Formulas/Rules | Drilldown |
|---|---|---|---|---|---|
| 1 | Supplier Directory & Contracts | `SUP-01` | Query→Renderer | — | Supplier list → Contract |
| 2 | Accounts Payable Aging | `SUP-02` | Rule(`AP_UPCOMING_7D`)→Renderer | Aging buckets | Supplier → Bill |
| 3 | Supplier Payment Vouchers | `SUP-03` | Register→Rule(double-entry)→Renderer | — | Voucher → Paid GRNs |
| 4 | OMC Rebates & Settlements | `SUP-04` | Formula(`rebate_calc`)→Renderer | Volume rebate threshold | OMC → Rebate entry |

### 5.8 👨‍💼 Staff *(4 tabs)*

| # | Sub-Tab | Report ID | Engine Path | Formulas/Rules | Drilldown |
|---|---|---|---|---|---|
| 1 | Employee Directory & Roles | `STF-01` | Query→Renderer | — | Employee list → Profile |
| 2 | Attendance & Shift Handover | `STF-02` | Register→Rule→Renderer | Shortage/excess calc | Date → Shift → Employee |
| 3 | Salary Advances & Shortages | `STF-03` | Register→Renderer | Deduction ledger | Employee → Advance entry |
| 4 | Monthly Payroll & Payslips | `STF-04` | Formula(`CASH_ACCURACY_V1`)→Register→Renderer | Net payable calc | Payroll batch → Employee → Payslip |

### 5.9 🏷️ Pricing *(3 tabs)*

| # | Sub-Tab | Report ID | Engine Path | Formulas/Rules | Drilldown |
|---|---|---|---|---|---|
| 1 | Price Board & OGRA Rates | `PRC-01` | Formula(`OGRA_MARGIN_V1`)→Renderer | Current active rate | Product → Tax component breakdown |
| 2 | Scheduled Price Revisions | `PRC-02` | Register→Rule→Renderer | Approval + effective date | Circular list → Circular detail |
| 3 | Inventory Revaluation Ledger | `PRC-03` | Formula(`revaluation_gain_loss`)→Register→Renderer | Stock × rate delta | Revision → Tank stock → JV |

### 5.10 📈 Analytics *(4 tabs — Read-Only, Zero CRUD)*

| # | Sub-Tab | Report ID | Engine Path | Formulas/Rules | Drilldown |
|---|---|---|---|---|---|
| 1 | Overview (Executive Cockpit) | `ANL-01` | Aggregation(cross-domain)→Renderer | — | Network → Station |
| 2 | Executive Dashboard (CEO Control Room) | `ANL-02` | Aggregation→Formula(`TRUE_PROFIT_V1`)→Renderer | Multi-station rollup | Station → Domain summary |
| 3 | Cross-Domain Sub-Workspaces | `ANL-03` | Register(reuses FO/INV/FIN/PUR/STF Register calls, read-only) | All above, reused not duplicated | Domain → Report ID (see 5.1-5.9) |
| 4 | Reports Center & AI Forecast | `ANL-04` | Formula(`forecast_regression`)→Renderer | 95% CI forecast model | Forecast → Contributing factors |

---

## 6. Report Registry — Master Table (Dev Checklist)

Every one of the 54 sub-tabs above **must have a corresponding row** in this Postgres table before development starts:

```sql
CREATE TABLE report_registry (
  report_id           VARCHAR(10) PRIMARY KEY,
  workspace            VARCHAR(50) NOT NULL,
  sub_tab_name          VARCHAR(100) NOT NULL,
  engine_path           TEXT[] NOT NULL,          -- e.g. {'aggregation','formula','register','renderer'}
  formula_ids           TEXT[],                    -- FK refs to formula_registry
  rule_ids              TEXT[],                    -- FK refs to rule_registry
  drilldown_l1           VARCHAR(50),
  drilldown_l2           VARCHAR(50),
  drilldown_l3           VARCHAR(50),
  renderer_profile      VARCHAR(30) NOT NULL,       -- 'kpi_card' | 'chart_line' | 'chart_bar' | 'table' | 'gauge'
  rbac_min_role         VARCHAR(30) NOT NULL,
  cache_tier            INT NOT NULL,               -- 1 (realtime) to 4 (daily batch), see Section 9.2
  offline_available      BOOLEAN DEFAULT TRUE,
  status                VARCHAR(20) DEFAULT 'pending' -- pending | in_dev | qa | shipped
);
```

**Rule for developers:** if you are about to write logic for a sub-tab and it has no `report_id` row here, **stop and raise it** — do not invent a report_id or logic on the fly.

---

## 7. Gaps Closed in v6.0 (What Changed and Why)

| Gap Found | Where | Fix Applied in This PRD |
|---|---|---|
| 7.1 ATG treated as core/mandatory | Old 12-Domain Firestore doc | Manual Dip is `INV-03` (primary); ATG is `INV-04` (optional, flagged) |
| 7.2 Firestore chosen over Postgres, breaking RLS/double-entry integrity | Old 12-Domain doc | Postgres+RLS is system of record (P5); NoSQL only as optional read cache, out of scope this phase |
| 7.3 No Engine Layer reuse — every domain hardcoded | Old 12-Domain doc + Menu Tree doc | Section 4 Engine Layer + Section 6 Registry now mandatory gate for all 54 sub-tabs |
| 7.4 No Tax/FBR compliance tab | Menu Tree doc (Ledgers had 5 tabs, no tax tab) | Added `LED-06` Tax & Statutory Compliance |
| 7.5 Sales hourly demand curve / ATV metric lost during Fuel Ops merge | Menu Tree doc (Sales Register absorbed old Sales domain) | Restored inside `FO-03` Sales Register payload — Aggregation Engine returns hourly demand + ATV as sub-metrics, no separate tab needed (avoids re-fragmenting nav) |
| 7.6 Parallel AI tools generating competing specs (Gemini/Antigravity vs Claude) | Process gap | P8 — no new architecture docs; only Wiring Addendums going forward, single canonical repo |
| 7.7 No performance/caching model | All prior docs | Section 9.2 added |

---

## 8. Elite-Tier Features (Differentiators)

These are the two features to build **after** the core 54 sub-tabs are shipped and stable — not before.

### 8.1 AI Copilot Query Drawer (`ANL-04` extension)
Natural-language question box on Analytics workspace ("Kal ka sales kitna tha Mardan branch ka?") that:
- Parses intent → maps to an existing `report_id` + filter params (never generates new SQL directly against prod — always routes through Register Engine)
- Returns the same Renderer components a human would see clicking through manually
- Logs every query for audit (who asked what, when)

### 8.2 Anomaly & Fraud Detection Layer (cross-cutting, hooks into Event Bus)
- Listens to Event Bus for `reading_submitted`, `cash_shift_closed`, `grn_offloaded` events
- Runs statistical outlier checks (z-score on shortage %, meter delta vs historical average) — **not** a black-box AI, must be explainable ("this shift's shortage is 3.2 std-dev above this attendant's 30-day average")
- Raises alerts into the existing Governance Alert Log (`FO-08` / `FIN-08`), does not auto-block transactions

**Tricks & Tips for Dev Team:**
- Build the Aggregation Engine's pre-computed snapshots *first* — most KPI cards should never run a live aggregate query on page load; they read a snapshot refreshed by the Event Bus.
- For `INV-03` Manual Dip entry, make the mobile UI numeric-keypad-first (large touch targets) — real users are wearing gloves/have wet hands.
- For double-entry JV posting (`LED-03`), enforce the balance check as a Postgres `CHECK` constraint or trigger, not just application-layer validation — protects against any future direct-DB-write bug.
- Cache `PRC-01` Price Board aggressively (cache tier 1, but invalidate instantly via Event Bus on any OGRA circular update) — this is the single most-read report in the system.

---

## 9. Non-Functional Requirements

### 9.1 Security & Multi-Tenancy
- Postgres Row Level Security on every table, tenant_id enforced at the database layer, never trusted from application code alone.
- RBAC minimum roles per workspace defined in Report Registry (`rbac_min_role` column) — Attendant / Cashier / Shift Manager / Station Owner / Network Admin.
- All financial voucher actions (JV post, payment voucher, price revision approval) require the acting user's role to be checked by the Permission Engine server-side, never client-side only.

### 9.2 Performance & Caching (4-Tier Model)

| Tier | Refresh | Used For | Example |
|---|---|---|---|
| 1 — Realtime | On Event Bus trigger, <2s | Active shift status, live price board | `FO-01`, `PRC-01` |
| 2 — Near-realtime | 1-5 min batch | Hourly sales aggregation, tank levels | `FO-04`, `INV-01` |
| 3 — Daily batch | End-of-day job | Aging reports, payroll, trial balance | `CUS-02`, `LED-04` |
| 4 — On-demand | Computed at request | Historical multi-year trend, custom date range exports | `ANL-04` forecast |

### 9.3 Offline-First
- All Level 1 (Overview) and manual entry sub-tabs (`FO-02`, `INV-03`, `FIN-02`) must function offline with local queue + sync-on-reconnect via the Event Bus.
- Conflict resolution rule: server-side reading validation (P2) always wins on reconnect — client cannot silently overwrite a discontinuity flag.

### 9.4 Audit & Dispute Defensibility
- Every reading, JV, and override writes to an **append-only** audit log table — no UPDATE/DELETE permitted at the database grant level, only INSERT.
- Every KPI card must be clickable to Level 3 drilldown within 3 clicks, per the Drilldown Engine — no dead-end numbers anywhere in the system.

---

## 10. Build Order (Execution Phases)

1. **Phase 1:** Postgres schema + RLS + Report Registry + Formula/Rule Registry tables (Section 4.2, 4.3, Section 6)
2. **Phase 2:** Core Engines — Query → Aggregation → Register → Renderer (skeleton, no business logic yet)
3. **Phase 3:** Formula Engine + Rule Engine, wire in `TRUE_PROFIT_V1`, `OGRA_MARGIN_V1`, `READING_DISCONTINUITY`, `METER_CHANGED`
4. **Phase 4:** Event Bus + offline sync queue
5. **Phase 5:** Ship Fuel Operations + Inventory workspaces first (P1 principle — these are the data foundation everything else depends on)
6. **Phase 6:** Ship Finance + Ledgers (double-entry engine, Trial Balance, P&L/BS)
7. **Phase 7:** Ship Customers + Suppliers + Purchases (AR/AP aging, GRN)
8. **Phase 8:** Ship Staff + Pricing
9. **Phase 9:** Ship Analytics workspace (pure aggregation of everything above — must be last, it has no independent data)
10. **Phase 10:** Elite features (Section 8) — AI Copilot, Anomaly Detection

**Rule:** No phase may begin before the prior phase's Acceptance Checklist (Section 11) is 100% signed off.

---

## 11. Acceptance Checklist (Per Workspace)

Before any workspace is marked "shipped," confirm:

- [ ] Every sub-tab has a `report_id` row in the Report Registry, status = `shipped`
- [ ] Every number renders via Register Engine only — zero direct DB queries in frontend/API route code
- [ ] Every formula used is a Formula Registry entry — grep codebase for hardcoded percentages/rates and confirm zero hits
- [ ] Every sub-tab supports Level 1→2→3 drilldown, tested against Drilldown Engine
- [ ] RLS policy tested with 2+ tenant accounts — confirm cross-tenant data leakage is impossible
- [ ] Offline entry (where applicable) tested: airplane mode → submit → reconnect → sync confirmed
- [ ] Audit log confirmed append-only (attempt UPDATE/DELETE at DB grant level, must fail)
- [ ] Double-entry check confirmed (`LED-03`): attempt to post an unbalanced JV, must be rejected at DB constraint level
- [ ] Cache tier assigned and tested per Section 9.2
- [ ] Three-Second Rule UX review passed with a non-technical test user (P7)

---

*End of PRD v6.0. This document is the canonical reference. Any deviation must be logged as a Wiring Addendum, not a new architecture document (P8).*
