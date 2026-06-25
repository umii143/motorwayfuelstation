# AI_RULES.md

# Motorway Core Enterprise AI Engineering Rules

Version: 1.0

Status: Official

Applies To:

* ChatGPT
* Codex
* Claude
* Gemini
* Cursor
* GitHub Copilot
* Continue.dev
* Cline
* Any Future AI Coding Assistant

---

# Purpose

This document defines the mandatory engineering rules that every AI assistant must follow while contributing to Motorway Core.

These rules are mandatory.

AI assistants must never intentionally violate them.

If two rules conflict, the rule that better protects architecture, financial integrity, security, maintainability, and correctness takes priority.

---

# Rule Priority

Priority 1

Financial Integrity

Priority 2

Security

Priority 3

Business Rules

Priority 4

Architecture

Priority 5

Offline Capability

Priority 6

Performance

Priority 7

Maintainability

Priority 8

Developer Experience

Priority 9

User Experience

---

# Global Rules

Always:

* Think before generating code.
* Understand the complete feature.
* Preserve existing architecture.
* Respect module boundaries.
* Prefer reusable solutions.
* Generate deterministic implementations.
* Keep code readable.
* Keep code testable.
* Keep code documented.

Never generate code without understanding context.

---

# Architecture Rules

Always:

Follow Clean Architecture.

Follow Domain Driven Design.

Follow CQRS.

Follow SOLID.

Follow DRY.

Follow KISS.

Follow Feature-first organization.

Respect layer boundaries.

Never:

Move business logic into UI.

Access databases directly from components.

Create circular dependencies.

Mix infrastructure with domain logic.

Create hidden side effects.

Introduce tightly coupled modules.

---

# Folder Structure Rules

Every file must belong to the correct layer.

Never place unrelated code together.

Preferred folders:

core/

features/

shared/

services/

workers/

hooks/

store/

types/

utils/

assets/

docs/

tests/

Each feature owns its own implementation.

---

# TypeScript Rules

Always:

Enable strict typing.

Use interfaces where appropriate.

Use explicit return types for public APIs.

Prefer readonly data.

Prefer immutable models.

Use utility types.

Never:

Use any.

Use unknown without narrowing.

Disable TypeScript.

Ignore compiler errors.

Abuse type assertions.

Leave unused exports.

Leave unused imports.

---

# React Rules

Always:

Use functional components.

Keep components small.

Split large components.

Use React.memo when beneficial.

Use lazy loading.

Use Suspense.

Keep rendering predictable.

Never:

Place business logic inside components.

Fetch data everywhere.

Create giant pages.

Create deeply nested JSX.

Create prop drilling chains.

Mutate props.

---

# Zustand Rules

Always:

Use feature stores.

Use selectors.

Persist only required data.

Memoize expensive selectors.

Version persisted stores.

Never:

Create one massive global store.

Duplicate state.

Mutate state.

Store derived values unnecessarily.

Share unrelated state.

---

# Business Logic Rules

Business logic belongs only inside:

Use Cases

Domain Services

Business Rule Engine

Never inside:

Pages

Components

Dialogs

Modals

Tables

Charts

UI components display data.

Business layers calculate data.

---

# Financial Rules

Financial correctness has the highest priority.

Never:

Delete ledger entries.

Modify posted transactions.

Change historical balances.

Edit closed accounting periods.

Always:

Create reversal entries.

Maintain audit history.

Preserve transaction integrity.

Validate calculations.

Require authorization for sensitive actions.

Financial history must remain immutable.

---

# Inventory Rules

Always validate:

Stock availability.

Negative stock policies.

Transfers.

Returns.

Purchase adjustments.

Stock valuation.

Inventory must remain consistent after every operation.

Never silently ignore inventory inconsistencies.

---

# Shift Management Rules

Every shift must support:

Opening

Operations

Closing

Cash Reconciliation

Meter Validation

Inventory Validation

Ledger Posting

Shift history must never be modified after closing without proper authorization and audit logging.

---

# Security Rules

Every feature must include:

Input Validation

Output Encoding

Authorization

Authentication

Secure Storage

Sensitive Data Protection

Audit Logging

Never trust client-side input.

Always validate on the server or trusted domain layer.

---

# Offline Rules

Every feature must answer:

Can it work offline?

Can it recover?

Can it synchronize later?

Can conflicts be resolved?

If not, redesign the implementation.

Offline capability is mandatory for core business operations.
# Performance Rules

Performance is a functional requirement.

Never sacrifice performance for convenience.

Target Metrics:

* App Startup < 2 seconds
* Dashboard Render < 500ms
* Search < 100ms
* POS Transaction < 300ms
* Shift Closing < 2 seconds
* Crash Rate < 0.5%

Always measure before optimizing.

Never optimize blindly.

---

# Rendering Rules

Always:

Render only visible content.

Memoize expensive components.

Virtualize long lists.

Use lazy loading.

Use Suspense boundaries.

Split large pages.

Use worker threads for expensive calculations.

Never:

Render thousands of rows at once.

Recalculate data inside render.

Perform heavy loops inside JSX.

Trigger unnecessary renders.

---

# Routing Rules

Always use a real router.

Preferred Flow:

App

↓

Router

↓

Protected Routes

↓

Feature Routes

↓

Lazy Screens

↓

Error Boundaries

Never:

Use switch(activeView).

Create giant routing files.

Place business logic inside routing.

Every feature should own its routes.

---

# Database Rules

Every database operation must be:

Atomic

Consistent

Recoverable

Versioned

Auditable

Never:

Delete production data without confirmation.

Modify historical financial records.

Perform schema changes without migrations.

Store duplicate business data.

---

# Migration Rules

Every schema update requires:

Migration ID

Forward Migration

Rollback Migration

Validation

Documentation

Testing

Backward compatibility whenever possible.

---

# Repository Rules

Always access persistence through repositories.

Flow:

Use Case

↓

Repository

↓

Database

Never:

Access SQLite directly from UI.

Access APIs directly from Components.

Mix persistence with business rules.

---

# Sync Engine Rules

Every synchronization must support:

Retry

Conflict Detection

Conflict Resolution

Offline Queue

Background Execution

Progress Tracking

Cancellation

Audit Logs

Never block the UI while synchronizing.

---

# Conflict Resolution Rules

Supported Strategies:

Last Write Wins

Merge

Manual Review

Server Authority

Business Rule Authority

Never overwrite financial records automatically.

Require explicit business validation when conflicts involve accounting, inventory, or payments.

---

# Worker Rules

Heavy operations must execute in Workers.

Examples:

Forecasting

Analytics

Large Reports

PDF Generation

Excel Export

Inventory Calculations

Image Processing

Backups

Never execute expensive CPU-bound tasks on the main thread.

---

# Event Bus Rules

Modules communicate through events.

Examples:

ShiftClosed

InventoryAdjusted

StockTransferred

LedgerPosted

ExpenseCreated

PaymentReceived

BackupCompleted

SyncCompleted

Events must:

Be immutable.

Represent facts.

Contain sufficient metadata.

Be versionable.

Never use events for UI state.

---

# CQRS Rules

Separate commands from queries.

Commands:

Change state.

Queries:

Read state.

Never mix both responsibilities inside a single service.

---

# API Rules

Every API must support:

Authentication

Authorization

Versioning

Pagination

Filtering

Sorting

Validation

Rate Limiting

Standard Error Responses

Idempotency (where applicable)

Never expose internal implementation details.

Never return sensitive information unnecessarily.

---

# File Rules

Validate:

Filename

Extension

Size

Content Type

Virus Scan (future)

Store metadata separately.

Never trust uploaded file names.

Never execute uploaded content.

---

# Logging Rules

Log:

Errors

Warnings

Security Events

Sync Events

Business Events

Performance Metrics

Never log:

Passwords

Tokens

Secrets

API Keys

Personal Financial Data

Sensitive logs must be protected.

---

# Error Handling Rules

Every operation must:

Catch expected failures.

Provide user-friendly feedback.

Retry when appropriate.

Log diagnostic information.

Preserve system stability.

Never ignore exceptions silently.

Every error must either be handled or intentionally propagated.

---

# Notification Rules

Notifications must be:

Reliable

Non-blocking

Retryable

Auditable

Support:

In-App

Push

Email

SMS (future)

WhatsApp (future)

Failure to send a notification must never interrupt business operations.
# Authentication Rules

Authentication is mandatory.

Support:

JWT

Refresh Tokens

Secure Sessions

Biometric Authentication

Device Authentication

Future:

Passkeys

OAuth

SSO

Multi-Factor Authentication

Never store passwords in plain text.

Never expose authentication tokens.

Always expire sessions appropriately.

---

# Authorization Rules

Always enforce authorization.

Never assume authentication equals authorization.

Support:

RBAC

ABAC (Future)

Custom Permissions

Branch Permissions

Company Isolation

Station Isolation

Warehouse Isolation

Every sensitive action requires authorization verification.

---

# Encryption Rules

Always encrypt:

Passwords

Tokens

Secrets

Backups

Offline Databases

Sensitive Configuration

Future:

Key Rotation

Hardware-backed Keystore

Encrypted Sync

Never invent custom encryption algorithms.

Always use proven cryptographic libraries.

---

# Audit Rules

Every critical operation must be auditable.

Examples:

Login

Logout

Shift Open

Shift Close

Price Change

Inventory Adjustment

Purchase Approval

Ledger Posting

User Creation

Role Changes

Permission Changes

Backup Restore

Audit records must never be deleted.

---

# Financial Integrity Rules

Financial correctness overrides convenience.

Never:

Delete Transactions

Modify Posted Ledgers

Modify Closed Periods

Remove Audit History

Bypass Validation

Always:

Create Journal Entries

Create Reversal Entries

Validate Balances

Maintain Reconciliation

Preserve Accounting History

Zero tolerance for financial inconsistency.

---

# Business Rule Engine Rules

All business policies belong inside the Rule Engine.

Examples:

Discount Rules

Credit Limits

Expense Approval

Purchase Approval

Salary Calculation

Fuel Price Changes

Inventory Validation

Shift Closing

Commission Rules

Never duplicate business rules across modules.

There must be one authoritative implementation.

---

# Reporting Rules

Reports must be deterministic.

Support:

PDF

Excel

CSV

Print

Background Generation

Large reports must never freeze the application.

Reports must always reconcile with source data.

---

# Analytics Rules

Analytics are read-only.

Never modify operational data.

Support:

KPIs

Forecasts

Business Health

Revenue Trends

Inventory Trends

Profit Analysis

Variance Analysis

Confidence Scores

Analytics must never overwrite operational records.

---

# AI Behavior Rules

AI assists users.

AI never becomes the source of truth.

AI recommendations must:

Be explainable.

Include confidence levels.

Be reviewable.

Be overridable.

Never allow AI to directly modify:

Financial Data

Inventory

Accounting

Permissions

Business Rules

Without explicit user approval.

---

# Code Generation Rules

Generated code must:

Compile successfully.

Follow project conventions.

Use strict TypeScript.

Avoid duplication.

Remain readable.

Remain maintainable.

Include comments only when they add value.

Never generate placeholder implementations unless explicitly requested.

---

# Refactoring Rules

Refactoring must:

Preserve behavior.

Improve readability.

Reduce complexity.

Increase maintainability.

Increase testability.

Never combine refactoring with unrelated feature development.

One Pull Request should have one primary purpose.

---

# Documentation Rules

Documentation is part of the implementation.

Whenever any of the following changes:

Architecture

Business Rules

API

Database

Security

Deployment

Folder Structure

State Management

Update documentation in the same change.

Documentation must never become outdated.

---

# Testing Rules

Every feature requires appropriate tests.

Supported:

Unit Tests

Integration Tests

End-to-End Tests

Offline Tests

Performance Tests

Security Tests

Accessibility Tests

Regression Tests

A feature without tests is incomplete.

---

# Pull Request Rules

Every PR must answer:

Why is this change needed?

What problem does it solve?

Does it preserve architecture?

Does it affect security?

Does it affect performance?

Does it affect offline behavior?

Are tests included?

Is documentation updated?

Can it be rolled back safely?

Incomplete PRs must not be merged.

---

# Release Rules

Every release must include:

Release Notes

Migration Notes

Rollback Plan

Version Number

Quality Gate Results

Deployment Checklist

Production Validation

Every production deployment must be reversible.

---

# Continuous Improvement Rules

Every completed task should improve at least one of:

Architecture

Code Quality

Documentation

Performance

Security

Test Coverage

Developer Experience

User Experience

Business Reliability

Avoid changes that increase long-term technical debt.

---

# Engineering Philosophy

Prefer:

Explicit over implicit.

Simple over clever.

Reusable over duplicated.

Deterministic over unpredictable.

Measured over assumed.

Documented over tribal knowledge.

Secure over convenient.

Maintainable over fast.

Quality is never optional.

---

# Final AI Directive

Every AI agent contributing to Motorway Core shall protect:

The Architecture

The Business Rules

The Financial Ledger

The User Data

The Security Model

The Offline-First Design

The Documentation

The Test Suite

The Performance Budget

The Long-Term Vision

No implementation is considered successful unless it improves the platform while preserving its integrity, reliability, scalability, and maintainability.

End of Document.
