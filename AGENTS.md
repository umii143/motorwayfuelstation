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
- **Enterprise AI Rule #123:** *The Large Language Model is never the system of record. Operational truth exists only within verified Firebase operational data processed through the Enterprise Decision Engine. AI may analyze, summarize, explain, forecast, and recommend, but it must never invent operational facts, override verified business records, directly modify the operational database, or bypass business rules, RBAC, approval workflows, or audit logging.*
- **Enterprise AI Rule #124:** *Every AI-generated operational recommendation must be traceable to verified operational records, business rules, and execution context. If traceability cannot be established, the AI must explicitly state that the recommendation cannot be verified rather than presenting it as fact.*
- **Enterprise AI Rule #125:** *Every AI response must be reproducible, explainable, auditable, and tenant-isolated. No AI recommendation may depend on hidden state, unverifiable assumptions, cross-tenant data, or non-deterministic operational facts. Every recommendation must be traceable to a specific context snapshot, business rule version, formula version, and immutable audit record.*
- **Enterprise Rule #126 (Business-First Progressive Disclosure):** *FuelPro Reports Platform must look and behave like a real fuel station control room—not a software engineering console. Every screen must prioritize operational decisions first, accounting details second, audit third, and developer diagnostics last. Developer metadata (Manifest, Registry, JSON, Engine, Formula Version, Component IDs, SHA-256, Query Time) must never appear in the default user interface and must be accessible only through a secured Developer Mode.*

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

# 126. FINAL GOLDEN RULE (BUSINESS-FIRST PROGRESSIVE DISCLOSURE) ⭐⭐⭐⭐⭐
> **FuelPro Reports Platform must look and behave like a real fuel station control room—not a software engineering console. Every screen must prioritize operational decisions first, accounting details second, audit third, and developer diagnostics last. Developer metadata (Manifest, Registry, JSON, Engine, Formula Version, Component IDs) must never appear in the default user interface and must be accessible only through a secured Developer Mode.**

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

# 121. MASTER ENTERPRISE RULE (EIDE) ⭐⭐⭐⭐⭐
> **No report may access Firebase directly from the UI layer. All report execution, query planning, business rules, formula evaluation, AI analysis, lineage tracing, caching, exports, scheduling, and certification MUST flow exclusively through the Enterprise Intelligence & Decision Engine (EIDE). The UI is strictly a presentation layer.**

---

# 125. GOLDEN RULE (ENTERPRISE NAVIGATION) ⭐⭐⭐⭐⭐
> **FuelPro Reports Platform is not merely a collection of reports. It is a complete Enterprise Operational Intelligence System. Every operational process must be discoverable through A–Z navigation, Daily Operations navigation, Business Process navigation, and Role-Based navigation. Every KPI must terminate in a live register, and every register must terminate in the original Google Firebase document with full auditability, explainability, and drill-down.**

---

# 127. ENTERPRISE RULE #127 — ZERO MOCK DATA, LIVE BUSINESS DATA ONLY ⭐⭐⭐⭐⭐
> **The Business Center, Reports Module, Dashboard, Registers, KPI Cards, Charts, Analytics, AI Insights, Exports, and every Enterprise screen MUST NEVER generate, inject, estimate or display mock/demo/sample/fake/random placeholder business data. If real data does not exist, the UI must clearly communicate that state instead of inventing values.**

### DATA SOURCE HIERARCHY
1. **Priority 1**: Realtime Firestore Documents
2. **Priority 2**: Firestore Cached Snapshot
3. **Priority 3**: Offline Synced Database
4. **Priority 4**: Historical Snapshot

### EMPTY STATES MUST BE ACTIONABLE
- No customer found: `[ + Add Customer ]`
- No supplier found: `[ + Add Supplier ]`
- No shift exists: `[ + Open New Shift ]`
- No purchase found: `[ + Record Purchase ]`
- No expense found: `[ + Add Expense ]`
- No bank account: `[ + Add Bank Account ]`

---

# 128. ENTERPRISE RULE #128 — LIVE BUSINESS INTEGRITY & TRACEABILITY ⭐⭐⭐⭐⭐
> **Every number visible inside FuelPro must be completely traceable:**
> **KPI ➔ Register ➔ Voucher ➔ Transaction ➔ Firestore Document**
> **If a number cannot be traced to verified operational Firestore records, it MUST NEVER BE DISPLAYED.**

---

# 129. THE 4 MANDATORY PILLARS OF FUELPRO ENTERPRISE ⭐⭐⭐⭐⭐
1. ✅ **Business First UI** (Clean, uncluttered, role-tailored control room interface)
2. ✅ **Zero Mock Data** (100% verified Firestore operational data or actionable empty state)
3. ✅ **Every KPI Clickable** (KPI ➔ Register ➔ Transaction drilldown)
4. ✅ **Every Number Traceable** (Complete audit trail to originating Firestore document)

---

# 130. ENTERPRISE RULE #129 — CONTEXT-AWARE BUSINESS CENTER ⭐⭐⭐⭐⭐

> **The Business Center must never use a universal layout. Every report defines its own context through ReportConfig metadata. The UI framework (shell) is shared, but business content must adapt to the active report.**

## Implementation Law

Every `ReportConfig` MUST define:

| Field | Purpose |
|---|---|
| `searchConfig.placeholder` | Context-aware search input placeholder |
| `searchConfig.placeholderUr` | Urdu equivalent |
| `searchConfig.searchFields` | Which register columns to search |
| `filterGroups[]` | Context-aware filter groups shown in AdvancedFiltersPanel |
| `quickActions[]` | Context-aware action buttons rendered in Quick Actions bar |
| `defaultSavedViews[]` | Pre-defined filter presets persisted in localStorage |

## UI Architecture (MANDATORY)

```
EnterpriseHeader (shell — always the same)
  ├── DateSearchBar
  │   ├── Today / Week / Month pills
  │   ├── ⚙ More Filters button → opens AdvancedFiltersPanel
  │   └── Search input (placeholder from config.searchConfig)
  ├── SavedViewsBar (★ views from config.defaultSavedViews)
  ├── AdvancedFiltersPanel (portal)
  │   ├── Desktop: Right Drawer (slide-in from right)
  │   ├── Mobile/Tablet (<768px): Bottom Sheet (slide-up)
  │   ├── Advanced date ranges
  │   └── config.filterGroups[] rendered dynamically
  └── QuickActions (from config.quickActions[])
```

## STRICTLY PROHIBITED ❌
- Hardcoded universal KPIs across all reports
- Universal filter set applied to every report regardless of context
- Universal search placeholder text
- Universal Quick Actions for all reports
- FilterChips displayed on the main screen (must be inside AdvancedFiltersPanel)
- Blue pill-style DrilldownBreadcrumb (must be text breadcrumb: `A › B › C`)

## MANDATORY ✅
- `searchConfig.placeholder` per report → context-aware search
- `filterGroups[]` per report → filters inside Drawer/Bottom Sheet only
- `quickActions[]` per report → context-aware action buttons
- `defaultSavedViews[]` per report → saved to localStorage under `fuelpro_saved_views_{reportId}`
- **Fuel Sales** has completely different filters than **Customer Ledger** than **Inventory**

## Responsiveness Rule
- ≥768px (Desktop/Laptop): AdvancedFiltersPanel = **Right Drawer**
- <768px (Mobile/Tablet): AdvancedFiltersPanel = **Bottom Sheet**

## Non-Negotiable Architecture Statement
> *The framework shell is shared. The business content — KPIs, search, filters, quick actions, saved views, register columns — is ALWAYS report-driven through ReportConfig metadata. Any violation of this rule requires immediate remediation.*

# 137. ENTERPRISE RULE #137 — ONE WORKSPACE = ONE BUSINESS PROCESS ⭐⭐⭐⭐⭐

**Core Principle**

> Every Sidebar Menu represents exactly one Business Process and must render its own dedicated Business Workspace. Changing a menu must change the complete business surface—not merely the page title.

## Workspace Ownership

Every Workspace MUST own its own:
- Enterprise Header
- Context Breadcrumb
- Domain KPIs
- Search
- Smart Filters
- Quick Actions
- Register/Table
- Charts & Analytics
- AI Insights
- Right Inspector Panel
- Drilldowns
- Empty States
- Firebase Queries
- RBAC Permissions
- Export Templates
- Saved Views
- Business Rules

No other workspace may own or render these.

## Shared Components Only

Only UI components may be shared:
- Card
- Table
- Chart
- Badge
- Button
- Tabs
- Drawer
- Dialog
- SearchBox
- FilterChip
- Inspector Layout

Business logic MUST NEVER be shared.

## Example

### Wrong
```text
Purchase History -> Generic Dashboard -> Only Header Changed
```

### Correct
```text
Purchase History -> Purchase Workspace -> Purchase KPIs -> Purchase Register -> Purchase Charts -> Purchase Filters -> Purchase Inspector -> Purchase Firebase Queries
```

### Another Example
```text
Customer Register -> Customer Workspace -> Customer KPIs -> Customer Ledger -> Customer Recovery -> Customer Statements -> Customer Aging
```

## Metadata Rule

Every Workspace must be completely generated from its own metadata:
```text
WorkspaceMetadata -> Workspace Layout -> KPIs -> Filters -> Queries -> Registers -> Charts -> Actions
```
Adding a new module such as Fleet, LPG, Mart, Lubricants, Tyre Shop, EV Charging must require only a new metadata registration.

## Zero Mock Data Rule

A Workspace must never display fake KPIs, fake charts, fake totals, or fake analytics. If no Firebase records exist:
```text
No Purchase Records Found
[ + Record Purchase ]
```
instead of invented numbers.

## Definition of Done (DoD)

A Workspace is considered complete only if it includes: Dedicated Header, Dedicated KPIs, Dedicated Search, Dedicated Filters, Dedicated Quick Actions, Dedicated Register, Dedicated Charts, Dedicated Inspector, Dedicated Firebase Queries, Dedicated Drilldowns, Dedicated Export, Dedicated Permissions. Otherwise, the Workspace is Incomplete.

## Non-Negotiable Architecture Statement
> *One Workspace = One Business Process. The shell and design tokens are shared; the business surface is never. Any violation of this rule requires immediate remediation.*

# 138. ENTERPRISE RULE #138 — SINGLE SOURCE OF BUSINESS TRUTH ⭐⭐⭐⭐⭐

> **Every business transaction must update all dependent modules from one authoritative source. No workspace may maintain duplicate business state.**

Example:
```text
Purchase Invoice Saved
  -> Purchase Register
  -> Supplier Ledger
  -> Inventory Stock
  -> Tank Stock
  -> Finance Payables
  -> Cash/Bank (if paid)
  -> Profit Calculation
  -> Audit Log
```

This ensures a purchase visible in the Purchase Workspace also reflects outstanding payables in the Supplier Workspace—all workspaces stay synchronized from the same live transaction. A workspace must never show a supplier while another shows outstanding Rs 0 for the same transaction.

## STRICTLY PROHIBITED ❌
- Duplicate business state maintained independently by separate workspaces
- One module updating its own copy of a record without propagating to dependent modules
- Inconsistent totals across workspaces for the same underlying transaction

## MANDATORY ✅
- A single authoritative write path per business transaction
- Automatic propagation to all dependent registers/ledgers from that source
- Cross-module consistency verifiable from one source of truth

## Non-Negotiable Architecture Statement
> *One Transaction -> One Authoritative Source -> All Dependent Modules Synced. No duplicate business state.*

# 139. ENTERPRISE RULE #139 — SINGLE LEDGER ENGINE ⭐⭐⭐⭐⭐

> **No financial balance may ever be calculated inside a React component. Every balance (Customer Outstanding, Supplier Payable, Cash, Bank, Digital Wallet, Profit, Loss) MUST originate exclusively from one central Ledger Engine / Finance Engine.**

Rule #138 establishes that there is a single source of truth, but does not state where that source lives. Rule #139 makes it explicit: the authoritative source for ALL financial state is the centralized Ledger Engine, never ad-hoc arithmetic in UI code.

## Core Principle

- A workspace may only *read* a balance from the Ledger Engine.
- A workspace may never *compute* a balance locally (e.g. summing transactions inside a component to derive an outstanding amount).
- The Ledger Engine is the single writer that produces balances consumed by every workspace.

## Why This Rule Exists

Without it, balances drift between screens—exactly the defect where a Supplier showed Rs 0 outstanding in one workspace while a Purchase in another workspace clearly carried an amount. Centralizing balance computation in the Ledger Engine guarantees every workspace reads the identical, authoritative figure.

## STRICTLY PROHIBITED ❌
- Calculating Customer Outstanding, Supplier Payable, Cash, Bank, Wallet, Profit, or Loss inside a React component
- Maintaining a second, local copy of a balance for display purposes
- Inline increment/decrement of balances (e.g. `balance += amount`) outside the Ledger Engine

## MANDATORY ✅
- All financial balances flow through the central Ledger Engine / Finance Engine
- Balances are derived from immutable journal entries, never from component-local aggregation
- Every workspace renders balances sourced from the same engine, ensuring cross-workspace consistency

## Non-Negotiable Architecture Statement
> *One Balance -> One Ledger Engine -> Every Workspace reads the same figure. Financial state is never computed in the UI.*

# 163. ENTERPRISE RULE #163 — WORKSPACE REGISTRY IS THE ONLY NAVIGATION AUTHORITY ⭐⭐⭐⭐⭐

> **`WorkspaceRegistry.ts` is the single authority for all navigation across the ERP. Hardcoded route strings or duplicated navigation maps in components, sidebars, headers, search, command palette, favorites, or deep links are strictly prohibited.**

Every navigation trigger (Sidebar Launcher, Favorites, Recents, Global Search, Command Palette `Ctrl+K`, Notifications, AI Assistant, Deep Links, Inspector) MUST resolve its route exclusively via `WorkspaceRegistry.ts`.

---

# 164. ENTERPRISE RULE #164 — WORKSPACE LAZY LOADING ⭐⭐⭐⭐⭐

> **Business Domain Workspaces MUST load asynchronously on-demand (`React.lazy` / dynamic imports). Non-active workspace modules must never clutter initial page load bundle.**

When a user opens Fuel Operations, only the Fuel Operations bundle loads. Inventory, Finance, Customers, Suppliers, and Purchases remain unloaded until explicitly navigated to by the user.

---

# 165. ENTERPRISE RULE #165 — WORKSPACE STATE PERSISTENCE ⭐⭐⭐⭐⭐

> **Navigating between business domain workspaces MUST preserve and restore workspace user state (active sub-tab, search text, active filters, scroll position, selected inspector record).**

When a user switches from Inventory to Finance and back to Inventory, their active sub-tab (e.g. `Dip Readings`), selected date filter, search query, and open inspector drawer MUST automatically restore to their exact prior state.

---

# 166. ENTERPRISE RULE #166 — WORKSPACE CONTEXT MEMORY ⭐⭐⭐⭐⭐

> **Drilldown context and selected object state MUST be preserved across domain workspace transitions.**

If a user inspects a customer recovery item, navigates to Customer Ledger, and returns to Recovery, the selected customer context remains active.

---

# 167. ENTERPRISE RULE #167 — WORKSPACE PERMISSION MATRIX ⭐⭐⭐⭐⭐

> **Every workspace route MUST enforce explicit role-based permission checks (`permission: 'VIEW_FUEL' | 'VIEW_INV' | 'VIEW_CUS' | 'VIEW_SUP' | 'VIEW_FIN'`). Global un-scoped permissions are strictly prohibited.**

---

# 168. ENTERPRISE RULE #168 — METADATA-RICH ROUTE REGISTRY ⭐⭐⭐⭐⭐

> **Every route entry in `WorkspaceRegistry.ts` MUST contain rich operational metadata (`reportId`, `workspaceId`, `tabId`, `route`, `permission`, `label`, `labelUr`, `searchPlaceholder`, `exportEnabled`, `allowFavorites`, `allowRecent`).**

Adding a new business domain (e.g. Fleet, LPG, Mart, Lubricants, Tyre Shop, EV Charging) requires ONLY registering a new metadata entry in `WorkspaceRegistry.ts`. The platform automatically generates the workspace UI, header tabs, search, favorites, export, permissions, and routing without modifying core platform code.

---

# 164. ENTERPRISE RULE #164 — PROCUREMENT DOMAIN ISOLATION ⭐⭐⭐⭐⭐

> **Purchases Workspace is responsible ONLY for the complete Procurement Lifecycle (Requisitions, Approval Workflow, Purchase Orders, Supplier Quotations, Rate Comparison, Bowser Deliveries, GRN, 3-Way Invoice Matching, Supplier Performance, Procurement Analytics, Documents, Audit Trail). Purchases Workspace MUST NEVER contain Customer Management, Cash Book, Ledger Accounting, Fuel Sales, Tank Operations, or Inventory Valuation.**

Inventory is responsible for stock after successful GRN posting. Finance is responsible for supplier payments after invoice approval. Suppliers Workspace is responsible for supplier master records and accounts payable. All financial postings MUST be executed through the TransactionEngine and LedgerEngine.

---

# 169. ENTERPRISE RULE #169 — DEDICATED LEDGER TAB COMPONENT ISOLATION ⭐⭐⭐⭐⭐

> **Every Ledger Tab MUST have its own dedicated component, data schema, KPI cards, filters, action bar, inspector panel, export engine, and transaction provider. Shared fallback tables or reused generic schemas are strictly prohibited. `LedgersWorkspaceView.tsx` shall act only as a lightweight domain router and state coordinator.**

---

# 178. ENTERPRISE RULE #178 — ARCHITECTURE FREEZE V6.0 & EXECUTION PHASE PROTOCOL ⭐⭐⭐⭐⭐

> **FUELPRO ARCHITECTURE IS OFFICIALLY FROZEN (v6.0). NO NEW DOMAINS MAY BE CREATED. ALL FUTURE DEVELOPMENT MUST FOCUS STRICTLY ON REFINING EXISTING DOMAINS THROUGH THE DETERMINISTIC EXECUTION CYCLE (`Domain` → `Engine` → `Realtime` → `Reports` → `Testing` → `Done`).**

### Mandatory Freeze Rules:
1. **100% UI-Sidebar Alignment**: The 10 core sidebar workspaces ARE the 10 core reporting domains:
   1. ⛽ **Fuel Operations** (Shifts, Meters, Nozzles, Dispensers)
   2. 📦 **Inventory** (Fuel Tanks, Manual Dip Primary, ATG Adapter, Lubes)
   3. 🛒 **Purchases** (OMC Bulk Procurement, PO, GRN, Lead Time)
   4. 💰 **Finance** (Treasury, Vault Cash, Bank Accounts, Digital Wallets, OpEx)
   5. 📒 **Ledgers** (Double-Entry CoA, General Ledger, Customer/Supplier Ledgers, P&L)
   6. 👥 **Customers (AR)** (Accounts Receivable, Fleet Credit, Aging, Recovery)
   7. 🚛 **Suppliers (AP)** (Accounts Payable, OMC Liabilities, Payables Aging)
   8. 👨‍💼 **Staff & HR** (Shift Rosters, Attendance, Payroll, Cash Shortages)
   9. 🏷️ **Pricing** (OGRA Tariffs, Dealer Margins, Rate Revaluation)
   10. 📊 **Analytics** (CEO Cockpit, Executive Dashboard, Board Deck, AI Forecasts)
2. **Embedded Sub-Modules (No Top-Level Domain Sprawl)**: Executive Dashboard is embedded inside Analytics; POS / Sales Register is embedded inside Fuel Operations. Creating extra top-level domains or duplicate workspaces (e.g. "Finance Plus", "Smart Inventory") is strictly prohibited.
3. **Manual Meter & Manual Tank Dip Primary**: Mechanical meter delta (`startMeter` → `endMeter` → `volumeSold` → `grossSales` → `COGS` → `Ledger`) and physical tank dip measurement are the verified systems of record. ATG/IoT sensors serve as an automated telemetry verification adapter.
4. **Enterprise Hybrid Database Strategy**: PostgreSQL / NestJS / Redis serves as the primary enterprise database and double-entry financial system of record. Firebase handles supporting services: Auth, Realtime Events (`onSnapshot`), Storage, FCM Notifications, and Presence.
5. **Central Engine Layer**: All calculations, formulas, KPIs, and business rules must be processed deterministically through central Engine services (`useAnalyticsComputeEngine`, `TransactionEngine`, `LedgerEngine`).
6. **Read-Only Executive Analytics**: Analytics domain operates as a 100% read-only executive intelligence layer with ZERO operational CRUD actions.
7. **Execution Cycle Protocol**: Every domain must progress through the Execution Cycle: `Dummy Code Removal` → `Realtime Compute Engine` → `Functional Reports` → `Verification & Testing` → `Domain Completion`.

---

# 179. ENTERPRISE RULE #179 — UNIVERSAL 10-LAYER DOMAIN ARCHITECTURE & FORMULA REGISTRY (10/10 LEVEL) ⭐⭐⭐⭐⭐

> **EVERY FUELPRO DOMAIN WORKSPACE MUST STRICTLY IMPLEMENT THE UNIVERSAL 10-LAYER DOMAIN ARCHITECTURE. NO DOMAIN MAY OMIT DOCUMENTS VAULT, MANDATORY AUDIT TRAIL, DOMAIN AI ADVISOR, WORKFLOW LIFECYCLE, OR KPI DRILLDOWNS.**

### 10 Mandatory Domain Layers:
1. **Layer 01: Overview Dashboard** (Always Tab #1 — Domain Control Room)
2. **Layer 02: Realtime KPI Cards** (With Formula ID + Live Status + Confidence)
3. **Layer 03: Operational Registers** (Search, Filter, Sort, Pagination & Details)
4. **Layer 04: Domain Analytics** (Charts, Heatmaps, Performance Curves)
5. **Layer 05: Domain-Specific AI Advisor** (Context-Aware AI Insights & Recommendations)
6. **Layer 06: Documents Vault** (PDF Receipts, GRN Seals, Bank Statements, Lab Reports)
7. **Layer 07: Workflow Lifecycle Engine** (Draft → Pending → Approved → Settled)
8. **Layer 08: Mandatory Audit Trail** (Immutable Who, When, What, Old/New Value Log)
9. **Layer 09: Reports, Export & Print** (PDF Briefings, Excel Matrix, Print Deck)
10. **Layer 10: Role-Based Settings** (Configurable Limits, Margins & RBAC)

### KPI Formula Registry & Traceability Chain:
- Every displayed KPI card MUST declare a standardized **Formula ID** (e.g. `FIN-001`, `INV-002`, `AR-003`).
- Every KPI card MUST be clickable, executing the **Traceability Chain**: `KPI Widget` → `Formula ID` → `Engine Service` → `Repository` → `Realtime Stream` → `Target Operational Register`.




