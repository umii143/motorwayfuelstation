# FuelPro Enterprise — Architecture Freeze Addendum v6.1
**Type:** Wiring Addendum (per PRD v6.0, Principle P8 — this is NOT a new architecture document)
**Parent Document:** `FuelPro_Reporting_Analytics_PRD_v6.0.md` — this addendum extends Sections 4, 6, and 9 only. All other sections of v6.0 remain unchanged and authoritative.
**Status:** DEV-READY — freeze and build against this. No further addenda should be needed for the current build cycle; if a gap appears, log it, don't re-architect.

---

## A.1 Engine Registry Versioning

Every Formula and Rule in the Registries (v6.0 Section 4.2, 4.3) **must be versioned, never edited in place.**

```sql
ALTER TABLE formula_registry ADD COLUMN version INT NOT NULL DEFAULT 1;
ALTER TABLE formula_registry ADD COLUMN superseded_by VARCHAR(20);  -- NULL if current
ALTER TABLE formula_registry ADD COLUMN effective_from DATE NOT NULL;
ALTER TABLE formula_registry ADD COLUMN effective_to DATE;          -- NULL if still active
```

**Rule:** `TRUE_PROFIT_V1` is never deleted or overwritten. When OGRA changes the margin formula, you create `TRUE_PROFIT_V2` with a new `effective_from`, and set `superseded_by` on V1. This means:
- Historical reports (e.g. last year's P&L) always recompute using the formula version that was active *at that time* — never the current one.
- Register Engine resolves `formula_id` + `as_of_date` → correct version, every query.

Same applies to `rule_registry` (e.g. `READING_DISCONTINUITY_V1` → `V2` if the exception threshold changes).

**Dev checklist addition:** no PR that modifies formula logic is mergeable unless it creates a new version row — modifying an existing version's `logic_definition` column is a hard-blocked migration.

---

## A.2 Formula Dependency Tree

A directed graph, stored in Postgres, showing which formulas depend on which upstream data/formulas. Required before Phase 3 (Formula Engine) ships.

```sql
CREATE TABLE formula_dependency_graph (
  formula_id       VARCHAR(20) REFERENCES formula_registry(formula_id),
  depends_on_id    VARCHAR(20),   -- another formula_id, OR a raw table name prefixed 'table:'
  depends_on_type  VARCHAR(10) CHECK (depends_on_type IN ('formula','table'))
);
```

**Example — Net Profit chain:**

```
Net Profit (LED-05, TRUE_PROFIT_V1)
 └── depends on: Revenue (table: sales)
 └── depends on: COGS
       └── depends on: Landed Cost (formula: LANDED_COST_V1)
             └── depends on: OMC Purchase Rate (table: purchase_orders)
             └── depends on: Freight (table: bowser_deliveries)
       └── depends on: OGRA Margin (formula: OGRA_MARGIN_V1)
             └── depends on: Active Price Circular (table: ogra_circulars)
 └── depends on: Operating Expenses (table: expenses)
```

**Why this matters practically:** when `OGRA_MARGIN_V1` changes to `V2`, the Dependency Graph tells the Event Bus exactly which downstream reports (`LED-05`, `PRC-03` Inventory Revaluation, `ANL-02` Executive Dashboard) must be flagged for recalculation — instead of a blind full-system cache flush.

---

## A.3 Widget-Level Dependency & Fault Isolation

Every KPI card / chart / table widget on any screen must declare its own dependency chain, and **failures must be contained to that single widget** — never crash or blank the whole screen.

```
Revenue Widget (report_id: FO-03)
  → Formula (TRUE_PROFIT_V1 or raw sum, per widget type)
  → Permission Engine check
  → Register Engine call
  → Renderer (kpi_card profile)
  → Cache (tier 2)
```

**Implementation rule:**
- Every widget component is wrapped in its own error boundary (frontend) and try/catch at the Register Engine call (backend).
- On failure, the widget renders a **"Data unavailable — retry"** state with the specific `report_id` shown for support/debug — the rest of the screen (other widgets) must render normally.
- Widget failure is logged to the Engine Health Dashboard (A.4) as a per-report_id error count, not a generic 500.

---

## A.4 Engine Health Dashboard (New — Owner-Facing)

**New sub-tab, placed in the existing Analytics workspace** (does not add a new workspace to the sidebar — lives under `ANL-01` Overview as an expandable panel, keeping the 10-workspace/54-tab structure frozen).

**Report ID:** `ANL-05` (extends Analytics workspace, Section 5.10 of v6.0)

| Engine | Status | Queue Depth | Avg Latency | Error Rate (1h) |
|---|---|---|---|---|
| Fuel Ops Engine | 🟢 Healthy | 0 | 45ms | 0% |
| Inventory Engine | 🟢 Healthy | 3 | 60ms | 0% |
| Pricing Engine | 🟡 Degraded | 18 | 210ms | 1.2% |
| Formula Engine | 🔴 Down | 102 | timeout | 14% |
| Event Bus | 🟢 Healthy | 5 | 12ms | 0% |

**Data source:** each Engine emits a heartbeat + metrics event to the Event Bus every 30s; Aggregation Engine rolls this into the dashboard (Tier 1 cache, realtime).

**Threshold rules (Rule Registry additions):**
| rule_id | Trigger | Status |
|---|---|---|
| `ENGINE_HEALTHY` | Error rate < 0.5%, latency < 150ms | 🟢 |
| `ENGINE_DEGRADED` | Error rate 0.5–5%, or latency 150–500ms | 🟡 |
| `ENGINE_DOWN` | Error rate > 5%, or no heartbeat in 90s | 🔴 (auto-alert to Owner role) |

---

## A.5 Data Quality Dashboard (New — Owner-Facing)

**Report ID:** `ANL-06` (extends Analytics workspace, same rule as A.4 — no new sidebar workspace).

Runs as a **Tier 3 (daily batch)** job across all tenants, surfaces anomalies that indicate broken data entry, not business anomalies (that's Section 8.2 Anomaly Detection in v6.0 — different purpose).

| Check | Rule ID | Example Output |
|---|---|---|
| Missing Readings | `DQ_MISSING_READING` | "Nozzle #4 has no closing reading for Shift 2, Aug 5" |
| Duplicate JV | `DQ_DUPLICATE_JV` | "JV #4821 and #4822 have identical amount+date+account" |
| Invalid Customer Reference | `DQ_ORPHAN_CUSTOMER` | "Invoice #991 references deleted customer_id" |
| Negative Stock | `DQ_NEGATIVE_STOCK` | "Tank #2 shows -340L after last GRN" |
| Broken Formula Reference | `DQ_ORPHAN_FORMULA` | "Report LED-05 references formula_id TRUE_PROFIT_V4 which doesn't exist" |
| Missing Report ID | `DQ_UNREGISTERED_SUBTAB` | "Sub-tab rendered in UI has no matching report_registry row" |

**Output:** a single scored list per tenant, sorted by severity, each row clickable to the offending record (reuses Drilldown Engine — no new navigation pattern).

---

## A.6 Database Migration Framework — Firestore → Postgres

**Important reconciliation with current reality:** v6.0 Section 1 (Principle P5) declares Postgres+RLS as the system of record. However, current active development is running on Firestore. This is not a contradiction to resolve by rewriting — it's resolved by an **abstraction layer**, so no work already done is wasted and no UI rebuild is required.

```
┌─────────────────────────────────────────┐
│         UI Layer (unchanged)              │
└───────────────────┬───────────────────────┘
                    │
┌───────────────────▼───────────────────────┐
│      Engine Layer (unchanged — Section 4)  │
│  Register / Formula / Rule / Aggregation   │
└───────────────────┬───────────────────────┘
                    │
┌───────────────────▼───────────────────────┐
│         Repository Interface (NEW)          │
│  e.g. ReadingRepository, LedgerRepository,  │
│  CustomerRepository — one interface per     │
│  domain, engines call ONLY this interface   │
└──────────┬──────────────────────┬───────────┘
           │                      │
┌──────────▼─────────┐  ┌─────────▼───────────┐
│ FirestoreAdapter     │  │ PostgresAdapter       │
│ (Current Dev Profile)│  │ (Enterprise Prod      │
│                      │  │  Profile — target)    │
└──────────────────────┘  └───────────────────────┘
```

**Migration phases:**
1. **Now:** Build/finish Repository Interfaces for every domain; wrap existing Firestore calls behind them (`FirestoreAdapter`). Zero behavior change, zero UI change — this is a refactor, not a rewrite.
2. **Parallel:** Build `PostgresAdapter` implementing the same interfaces, schema per v6.0 Section 6 + this addendum's registry tables.
3. **Cutover, module by module** (not big-bang): start with Ledgers (`LED-*`, highest integrity need — double-entry, RLS), then Fuel Ops/Inventory, then everything else — following the same Build Order priority as v6.0 Section 10.
4. **Dual-write verification window:** during cutover of each module, write to both adapters, compare read results for N days before fully retiring the Firestore path for that module.
5. **Firestore retained permanently** as an optional read-mirror/cache for Tier 1 realtime dashboards only (per v6.0 P5), never as the write path once a module is cut over.

**Rule:** No engine or UI code may ever import a Firestore or Postgres SDK directly. Only the two Adapter implementations may do so.

---

## A.7 API Contract Freeze

Every Engine exposes a frozen REST contract. GraphQL is explicitly out of scope for this phase (adds complexity without a current multi-client need — revisit only if a public developer API is commissioned).

```
GET  /register/{report_id}                → Register Engine, returns full widget payload
GET  /register/{report_id}?drilldown=L2&id={x}  → Drilldown Engine
GET  /formula/{formula_id}?as_of={date}    → Formula Engine, versioned resolution (A.1)
POST /register/{report_id}/action          → for write-capable sub-tabs (e.g. FO-02 shift close, LED-03 JV post)
GET  /health/engines                       → Engine Health Dashboard data (A.4)
GET  /health/data-quality                  → Data Quality Dashboard data (A.5)
GET  /export/{report_id}?format=pdf|xlsx|csv → Universal Report Engine export
```

**Freeze rule:** these paths and their request/response shapes are versioned via URL prefix (`/v1/register/...`) from day one — never break v1 silently; ship v2 alongside if a breaking change is needed.

---

## A.8 Monitoring & Observability (Reserved Architecture Slots)

Not built in this phase, but the architecture must reserve these integration points so they can be added without refactoring:

| Concern | Tool Slot | Hooks Into |
|---|---|---|
| Error tracking | Sentry (or equivalent) | Every Engine's try/catch (A.3 widget isolation) |
| Structured logs | Centralized log pipeline | Every Register Engine call, tagged by `report_id` + `tenant_id` |
| Distributed tracing | OpenTelemetry-compatible | Event Bus → Engine → Adapter call chain |
| Metrics | Prometheus-compatible | Engine Health Dashboard (A.4) feeds from here |
| Alerting | PagerDuty/webhook-based | `ENGINE_DOWN` rule (A.4) triggers here |
| Health checks | `/health/*` endpoints (A.7) | Load balancer + Engine Health Dashboard |

**Rule:** every new Engine built from Phase 2 onward must emit a heartbeat event and accept a correlation ID on every call — retrofitting this later is expensive; building it in from Phase 2 is nearly free.

---

## A.9 Updated Report Registry Schema (supersedes v6.0 Section 6 table — additive only)

```sql
ALTER TABLE report_registry ADD COLUMN parent_workspace VARCHAR(50) NOT NULL;
ALTER TABLE report_registry ADD COLUMN health_monitored BOOLEAN DEFAULT TRUE;
ALTER TABLE report_registry ADD COLUMN data_quality_checks TEXT[]; -- rule_ids from A.5
ALTER TABLE report_registry ADD COLUMN api_version VARCHAR(5) DEFAULT 'v1';
```

Two new rows added to the registry (both live inside the existing Analytics workspace — sidebar stays 10 workspaces / 54 tabs, no structural UI change):

| report_id | workspace | sub_tab_name |
|---|---|---|
| `ANL-05` | Analytics | Engine Health Dashboard (owner-facing) |
| `ANL-06` | Analytics | Data Quality Dashboard (owner-facing) |

---

## A.10 Final Execution Focus (Unchanged Priority — Reaffirmed)

Per the reviewer's own conclusion, and consistent with PRD v6.0 Principle P8:

**🚫 No further PRDs or architecture documents.** This addendum, together with PRD v6.0, the Engine/Formula/Rule Registries, and this Freeze Addendum, constitute the complete Execution Contract.

From here, all effort goes to:
1. Building each of the 10 workspaces as independently functional, per the Build Order (v6.0 Section 10)
2. Computing every KPI through the Register Engine only — zero direct queries anywhere in application code
3. Eliminating all dummy/placeholder data — physically separate staging/prod (v6.0 P6)
4. Every drilldown resolving to a real voucher/reading/JV (v6.0 Section 9.4)
5. Real PDF/Excel/CSV export via the Universal Report Engine (`/export/{report_id}` — A.7)
6. End-to-end testing + performance optimization against the 4-tier cache model (v6.0 Section 9.2)

Any future gap discovered during build is logged as a numbered addendum item (A.11, A.12, ...) appended to *this* file — never as a new competing document.

---
*End of Addendum v6.1. Read together with PRD v6.0 — this file does not stand alone.*
