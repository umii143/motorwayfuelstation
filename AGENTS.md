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
