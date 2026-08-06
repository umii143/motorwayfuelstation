# ⚡ FuelPro Enterprise Event Registry, State Machines & Permissions (v7.0)

> **Execution Law:** FuelPro is a fully **Event-Driven Enterprise ERP**. Every operational action (price update, shift close, GRN offload, cash drop) emits an immutable system event triggering automated ledger postings, inventory revaluations, audit logs, and push notifications.

---

## ⚡ 1. Master System Event Registry

### Event: `EVENT_PRICE_UPDATED`
- **Trigger**: OGRA Retail Rate revision published & approved by Owner.
- **Automated Workflow Pipeline**:
  ```
  EVENT_PRICE_UPDATED
    ├── 1. Broadcast active retail rate to POS terminals & Pump Dispensers
    ├── 2. Calculate Tank Stock Inventory Revaluation (Old Rate vs New Rate Delta)
    ├── 3. Auto-Generate & Post Revaluation Journal Entry (JV) to General Ledger
    ├── 4. Update Analytics Compute Engine Profit Margins
    ├── 5. Log immutable audit entry to Audit Trail Vault
    └── 6. Dispatch FCM Push Notification to Station Managers & Board Members
  ```

### Event: `EVENT_SHIFT_CLOSED`
- **Trigger**: Shift Manager locks shift meter closing sheet.
- **Automated Workflow Pipeline**:
  ```
  EVENT_SHIFT_CLOSED
    ├── 1. Lock Nozzle Closing Meter Delta Readings (startMeter → endMeter)
    ├── 2. Calculate Salesman Net Dispensed Volume & Gross Sales Revenue
    ├── 3. Audit Cashier Shortage / Excess Amount & Log Deduction Voucher
    ├── 4. Post Cash Drop Voucher to Vault Cash Book Ledger
    ├── 5. Auto-Generate & Post Sales Revenue JV (Debit Cash Vault, Credit Sales Revenue)
    └── 6. Trigger Realtime Analytics & Dashboard Refresh
  ```

### Event: `EVENT_GRN_OFFLOADED`
- **Trigger**: OMC Bowser fuel truck decanting inspection completed.
- **Automated Workflow Pipeline**:
  ```
  EVENT_GRN_OFFLOADED
    ├── 1. Record Pre/Post Tank Dip Volume & Compare vs OMC Bowser Invoice Liters
    ├── 2. Compute Bowser Offload Gain / Loss Liters & Value
    ├── 3. Increment Underground Storage Tank (UST) Volume in Inventory
    ├── 4. Post AP Liability Invoice to Supplier Accounts Payable Ledger
    ├── 5. Auto-Generate GRN Inventory JV (Debit Tank Inventory, Credit AP Supplier)
    └── 6. Log Bowser Chamber Inspection Photos & Density Certificates to Documents Vault
  ```

---

## 🔄 2. Module State Machine Lifecycles

### 🛒 Procurement State Machine (`Purchases`)
```
[1. Draft PO] ──► [2. Owner Approved] ──► [3. Bowser In-Transit] ──► [4. Decanted GRN] ──► [5. Invoice Matched] ──► [6. Payment Settled] ──► [7. Closed]
```

### ⛽ Shift Operations State Machine (`Fuel Operations`)
```
[1. Open Shift] ──► [2. Assign Salesmen & Nozzles] ──► [3. Log Meter Readings] ──► [4. Reconcile Drops] ──► [5. Audit Shortages] ──► [6. Lock Shift]
```

### 👥 Commercial Fleet Credit State Machine (`Customers AR`)
```
[1. Fleet Credit Sale] ──► [2. Invoiced] ──► [3. Monthly Statement Sent] ──► [4. Payment Received] ──► [5. Ledger Allocated] ──► [6. Settled]
```

---

## 📄 3. Universal Report Engine Specification

All reporting formats across all 10 domains are processed through a single, unified **Universal Report Engine**:

```
                                  ┌──────────────────────────────────────────────┐
                                  │           Universal Report Engine            │
                                  │      (Single Reporting Service Engine)       │
                                  └──────────────────────┬───────────────────────┘
                                                         │
         ┌───────────────────┬───────────────────┼───────────────────┬───────────────────┐
         ▼                   ▼                   ▼                   ▼                   ▼
    ┌──────────┐        ┌──────────┐        ┌──────────┐        ┌──────────┐        ┌──────────┐
    │  PDF     │        │  Excel   │        │   CSV    │        │  Print   │        │ Automated│
    │ Briefings│        │ Matrix   │        │ Downloads│        │ Direct   │        │ Email/API│
    └──────────┘        └──────────┘        └──────────┘        └──────────┘        └──────────┘
```

---

## 🔒 4. Role-Based & Attribute-Based Permissions Matrix (RBAC / ABAC)

| Workspace / Action | Owner (Admin) | Station Manager | Head Cashier | Attendant / Staff | External Auditor |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **View Executive Analytics** | ✅ | ✅ | ❌ | ❌ | ✅ |
| **Override Nozzle Meter Locking** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Record Manual Tank Dip** | ✅ | ✅ | ❌ | ❌ | ✅ |
| **Approve OGRA Price Revision** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Issue OMC Purchase Order** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Record Physical Cash Vault Drop** | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Post Journal Voucher (JV)** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Approve Staff Payroll** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **View Customer AR Aging** | ✅ | ✅ | ✅ | ❌ | ✅ |
| **Export Audit Logs** | ✅ | ✅ | ❌ | ❌ | ✅ |

---

## 🎛 5. Widget Registry & Custom Dashboard Builder Reserved Architecture

Every UI card, chart, table, and telemetry gauge is registered in the central **Widget Registry**:

```ts
export interface WidgetDefinition {
  widgetId: string;           // e.g. "WIDGET_REVENUE_KPI"
  formulaId: string;          // e.g. "FIN-001"
  title: string;              // e.g. "Today's Gross Revenue"
  domain: string;             // e.g. "analytics" | "fuel_operations"
  component: string;          // e.g. "RevenueKpiCard"
  requiredPermission: string; // e.g. "VIEW_FINANCIALS"
  defaultWidth: 'full' | 'half' | 'third';
  allowPinning: boolean;
  allowDragAndDrop: boolean;
}
```

> 🎯 **Reserved Feature:** Owners can drag, drop, resize, pin, hide, and customize their Executive Cockpit dashboard using the Widget Registry metadata engine without modifying core React components.
