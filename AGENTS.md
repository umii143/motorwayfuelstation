# System Instructions for Multi-Business ERP System (AGENTS.md)

This file contains the permanent system rules, business logic, and role-based permissions that govern the development and operation of the Dual-Business ERP System (Fuel Station + Lube Business).

All code changes and architectural decisions must strictly adhere to these instructions.

## 1. Multi-Business Independence Architecture

The ERP system operates two entirely distinct businesses: **Fuel Station** and **Lube Business**.

- **Data Isolation:** Fuel and Lube businesses MUST have completely separate databases/tables (or local storage keys) for POS, Inventory, Customers, Sales, Cash, Reports, and Settings. There must be no data leakage between the two.
- **Context Switching:** A single toggle/switch at the top navigation level handles changing the active business context.
- **Independent Permissions:** Role permissions and user sessions apply independently for each business (e.g., a "Manager" in Lube does not inherently have "Manager" rights in Fuel unless specifically assigned to both).

## 2. Role-Based Access Control (RBAC) & Permissions

The system enforces strict role-based permissions across three roles: `Admin` (owner), `Manager`, and `Staff` (sales/cashier).

### POS / Sales Module
- **Admin & Manager:** Can void, edit, or delete transactions.
- **Staff:** Can create new sales and view current session sales. Cannot delete, edit, or void past sales.

### Inventory Module
- **Admin & Manager:** Can add new stock, update stock quantities, add/edit products, and reconcile discrepancies.
- **Staff:** Read-only access to view current stock levels.

### Suppliers
- **Admin & Manager:** Can add, edit, and settle payments for suppliers.
- **Staff:** Cannot access supplier management.

### Reports
- **Admin:** Given unrestricted access to full aggregated reports, P&L, balance sheets, and deep analytics.
- **Manager:** Limited to daily and weekly operational summaries and shift closing reports.
- **Staff:** No access to business reports (only their own current shift totals).

### Settings
- **Admin:** Exclusive access to modify system settings, backup configurations, ERP themes, and global currency/language defaults.
- **Manager & Staff:** Denied access to global settings.

## 3. Translation & Language Preferences

- **Primary Language:** The system must default to **English**.
- **Secondary Language:** **Urdu** must be supported as a complete optional translation.
- **Persistence:** User-specific language choices must be persisted across sessions.
- **Implementation:** UI text, module titles, and print receipts must respect the active language state gracefully without breaking container layouts.

## 4. Audit & Security Rules

- **Event Auditing:** Log every significant action (login, logout, add/edit/delete a record, shifts opened/closed). Action logs must include: Timestamp, User ID, User Role, Action Category, and Impacted Record.
- **MFA / 2FA:** Enforce Two-Factor Authentication (2FA) login for high-level operations or top-level Admin access.
- **Secure Endpoints:** On the backend, ensure JWT validation applies to all sensitive REST endpoints alongside explicit role checking middleware.

## 5. Development Enforcement Guidelines for AI Agent

- When creating or updating a module, explicitly verify which Role can perform the action.
- Ensure that `activeStationId` (or equivalent) is passed to ALL data fetch and storage operations to prevent data overlap between Fuel and Lube.
- Never hardcode English strings without providing the Urdu equivalent mapping using the `translate` or `t()` functions.

---

# 🏆 Motorway Core Ultimate Enterprise Architecture Master Prompt (10/10)

## Mission

You are the Principal Enterprise Architect, CTO, Software Architect, DevSecOps Lead, Platform Engineer, and ERP Domain Expert responsible for transforming **Motorway Core** into a world-class enterprise platform.

Your responsibility is NOT to generate code immediately.
Your responsibility is to continuously audit, redesign, optimize, refactor, standardize, and evolve every layer of Motorway Core until it reaches true enterprise standards comparable to SAP, Oracle NetSuite, Microsoft Dynamics 365, Odoo Enterprise, and modern cloud-native SaaS platforms while remaining optimized for Pakistan's offline-first business environment.

## Primary Objective

Motorway Core must become a reusable enterprise platform capable of powering:
* Fuel ERP
* Lube ERP
* CNG ERP
* Warehouse
* Fleet
* HR
* CRM
* Accounting
* Retail POS
* Procurement
* Manufacturing (Future)
* Distribution
* Multi-company operations

without rewriting the core architecture.
Everything must be modular, scalable, testable, secure, deterministic, and maintainable.
Zero shortcuts. Zero technical debt.

## Core Engineering Principles

Always follow:
Offline First, Local First, Cloud Sync, Domain Driven Design, Clean Architecture, SOLID, DRY, KISS, CQRS, Event Driven Architecture, Hexagonal Architecture, Dependency Inversion, Plugin Based Modules, Immutable Financial Records, Zero Data Loss, Security by Default, Privacy by Design, Accessibility First, Performance Budget, Developer Experience, Enterprise Maintainability.

## Enterprise Architecture Requirements

### Architecture
- Layered Architecture, Clean Architecture, DDD, Feature-first Modules, Plugin System, Shared Core, Modular Monolith (initially), Microservice-ready Contracts, Architecture Decision Records (ADRs).

### Platform Core
- Core Platform -> Business Plugins -> Shared Services -> Cross-platform UI -> Infrastructure -> Persistence -> Synchronization.
- No business module may modify the Core. Plugins must register themselves dynamically.

### Routing
- Completely eliminate `switch(activeView)`.
- Implement: App -> Router -> Route Groups -> Protected Routes -> Feature Modules -> Lazy Routes -> Suspense Boundaries -> Error Boundaries.
- Support: Deep Linking, Browser History, Nested Routes, Route Guards, Prefetching, Code Splitting.

### State Management
- Audit every store. Require: Feature Stores, Selectors, Memoization, Persistence, Version Migration, Normalization, Optimistic Updates, Undo/Redo, Offline Queue, Conflict Resolution. No duplicated state.

### Database & Sync Engine
- Support: SQLite, IndexedDB, PostgreSQL, Cloud Sync, Conflict Resolution, Migration Engine, Encrypted Local Database, Transactional Integrity.
- Sync Queue, Retry Queue, Dead Letter Queue, Conflict Resolver, Background Sync.

### Business Rule Engine
- Move all workflows into deterministic rules (e.g. Rule Registry, Validation Engine, Workflow Engine).

### Financial Integrity
- Double Entry Accounting, Immutable Ledger, Period Closing, Audit Trail, Transaction Locks, Rollback Safety.

### Security & AI Governance
- RBAC, ABAC, JWT Rotation, Encrypted Storage, Rate Limiting, Prompt Versioning, Deterministic AI Responses, Hallucination Prevention.

### Performance & Observability
- Enforce Performance Budgets, Memory/CPU Budgets, Lazy Loading, Virtualization, Worker Threads.
- Structured Logs, Metrics, Tracing, Crash Reports, Sync Metrics, Health Checks.

### Definition of Done
No feature is complete unless it includes: Architecture Review, Security Review, Performance Review, Accessibility Review, Offline Validation, Automated Tests, Documentation, Monitoring, Error Recovery, Production Readiness.

### Final Goal
Every engineering decision must prioritize long-term maintainability, scalability, determinism, security, performance, resilience, and developer experience over short-term feature delivery.

---

# 🔒 FuelPro Enterprise Global UI & Development Rules (Mandatory)

## 1. 100% Live Database Rule ⭐⭐⭐⭐⭐
> **Every KPI, Card, Table, Chart, Analytics, Intelligence Panel, Timeline, Feed, Notification, Report, Audit Log, Financial Calculation and Dashboard must be generated only from actual operational database records. Zero Dummy Records. Zero Fake Data. Zero Mock Statistics. Zero Placeholder Values. Every displayed value must originate from the live database and remain fully auditable.**

## 2. Enterprise UI Theme Consistency Rule ⭐⭐⭐⭐⭐
> **Every newly created module must automatically inherit the currently active FuelPro Enterprise UI theme. Colors, typography, spacing, shadows, border radius, buttons, icons, cards, animations, and interaction styles must remain visually identical to the active application theme. Introducing a different design language or mixing multiple UI styles is strictly prohibited.**

## 3. No Theme Mixing Rule ⭐⭐⭐⭐⭐
> **Never mix UI themes. Do not combine Material Design, Fluent UI, Glassmorphism, Neumorphism, Bootstrap, Apple, Windows, or any third-party visual language within the same application. Every module must look like it was designed by the same design system.**

## 4. Existing Design System Rule
Every module must reuse existing:
- Colors
- Components
- Cards
- Buttons
- Typography
- Inputs
- Tables
- Charts
- Badges
- Dialogs
- Tabs
- Navigation
- Status Indicators
- KPI Cards
instead of creating new visual styles.

## 5. Component Reuse Rule
> **Always reuse existing enterprise components before creating new ones. Duplicate UI components are prohibited unless functionally required.**

## 6. Enterprise Color Palette Rule
Always follow the active FuelPro color system. Never introduce random colors. Use only approved colors for Success, Warning, Danger, Information, Neutral, Primary, and Secondary states.

## 7. Responsive Consistency Rule
Desktop, Laptop, Tablet, and Mobile must all preserve the exact same visual identity and theme adaptation.

## 8. Financial Accuracy Rule
Every financial value must be calculated from Journal Entries, Transactions, Shift Records, Ledger, Inventory, Banking, Wallets, Expenses, and Sales. Never hardcode any financial number.

## 9. Auditability Rule
Every action must be traceable. Create immutable audit logs for Create, Update, Delete, Approval, Settlement, Price Change, Discount, Expense, Inventory Adjustment, Bank Posting, and Wallet Transactions.

## 10. Enterprise Performance Rule
No unnecessary renders. No duplicated queries. No duplicate calculations. Prefer centralized stores and reusable services.

## 11. AI Rule
> **AI must never fabricate values, KPIs, trends, charts, forecasts, or recommendations. AI may only analyze verified operational database records using deterministic business rules or approved AI models.**

## 12. Enterprise UX Rule
Every screen should immediately answer:
- What happened?
- What requires attention?
- What action should the user take next?
without overwhelming the interface.

## 13. Professional Layout Rule
Each module must contain: Enterprise Header, Quick Actions, KPI Overview, Search & Filters, Main Workspace, Analytics, Audit Information, Export Options, Empty State, and Role-Based Controls.

## 14. Global Design Integrity Rule ⭐⭐⭐⭐⭐
> **Every new module must visually feel like it belongs to FuelPro Enterprise. It must seamlessly match the existing application without requiring users to mentally switch between different interfaces. No module should appear to be designed by a different team, framework, or design language.**

## 15. Enterprise Module Independence Rule ⭐⭐⭐⭐⭐
> **Each module must be fully self-contained yet seamlessly integrated with the overall ERP. Changes in one module must not break, overwrite, duplicate, or visually affect other modules. Shared services, components, and design tokens should be reused without introducing cross-module inconsistencies or regressions.**

---

# 🎨 Enterprise Text Visibility & Accessibility Rule ⭐⭐⭐⭐⭐ (Mandatory)

> **All text must remain clearly visible under every supported theme (Light, Dark, Enterprise, High Contrast). Never use foreground and background color combinations that reduce readability. Every label, KPI, badge, navigation item, button, chart label, table text, placeholder, and status indicator must meet professional accessibility contrast standards.**

## Mandatory Requirements

### ✅ Text must always be readable.
Never allow:
- Dark text on dark backgrounds.
- Light text on light backgrounds.
- Colored text over similar colored surfaces.
- Low-opacity text that becomes unreadable.
- Disabled text that appears invisible.

### Minimum Contrast
Follow WCAG AA as the minimum standard.
- Normal text: **4.5:1**
- Large text: **3:1**
- Critical financial values: Prefer **7:1**

### Never use opacity to hide important information.
Wrong: `opacity: 0.35`
Correct: `100% readable high contrast text`

### Financial Values Must Stand Out
Amounts like Rs., Profit, Loss, Margin, Sales, Expenses, Bank Balance, Wallet Balance must always use the highest readable contrast.

### Navigation Tabs
Inactive tabs should remain readable. Active tab should be visually highlighted without reducing the readability of inactive tabs.

### Buttons
All Primary, Secondary, Danger, Warning, and Success buttons must have 100% readable text regardless of hover, disabled, loading, or active state.

### KPI Cards
Every KPI card should have clear title, clear value, clear subtitle, and clear status. No faded financial values.

### Charts & Tables
Every chart and table must maintain high contrast for headers, cells, legends, axis labels, tooltips, and status badges.

### Theme Compatibility Rule ⭐⭐⭐⭐⭐
> **Every new module must automatically adapt its text colors to the active FuelPro theme using centralized design tokens. Hardcoded text colors are prohibited. All typography should inherit semantic color variables (Primary, Secondary, Muted, Success, Warning, Danger, Accent) to guarantee readability across every theme.**

### Final UI Validation Rule ⭐⭐⭐⭐⭐
> **Before considering any screen complete, perform a visual accessibility review. Verify that every piece of text, icon, KPI, badge, button, chart label, table value, navigation item, and financial figure is immediately readable without zooming, squinting, or changing display settings. If any element is difficult to read, the implementation is considered incomplete.**

---

# FuelPro Enterprise v4.0 — Global Engineering Rules
### **STRICT DEVELOPMENT STANDARDS (MANDATORY)**

> **THIS DOCUMENT IS THE GLOBAL DEVELOPMENT LAW FOR FUELPRO ENTERPRISE.**
> **EVERY MODULE, SCREEN, COMPONENT, PAGE, API, CHART, REPORT, WIDGET, TABLE, KPI, AND FEATURE MUST FOLLOW THESE RULES WITHOUT EXCEPTION.**
> **VIOLATION OF ANY RULE IS NOT ALLOWED.**

---

# 1. REAL DATABASE ONLY (STRICT)
## MUST
Every single value displayed in FuelPro MUST come directly from the **Google Firebase Realtime Database / Firestore**.
Never calculate KPIs from hardcoded values.
Never generate fake numbers.
Never create placeholder statistics.
Never use demo records.
Never simulate financial values.
Never fabricate analytics.

## STRICTLY PROHIBITED
❌ Dummy Data
❌ Fake Records
❌ Mock Objects
❌ Static JSON
❌ Sample Charts
❌ Placeholder KPIs
❌ Random Numbers
❌ Generated Statistics
❌ Demo Transactions
❌ Temporary Fake Inventory
❌ Hardcoded Sales
❌ Fake Shift
❌ Fake Tank
❌ Fake Customer
❌ Fake Supplier
❌ Fake Bank
❌ Fake Wallet
❌ Fake Ledger
❌ Fake AI Results

---

# 2. LIVE DATABASE CALCULATIONS ONLY
Every KPI must be calculated from actual operational records.
Example: Today's Sales ↓ Read all today's invoices ↓ Calculate ↓ Display (NOT Today's Sales = 250000).

---

# 3. ZERO PLACEHOLDERS
Never write `Coming Soon`, `Demo`, `No Chart Yet`, `Lorem Ipsum`, `Sample`, `Example` unless the database genuinely contains zero records.
Instead show: `No operational records found. Start creating transactions to generate realtime analytics.`

---

# 4. EVERY MODULE MUST BE ENTERPRISE LEVEL
Every module should look like SAP, Oracle, Microsoft Dynamics, Gilbarco, Wayne, Tokheim, Veeder Root. Not a normal CRUD application.

---

# 5. CURRENT UI DESIGN LANGUAGE
Every new screen MUST match the existing FuelPro UI. Never redesign the application. Never change design language. Never introduce another theme. Always continue the current design.

---

# 6. NEVER MIX THEMES
STRICTLY PROHIBITED: Material UI + Bootstrap + Ant Design + AdminLTE + Random Cards + Glassmorphism + Neumorphism + Another Theme. Everything must appear as one unified enterprise application.

---

# 7. COLOR CONSISTENCY
Always follow the existing FuelPro palette. Never invent random colors. Primary Colors: Blue, Dark Navy, Orange, Emerald, White, Grey, Danger Red, Success Green, Warning Orange.

---

# 8. TEXT VISIBILITY (VERY STRICT)
Every text MUST remain readable. Never allow Dark text on dark background, Light text on light background, Low contrast labels, Unreadable buttons, Invisible icons, Small grey text on white. Every screen must pass accessibility contrast.

---

# 9. NO INVISIBLE TEXT
Before completing any screen verify Titles, Buttons, Badges, Charts, Legends, Cards, Labels, Icons, Tables, Headers, Footers, Status Chips all remain clearly visible.

---

# 10. RESPONSIVE FIRST
Desktop, Laptop, Tablet, Android, Large Monitor — Everything must scale perfectly.

---

# 11. SAME COMPONENT SYSTEM
Reuse existing Cards, Buttons, Tables, Dialogs, Charts, Badges, Headers, Tabs, Filters, Search Bars. Never create inconsistent components.

---

# 12. LIVE KPI RULE
Every KPI must display: Current Value, Source, Realtime Status, Last Updated, Confidence (e.g. Today's Sales | Rs. 2,850,000 | Realtime | Updated 2 sec ago | 100% Verified).

---

# 13. CHART RULES
Charts never use fake datasets. If no data exists, show: `No operational records available. Charts will automatically populate after live transactions.`

---

# 14. EMPTY STATES
Empty pages should still feel premium. Display: Professional Illustration, Explanation, Action Button, Database Status. Never display blank white space.

---

# 15. REALTIME FIREBASE
Whenever data changes, entire UI must update automatically via Realtime Listeners. No manual refresh required.

---

# 16. NO HARDCODED TOTALS
Never write hardcoded totals like `Total Sales = 500000`. Always aggregate live database.

---

# 17. NO DUPLICATE BUSINESS LOGIC
One calculation, One source, Reusable service.

---

# 18. IMMUTABLE AUDIT LOG
Financial records cannot disappear. Every action (Create, Edit, Delete, Approve, Reject, Rollback, Settlement, Price Change, Discount, Expense) must create an Audit Log.

---

# 19. ROLE BASED SECURITY
Cashier, Supervisor, Manager, Owner, Admin — Every screen must obey permissions. Never expose hidden actions.

---

# 20. FINANCIAL SAFETY
Money, Inventory, Ledger, Tank, Price, Bank, Wallet cannot silently change. Every change requires Validation, Authorization, Audit.

---

# 21. DOUBLE ENTRY ACCOUNTING
Every financial transaction must generate balanced ledger entries (Debit = Credit).

---

# 22. INVENTORY ACCURACY
Tank Stock = Opening + Import - Sales - Loss = Closing. Always calculated.

---

# 23. NO MAGIC NUMBERS
All limits, Taxes, Margins, Thresholds are Configurable. Never hardcoded.

---

# 24. SEARCH EVERYWHERE
Every module must support Search, Filter, Sort, Export, Pagination.

---

# 25. EXPORTS
PDF, Excel, CSV, Print must always use realtime database.

---

# 26. AI RULE
AI must never invent financial values. AI only analyzes actual database records. No hallucinated insights.

---

# 27. ENTERPRISE LOADING
Skeleton Loaders, Progress Indicators, Realtime Status. No frozen screens.

---

# 28. PERFORMANCE
Lazy Loading, Memoization, Virtual Tables, Realtime Optimization, Large Dataset Support.

---

# 29. FIREBASE FIRST
Preferred Architecture: Firebase Authentication → Firestore → Realtime Listeners → Cloud Functions → Storage → FCM Notifications. Never bypass Firebase without documented reason.

---

# 30. DATABASE INTEGRITY
Never delete financial records. Archive instead. Maintain history forever.

---

# 31. MODULE CONSISTENCY
Every module must contain where applicable: Executive Dashboard, Live KPIs, Search, Filters, Analytics, Charts, Audit Trail, Export, Role Security, Settings, Empty State, Realtime Status.

---

# 32. ENTERPRISE HEADER
Every module should include: Module Title, Enterprise Version, Live Database Badge, Role Indicator, Action Buttons, Health Status, Last Sync.

---

# 33. ERROR HANDLING
Never expose raw Firebase or JavaScript errors. Show professional error messages with recovery actions.

---

# 34. LOGGING
Every critical action must be logged: Who, When, Where, Old Value, New Value, Reason, IP, Device.

---

# 35. CODE QUALITY
No duplicate code, No dead code, No unused imports, No commented production code. Strong TypeScript types only.

---

# 36. UI QUALITY GATE (MANDATORY)
Before considering a module complete, verify:
- ✅ No dummy or fake data
- ✅ 100% Firebase realtime
- ✅ All text clearly visible
- ✅ Color contrast passes accessibility
- ✅ Matches current FuelPro UI exactly
- ✅ No mixed themes
- ✅ Responsive
- ✅ Enterprise appearance
- ✅ Live calculations only
- ✅ Audit logging enabled
- ✅ Role permissions enforced
- ✅ Charts use live data only
- ✅ Professional empty states
- ✅ No layout overflow
- ✅ Icons aligned
- ✅ Typography consistent
- ✅ Loading states implemented
- ✅ Error states implemented

---

# 37. GOLDEN RULE (HIGHEST PRIORITY)
> **FuelPro Enterprise is a mission-critical financial ERP. Every number, chart, KPI, transaction, ledger entry, inventory value, tank level, wallet balance, bank balance, reconciliation, audit log, analytics, report, and AI insight MUST originate from actual Google Firebase operational database records. Under no circumstances may dummy data, fake values, placeholders, generated statistics, mock objects, or hardcoded financial information appear anywhere in the application. Every screen must maintain visual consistency with the existing FuelPro UI, use accurate color combinations with fully readable text, never mix design systems or themes, and always meet enterprise-grade SAP/Oracle quality standards. These rules are mandatory, absolute, and non-negotiable.**

---

# 38. MODULE COMPLETION RULE (STRICT)
No module is considered complete until:
- Backend implemented
- Firebase integration completed
- Realtime listeners verified
- CRUD verified
- Reports verified
- Charts verified
- Audit verified
- Permissions verified
- Mobile verified
- Desktop verified

---

# 39. NO REGRESSION RULE
Any modification MUST NOT break existing modules. Always preserve existing functionality.

---

# 40. PRODUCTION READY RULE
No TODOs, No FIXME, No temporary code, No console.log, No debug UI, No unfinished components.

---

# 41. SINGLE SOURCE OF TRUTH
Business logic must exist in only one place. Never duplicate calculations.

---

# 42. FINANCIAL ACCURACY RULE
Money calculations must never lose precision. Use consistent decimal handling and currency formatting across the ERP.

---

# 43. CROSS MODULE SYNCHRONIZATION
Every financial module must automatically synchronize with Shift Wizard, Inventory, Sales, Banking, Ledger, Wallets, Reports, and Dashboard in Realtime.

---

# 44. ENTERPRISE ANIMATION RULE
Animations should be subtle (150–250 ms), smooth, and never reduce usability or performance.

---

# 45. ACCESSIBILITY RULE
Keyboard navigation, Focus states, ARIA support, WCAG AA contrast, Screen-reader friendly controls.

---

# 46. DATABASE SAFETY RULE
Never overwrite production records without validation. Use transactions/batched writes where appropriate.

---

# 47. CODE REVIEW GATE
Every feature must pass Functional review, UI review, Performance review, Security review, Database review, and Enterprise UX review before being marked complete.

---

# 🏆 MASTER RULE (HIGHEST PRIORITY EXECUTION GATE)

```text
Before generating or modifying ANY module, ALWAYS:

1. Match the current active FuelPro UI exactly.
2. Never introduce a different design language.
3. Never mix themes, component styles, spacing systems, or color palettes.
4. Use only enterprise-grade components already established in FuelPro.
5. Every visible value must originate from the live Google Firebase database.
6. Never generate dummy, fake, placeholder, or mock data.
7. Every KPI, Chart, Table, Card, Analytics, Report, Ledger, and Dashboard must calculate only from actual operational records.
8. Ensure all text has sufficient contrast and remains readable in every supported theme.
9. Verify responsive behavior before considering implementation complete.
10. Never claim a feature is complete until backend, realtime synchronization, security, audit logging, and UI validation have all been verified.
```

---

# 48. ENTERPRISE VISUALIZATION RULE ⭐⭐⭐⭐⭐
> **Every visualization must represent actual operational data and be semantically meaningful. Decorative graphics that do not communicate real information are prohibited. All gauges, tank levels, charts, animations, and indicators must reflect live Google Firebase data, update in real time, and remain synchronized across all dependent modules.**

---

# 49. HYDROSTATIC FIREBASE TANK SYNC RULE ⭐⭐⭐⭐⭐
> **100% Google Firebase Realtime Database Driven. Every Tank, Product, Capacity, Dip Chart, Calibration Table, Density, Temperature, Water Level, Volume, Corrected Volume, ATG Reading, Variance, KPI, Formula, Chart, Forecast, Alert, Audit Log, and Analytics MUST be generated exclusively from actual operational Firebase records. Tank dropdown MUST automatically synchronize with the Inventory & Tank Master Module. Creating duplicate tank records, manual configuration, local arrays, mock objects, hardcoded values, fake calculations, placeholder records, demo data, generated statistics, or dummy charts is STRICTLY FORBIDDEN. All engineering formulas must follow internationally accepted petroleum standards (ASTM D1250/API MPMS/OIML) where applicable. Every calculation must be deterministic, auditable, reproducible, and based only on live operational data.**

---

# 50. PETROLEUM INTELLIGENCE ARCHIVE RULE ⭐⭐⭐⭐⭐
> **Every dip reading, temperature log, density record, ATG telemetry event, water bottom measurement, and shift volume audit MUST be permanently archived in an immutable Petroleum History Engine. Editing or correcting a record must never overwrite historical data; instead, an audit record documenting Old Value, New Value, User ID, Timestamp, Device ID, and Reason must be generated. All historical records must remain searchable and printable across unlimited time ranges (up to 10+ years) directly from Google Firebase Realtime Database.**

---

# 51. DETERMINISTIC PETROLEUM ENGINEERING & HISTORICAL REPLAY RULE ⭐⭐⭐⭐⭐
> **Every engineering calculation inside FuelPro Enterprise MUST be deterministic, reproducible, auditable, and standards-compliant. Hydrostatic volume calculations, interpolation, API Gravity, ASTM D1250 corrections, density conversion, ullage, water deduction, variance, inventory valuation, and all petroleum engineering formulas MUST be calculated only from live Google Firebase operational records and approved calibration tables. No hardcoded lookup values, estimated interpolation shortcuts, simulated telemetry, placeholder calculations, fake engineering data, duplicated tank rendering, or non-reproducible mathematical results are permitted anywhere in the application. Every calculation result must be historically reproducible so that running the same calculation years later with the same input produces the identical output, SVG tank visual state, and complete audit trail.**

---

# 52. ENTERPRISE DECISION SUPPORT & REPORT INTEGRITY RULE ⭐⭐⭐⭐⭐
> **Every report inside FuelPro Enterprise MUST be generated exclusively from immutable operational records stored in Google Firebase and linked accounting ledgers. No simulated reports, estimated balances, mocked KPIs, fake trends, placeholder charts, hardcoded datasets, or calculated demonstration values are permitted. Every report must be fully reproducible years later with identical filters, calculations, audit history, exported files, and printable layouts. Every report must support Executive KPIs, Drill-Down Navigation, Historical Replay, Cross-Module Traceability, Digital Signatures, Immutable Audit Trails, and Multi-Format Export (PDF, Excel, CSV, JSON).**

---

# 53. REALTIME EVENT-DRIVEN DATABASE LISTENERS ⭐⭐⭐⭐⭐
> **Every report MUST automatically synchronize whenever Google Firebase operational records change. No manual refresh button is required. Use onSnapshot(), Realtime Listeners, Cloud Functions, and Event-Driven updates.**

---

# 54. READ-ONLY REPORT INTEGRITY ⭐⭐⭐⭐⭐
> **Reports are strictly READ ONLY. No report module may edit, overwrite, or mutate business data directly. Reports visualize only verified operational records.**

---

# 55. HISTORICAL REPRODUCIBILITY & TIME MACHINE ⭐⭐⭐⭐⭐
> **Every report must be reproducible years later. When an owner selects a specific date, shift, or pump in history, the system must reproduce the exact business state as it existed at that moment in time.**

---

# 56. CROSS-MODULE DRILL-DOWN NAVIGATION ⭐⭐⭐⭐⭐
> **Every report must support seamless drill-down navigation: Executive Dashboard → Revenue → Fuel Grade → Pump → Nozzle → Invoice → Customer Receipt → Journal Entry → Audit Log.**

---

# 57. IMMUTABLE REPORT AUDIT & DIGITAL SIGNATURE ⭐⭐⭐⭐⭐
> **Every exported report must contain immutable audit metadata (Generated By, Timestamp, Firebase Sync Time, Report Revision, SHA-256 Hash, Digital Signature, and QR Verification Code).**

---

# 58. CROSS-MODULE INTELLIGENCE & ROOT CAUSE ANALYSIS ⭐⭐⭐⭐⭐
> **Every report must provide AI-driven Root Cause Analysis and actionable business recommendations (identifying why metrics changed—e.g. inventory shortages, price changes, supplier delays, or digital payment failures).**

---

# 59. 15 ENTERPRISE REPORT CATEGORIES ⭐⭐⭐⭐⭐
> **The platform must power 15 enterprise report categories: 1. Executive Dashboard, 2. Fuel Sales, 3. Inventory & Tank, 4. Financial & General Ledger, 5. Banking & Digital Wallet, 6. Staff & Shift, 7. Supplier & Purchase, 8. Customer & Credit, 9. Fleet & Corporate, 10. Risk & Compliance, 11. Forecast & Business Intelligence, 12. Audit & Investigation, 13. Inventory Valuation, 14. Tax & Regulatory, 15. Multi-Branch Consolidated.**

---

# 80. ZERO FAKE POLICY (HIGHEST PRIORITY EXECUTION GATE) ⭐⭐⭐⭐⭐
> **Every value shown anywhere in the Reports Intelligence Center—including KPIs, cards, tables, charts, forecasts, comparisons, balances, percentages, totals, trends, analytics, alerts, and exports—MUST originate from verified Google Firebase operational records or immutable accounting ledgers. No dummy data, placeholders, simulated values, estimated balances, random generators, hardcoded datasets, mock APIs, or fabricated statistics are permitted under any circumstances.**

---

# 81. SINGLE SOURCE OF TRUTH (SSOT) ARCHITECTURE ⭐⭐⭐⭐⭐
> **The platform enforces a single source of truth: Inventory, Sales, Ledger, Reports, Dashboard, and Analytics MUST derive all values from identical Google Firebase document structures and verified ledger entries. Component-local duplicate calculations are strictly prohibited.**

---

# 82. IMMUTABLE ACCOUNTING LEDGER ENGINE ⭐⭐⭐⭐⭐
> **Financial updates must never use inline increments (e.g. Sales += 500). All financial state changes MUST flow through balanced Journal Entries → General Ledger → Account Balance → Reports.**

---

# 83. REPORT CERTIFICATION & HASH ENGINE ⭐⭐⭐⭐⭐
> **Every generated report MUST display a digital certification metadata box featuring: Firebase Records Count, Ledger Entries Count, Verified Timestamp, SHA-256 Cryptographic Hash, and Digital QR Signature.**

---

# 84. CENTRALIZED FORMULA REGISTRY ⭐⭐⭐⭐⭐
> **No financial or petroleum calculation formula may be written inside React UI components. All formulas (Gross/Net Profit, FIFO Valuation, Shrinkage, ATC, Density, API Gravity) MUST be declared in the centralized Formula Registry (src/lib/reports/formulaRegistry.ts).**

---

# 85. FORMULA REGISTRY & PETROLEUM STANDARDS ⭐⭐⭐⭐⭐
> **The Formula Registry governs ASTM D1250 temperature correction, API Gravity, tank dip interpolation, weighted average inventory valuation, wet stock loss auditing, and tax calculations.**

---

# 86. REPORT DEPENDENCY & LINEAGE GRAPH ⭐⭐⭐⭐⭐
> **Every report must track its upstream dependencies (Revenue Report → Shift Sales → Tank Dip → General Ledger → Bank A/C → Digital Wallet).**

---

# 87. DATA QUALITY ENGINE & INTEGRITY CHECKER ⭐⭐⭐⭐⭐
> **Before executing any report query, the Data Quality Engine must run automated validations (detecting duplicate invoices, negative inventory, missing ledger links, broken balance sheets, or invalid tank dip points).**

---

# 88. FINANCIAL BALANCE RECONCILIATION GATE ⭐⭐⭐⭐⭐
> **Reports must execute the fundamental accounting equation check (Assets = Liabilities + Equity) before certifying financial summaries.**

---

# 89. CROSS-MODULE VARIANCE WARNING GATE ⭐⭐⭐⭐⭐
> **When inventory ledgers and hydrostatic tank telemetry disagree beyond allowed tolerance, the report must display a prominent Cross-Module Variance Warning.**

---

# 90. REPORT HEALTH SCORE & AUDIT BADGE ⭐⭐⭐⭐⭐
> **Every report screen MUST feature a live Health Badge displaying: Data Quality Score %, Ledger Match %, Realtime Sync Status, and Missing Records Count.**

---

# 91. QUERY OPTIMIZATION & PAGINATION SLA ⭐⭐⭐⭐⭐
> **Reports must utilize indexed queries, server-side pagination, and aggregation. Downloading whole collections into client memory is prohibited.**

---

# 92. 10-YEAR DEEP ARCHIVAL ENGINE ⭐⭐⭐⭐⭐
> **Historical queries spanning up to 10 years must resolve in under 5 seconds utilizing indexed range filters and historical snapshot caches.**

---

# 93. DATA LINEAGE & "EXPLAIN THIS NUMBER" ENGINE ⭐⭐⭐⭐⭐
> **Clicking any financial or volume value on a report MUST open an interactive "Explain This Number" modal detailing the exact source transactions, nozzle meters, shift vouchers, and journal entries.**

---

# 94. ZERO DATA LOSS ARCHIVE & RECOVERY ⭐⭐⭐⭐⭐
> **Every transaction must follow the zero-data-loss pipeline: Client Local Store → Cloud Firestore / Realtime DB → Storage Archive → Immutable Ledger Audit Trail.**

---

# 95. MULTI-LEVEL APPROVAL FOR SENSITIVE CLOSINGS ⭐⭐⭐⭐⭐
> **Sensitive financial reports (Monthly Closing, Fiscal Year Closing, Supplier Debt Settlement) require multi-level Admin/Manager approval before final certification.**

---

# 96. COMPLIANCE & TAX REGULATORY ENGINE ⭐⭐⭐⭐⭐
> **Reports must support Pakistan tax compliance standards (FBR Sales Tax, Withholding Tax, OGRA petroleum pricing structures, and Punjab/Sindh revenue board formatting).**

---

# 97. PERFORMANCE SLA ⭐⭐⭐⭐⭐
> **10-year dataset operations SLA: Dashboard initial load < 2s, Complex Report Compilation < 5s, PDF/Excel Export Generation < 10s.**

---

# 100. ENTERPRISE GOLDEN RULE (ABSOLUTE HIGHEST EXECUTION GATE) ⭐⭐⭐⭐⭐
> **FuelPro Enterprise shall never display, calculate, export, cache, estimate, simulate, fabricate, interpolate, or infer any operational or financial value unless it can be fully traced back to immutable Google Firebase operational records and verified accounting ledger entries. Every number displayed in the system must be explainable, reproducible, auditable, historically replayable, and cryptographically verifiable. Any value that cannot be traced to its source transaction MUST NOT be displayed.**

---

# 101. ZERO HARDCODED BUSINESS VALUES ⭐⭐⭐⭐⭐
> **Hardcoding business values (such as static tank capacities, default margins, or fixed prices in React components) is strictly prohibited. All values must be fetched dynamically from Google Firebase Master Collections.**

---

# 102. MASTER DATA DRIVEN ARCHITECTURE ⭐⭐⭐⭐⭐
> **All business entities (Tanks, Pumps, Nozzles, Fuel Grades, Wallets, Banks, Suppliers, Customers, Staff, Branches, Tax Rates) MUST originate exclusively from verified Master Records collections.**

---

# 103. UNIVERSAL UUID & CROSS-MODULE TRACEABILITY ⭐⭐⭐⭐⭐
> **Every system record (from Tank Dip, Delivery Chalan, Sale Invoice, Expense, to General Ledger Entry) must possess a globally unique UUID traceable across all ERP modules.**

---

# 104. ENTERPRISE REFERENTIAL INTEGRITY ⭐⭐⭐⭐⭐
> **Before deleting or modifying any master entity (e.g. Tank or Fuel Grade), the Referential Integrity Checker must verify all downstream dependencies across Inventory, Ledger, Reports, and Audit logs. If dependencies exist, deletion is strictly BLOCKED.**

---

# 105. VERSION CONTROLLED BUSINESS RECORDS ⭐⭐⭐⭐⭐
> **Every business modification (e.g. Price Change, Dip Calibration update, Supplier Debt Adjustment) must be version-controlled, allowing full rollback to prior audited versions.**

---

# 106. IMMUTABLE OPERATIONAL HISTORY ⭐⭐⭐⭐⭐
> **Operational history must never be overwritten. All state updates MUST follow an append-only or versioned archival ledger architecture.**

---

# 107. ENTERPRISE EVENT BUS ⭐⭐⭐⭐⭐
> **All operational events (Shift Closed, Fuel Delivery Received, Expense Posted, Wallet Reconciled) must emit structured events to the central Enterprise Event Bus.**

---

# 108. ENTERPRISE NOTIFICATION BUS ⭐⭐⭐⭐⭐
> **Notifications for critical events (Low Stock, Tank Variance, Fraud Alert, Failed Backup, High Expense) must route through a unified Enterprise Notification Bus.**

---

# 109. CENTRALIZED BUSINESS RULES ENGINE ⭐⭐⭐⭐⭐
> **Business domain logic must not be embedded in React UI presentation logic. All workflows and validation rules must execute through the centralized Business Rules Engine.**

---

# 110. ENTERPRISE FORMULA ENGINE ⭐⭐⭐⭐⭐
> **All mathematical, financial, and petroleum formulas (FIFO, Average Cost, API Gravity, Density, Shrinkage, Wet Stock Loss, ATC) must be declared and computed inside the Formula Registry.**

---

# 111. ENTERPRISE SCHEDULER & AUTOMATION ENGINE ⭐⭐⭐⭐⭐
> **Automated background operations (Daily Closing, Ledger Verification, Calibration Reminders, Database Cleanup) must execute through the Enterprise Scheduler.**

---

# 112. PREDICTIVE MAINTENANCE ENGINE ⭐⭐⭐⭐⭐
> **The platform must monitor equipment telemetry to predict maintenance needs for Pumps, Nozzle meters, ATG Tank Sensors, Printers, and Telemetry Gateways.**

---

# 113. OPERATIONAL SLA MONITOR ⭐⭐⭐⭐⭐
> **Every platform operation must meet strict response SLAs (Firebase reads < 150ms, Charts rendering < 80ms, Complex Reports < 3.2s, Dashboard < 1.1s).**

---

# 114. SMART READ-ONLY CACHE POLICY ⭐⭐⭐⭐⭐
> **Local caching is strictly READ-ONLY for UI performance. Financial records and official balances must always verify against live Google Firebase records.**

---

# 115. BACKUP & RESTORE VERIFICATION ENGINE ⭐⭐⭐⭐⭐
> **Automated backups must undergo scheduled automated restoration verification to guarantee 100% data recovery integrity.**

---

# 116. DIGITAL SIGNATURE & CRYPTOGRAPHIC VERIFICATION ⭐⭐⭐⭐⭐
> **Every exported PDF, Report, Invoice, and Settlement voucher must be cryptographically signed with a SHA-256 hash and QR verification badge.**

---

# 117. ENTERPRISE SECURITY & RELIABILITY SCORE ⭐⭐⭐⭐⭐
> **The system must display real-time Security Ratings (Authentication 100%, Permissions 100%, Encryption 100%, Backups 100%, Audit 100%).**

---

# 118. DISASTER RECOVERY READ-ONLY LOCK ⭐⭐⭐⭐⭐
> **If Google Firebase becomes temporarily unreachable, the platform must automatically enter Read-Only Disaster Recovery Mode. Displaying fabricated or fake fallback data is strictly prohibited.**

---

# 119. UNIFIED ENTERPRISE HEALTH CENTER ⭐⭐⭐⭐⭐
> **The platform must feature a central Health Center monitoring Firebase, Storage, Auth, Cloud Functions, Scheduler, Reports, Sensors, and Bank APIs.**

---

# 120. ULTIMATE ENTERPRISE GOLDEN RULE ⭐⭐⭐⭐⭐
> **FuelPro Enterprise SHALL operate as a mission-critical petroleum ERP where every transaction, inventory movement, tank reading, financial posting, operational event, report, KPI, dashboard, forecast, export, API response, and audit record originates exclusively from verified Google Firebase operational data and enterprise business rules. The system MUST NEVER fabricate, simulate, estimate, or display unverifiable values. Every displayed number must be reproducible, traceable to its originating transaction, protected by immutable audit history, validated by accounting integrity rules, and historically replayable for regulatory, financial, and operational compliance.**









---

# 121. MASTER ENTERPRISE RULE (EIDE) ?????
> **No report may access Firebase directly from the UI layer. All report execution, query planning, business rules, formula evaluation, AI analysis, lineage tracing, caching, exports, scheduling, and certification MUST flow exclusively through the Enterprise Intelligence & Decision Engine (EIDE). The UI is strictly a presentation layer.**
