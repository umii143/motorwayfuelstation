# SKILLS.md

# Motorway Core Enterprise AI Skills & Knowledge Base

Version: 1.0

Status: Official

Project: Motorway Core Platform

---

# Purpose

This document defines the complete technical knowledge, engineering standards, architectural principles, domain expertise, development capabilities, review criteria, and decision-making guidelines required for every AI agent and contributor working on the Motorway Core Platform.

Motorway Core is not a simple React application.

It is a long-term enterprise platform capable of powering:

* Fuel ERP
* Lube ERP
* CNG ERP
* Warehouse
* Fleet
* CRM
* HR
* Accounting
* Retail POS

Every AI-generated change must be based on this knowledge base.

---

# Primary Mission

The objective is NOT to generate code quickly.

The objective is to generate enterprise-quality software that remains maintainable, scalable, secure, deterministic, testable, and production-ready for many years.

Every engineering decision must improve at least one of the following:

* Maintainability
* Scalability
* Reliability
* Security
* Performance
* Developer Experience
* User Experience
* Offline Capability
* Testability
* Business Integrity

Never optimize one dimension by significantly degrading another.

---

# Core Engineering Skills

Every AI agent must demonstrate expert-level knowledge of:

## Software Engineering

* Clean Architecture
* Domain Driven Design (DDD)
* SOLID Principles
* DRY
* KISS
* YAGNI
* Separation of Concerns
* Dependency Injection
* Repository Pattern
* Factory Pattern
* Strategy Pattern
* Adapter Pattern
* Observer Pattern
* Specification Pattern
* Builder Pattern
* Composition over Inheritance

Understand when each pattern is appropriate.

Avoid unnecessary abstraction.

Never introduce architecture that exceeds the current business requirements unless it clearly supports future scalability.

---

# Enterprise Architecture

The AI must understand:

* Modular Monolith Architecture
* Plugin-Based Systems
* Event Driven Architecture
* CQRS
* Layered Architecture
* Hexagonal Architecture
* Onion Architecture
* Clean Architecture
* Service Layer
* Domain Layer
* Infrastructure Layer
* Application Layer
* Presentation Layer

Every implementation must preserve layer boundaries.

Business logic never belongs inside UI components.

---

# Domain Driven Design

The AI must understand:

Entities

Value Objects

Aggregates

Repositories

Factories

Services

Specifications

Bounded Contexts

Ubiquitous Language

Domain Events

Application Services

Infrastructure Services

Every business rule belongs to the Domain.

Never place domain logic inside React components.

---

# Modular Design

Motorway Core consists of independent modules.

Each module owns:

* Models
* Services
* UI
* State
* Business Rules
* Tests

Modules communicate only through:

* Events
* Shared Contracts
* APIs

Never access another module's internal implementation directly.

---

# Plugin Architecture

Every business should exist as a plugin.

Examples:

Fuel Plugin

Lube Plugin

CNG Plugin

Fleet Plugin

Warehouse Plugin

Accounting Plugin

CRM Plugin

HR Plugin

Plugins must:

* Register themselves
* Expose capabilities
* Use shared interfaces
* Never modify Core

The Core Platform remains business-agnostic.

---

# Layer Responsibilities

Presentation Layer

Responsible for:

* Rendering UI
* User interactions
* Accessibility
* Responsive layouts

Never:

* Perform calculations
* Access databases
* Implement business rules

---

Application Layer

Responsible for:

* Use Cases
* Orchestration
* Command handling
* Query handling
* Validation flow

Never:

* Store UI state
* Access browser APIs directly

---

Domain Layer

Responsible for:

* Business Rules
* Policies
* Validation
* Financial Logic
* Inventory Logic
* Shift Logic

The Domain Layer contains the most valuable knowledge in the platform.

---

Infrastructure Layer

Responsible for:

* APIs
* Database
* Sync Engine
* Storage
* Logging
* Notifications
* File System
* External Services

Infrastructure must never define business rules.

---

# Offline First Expertise

Motorway Core is designed for environments with unstable internet connectivity.

Every feature must support:

* Offline execution
* Local persistence
* Deferred synchronization
* Conflict detection
* Automatic recovery

The system must remain operational without internet access.

Internet connectivity is an enhancement—not a requirement for basic operations.

---

# Local First Philosophy

Data should always be written locally first.

Then synchronized.

Preferred flow:

User Action

↓

Local Database

↓

Sync Queue

↓

Cloud API

↓

Conflict Resolution

↓

Confirmation

The user interface must never block waiting for cloud responses.
# State Management Expertise

The AI must have expert-level knowledge of scalable state management.

Primary Technology:

* Zustand

Required Skills:

* Feature-Based Stores
* Store Composition
* Selectors
* Memoization
* Persist Middleware
* Version Migration
* Store Hydration
* Optimistic Updates
* Derived State
* Immutable Updates

Rules:

Every feature owns its own store.

Never create one massive global store.

Never duplicate state.

Never mutate state directly.

State must remain predictable.

---

# React Expertise

The AI must be proficient in modern React.

Required Knowledge:

* Functional Components
* Hooks
* Context API
* React.memo
* useMemo
* useCallback
* useDeferredValue
* useTransition
* Suspense
* Error Boundaries
* Lazy Loading
* Dynamic Imports
* Concurrent Rendering

Optimization Rules:

Render only what changes.

Avoid unnecessary renders.

Avoid prop drilling.

Split large components.

Keep components focused.

---

# TypeScript Expertise

Strict TypeScript is mandatory.

Always use:

* Interfaces
* Type Aliases
* Generics
* Utility Types
* Discriminated Unions
* Literal Types
* Readonly Types

Never use:

* any
* ts-ignore
* unsafe casting

Every exported API must be fully typed.

Every function must have predictable types.

---

# Component Architecture

Components must be categorized.

Shared UI

Reusable

Business Independent

Examples:

Button

Input

Modal

Card

Badge

Tooltip

Dialog

Skeleton

---

Business Components

Business Aware

Examples:

FuelNozzleCard

ShiftSummary

TankStatus

InventoryTable

ExpenseCard

CustomerLedger

---

Screen Components

Responsible only for:

Layout

Composition

Navigation

Never contain business logic.

---

# UI Design System

Motorway Core follows a centralized Design System.

All UI must use:

* Shared Components
* Shared Colors
* Shared Typography
* Shared Spacing
* Shared Icons
* Shared Animations

Never hardcode:

Colors

Spacing

Font sizes

Border Radius

Shadows

Transitions

Always use Design Tokens.

---

# Accessibility (A11y)

Every screen must be accessible.

Requirements:

Keyboard Navigation

Screen Reader Support

Semantic HTML

ARIA Labels

Focus Management

Contrast Compliance

Touch Targets

Responsive Typography

Accessibility is mandatory.

Not optional.

---

# Responsive Design

Support:

Android Phones

Android Tablets

Desktop

Large Screens

Landscape Mode

Portrait Mode

Avoid:

Fixed Widths

Pixel-perfect assumptions

Overflow bugs

Hidden interactive elements

---

# Mobile Engineering

Primary Platform:

Android

Technology:

Capacitor

Required Skills:

Native Plugins

Biometric Authentication

Secure Storage

Splash Screen

Status Bar

Keyboard Handling

Haptics

Background Tasks

Permissions

Deep Links

App Updates

Offline Cache

Battery Optimization

Memory Awareness

The mobile experience must feel native.

Never ship a mobile web experience wrapped inside an APK.

---

# Navigation Expertise

Navigation must support:

Deep Links

Nested Routes

Protected Routes

Route Guards

Dynamic Routes

Feature Modules

Code Splitting

Prefetching

Browser History

Back Navigation

Current anti-pattern:

switch(activeView)

Target Architecture:

App

↓

Router

↓

DashboardShell

↓

Protected Routes

↓

Feature Routes

↓

Lazy Screens

The routing system must remain scalable for hundreds of screens.

---

# Performance Engineering

Every AI must optimize for performance.

Targets:

App Startup < 2 seconds

Dashboard < 500ms

Search < 100ms

POS Transaction < 300ms

Shift Closing < 2 seconds

Crash Rate < 0.5%

Optimization Techniques:

Lazy Loading

Memoization

Worker Threads

Virtualization

Code Splitting

Deferred Rendering

Image Optimization

Bundle Splitting

Tree Shaking

Performance is a feature.

Never sacrifice performance without strong justification.
# Database Engineering

Motorway Core is an Offline-First Enterprise ERP.

The AI must understand enterprise database design.

Supported Databases:

* SQLite
* IndexedDB
* PostgreSQL

Future Support:

* SQL Server
* MySQL
* Cloud Databases

---

# Database Design Skills

Understand:

Normalization

Denormalization

Indexes

Primary Keys

Foreign Keys

Unique Constraints

Check Constraints

Transactions

Views

Materialized Views

Stored Procedures (when necessary)

Database Versioning

Migration Strategies

Backup Strategies

Data Recovery

Never design tables that duplicate business data unnecessarily.

---

# Data Integrity

Every write operation must guarantee:

Consistency

Integrity

Durability

Recoverability

Atomicity

Never leave the database in an inconsistent state.

Every financial transaction must be atomic.

---

# Migration Strategy

Every schema update must include:

Migration Version

Forward Migration

Rollback Migration

Data Validation

Migration Testing

Migration Documentation

Never break existing production data.

---

# Repository Pattern

The Domain Layer never accesses databases directly.

Flow:

UI

↓

Use Case

↓

Repository

↓

Database

Repositories are responsible only for persistence.

Business rules remain inside the Domain Layer.

---

# Sync Engine Expertise

Motorway Core relies on deterministic synchronization.

Required Knowledge:

Sync Queue

Priority Queue

Retry Queue

Conflict Resolver

Offline Queue

Dead Letter Queue

Retry Policies

Background Synchronization

Incremental Sync

Delta Updates

Data Compression

Retry Backoff

Queue Monitoring

Sync Statistics

---

# Sync Flow

Preferred Workflow:

User Action

↓

Local Database

↓

Sync Queue

↓

Background Worker

↓

Cloud API

↓

Conflict Detection

↓

Conflict Resolution

↓

Confirmation

The UI must never freeze while syncing.

---

# Conflict Resolution

Every conflict must be resolved deterministically.

Supported Strategies:

Last Write Wins

Manual Resolution

Merge Strategy

Timestamp Strategy

Priority Source

Server Authority

Business Rule Authority

Financial records must never be automatically overwritten.

---

# Background Workers

Heavy processing must never block the UI.

Workers handle:

Analytics

Forecasting

Inventory Calculations

Large Reports

PDF Generation

Excel Export

WhatsApp Export

Cloud Synchronization

Database Cleanup

Image Processing

Backup Generation

Worker communication must be message-based.

---

# Event Driven Architecture

Modules communicate through Events.

Never directly couple independent modules.

Examples:

ShiftClosed

InventoryUpdated

LedgerCreated

PaymentReceived

StockAdjusted

BackupCompleted

SyncCompleted

Events should be immutable.

Events should describe facts.

---

# CQRS

Separate Reads from Writes.

Write Side:

Command

↓

Handler

↓

Domain

↓

Repository

↓

Database

Read Side:

Optimized Query

↓

Projection

↓

Dashboard

Never mix read logic with write logic.

---

# Business Rules Engine

Business rules must be centralized.

Never hardcode workflows inside UI.

Examples:

Shift Closing

Cash Verification

Stock Verification

Ledger Posting

Expense Validation

Approval Workflow

Tax Calculation

Discount Validation

Commission Rules

Price Change Rules

Business rules must be reusable across all clients.

---

# Financial Domain Expertise

The AI must understand enterprise accounting.

Required Knowledge:

Double Entry Accounting

Journal Entries

Trial Balance

General Ledger

Cash Book

Bank Book

Accounts Receivable

Accounts Payable

Inventory Valuation

Cost of Goods Sold

Profit & Loss

Balance Sheet

Cash Flow

Closing Periods

Opening Balance

Reconciliation

Audit Trail

Financial correctness is more important than UI appearance.

---

# Financial Rules

Never modify historical ledger entries.

Never edit closed accounting periods.

Never delete financial history.

Always:

Create reversal entries.

Maintain complete audit history.

Require authorization for corrections.

Preserve traceability.

Zero financial data loss is mandatory.

---

# Inventory Expertise

Support:

Fuel Tanks

Lubricants

Accessories

Warehouse Items

Consumables

Inventory Features:

Stock In

Stock Out

Transfers

Adjustments

Returns

Purchase Orders

Supplier Deliveries

Inventory Counts

Stock Valuation

Batch Tracking (Future)

Expiry Tracking (Future)

Inventory calculations must always be deterministic.

---

# Fuel Industry Knowledge

The AI must understand:

Fuel Pumps

Dispensers

Nozzles

Tank Capacity

Tank Dip

Fuel Density

Price Changes

Daily Sales

Shift Closing

Pump Testing

Meter Readings

Variance Analysis

Calibration

Loss Detection

Fuel Reconciliation

The platform is designed around real fuel station operations.

All workflows must reflect real-world business practices.
# Lube Business Expertise

Motorway Core supports dedicated Lubricant Shop operations.

The AI must understand retail lubricant businesses.

Supported Operations:

* POS Sales
* Inventory
* Supplier Management
* Customer Management
* Purchase Orders
* Product Returns
* Cash Management
* Digital Payments
* Reports

---

# Lubricant Knowledge

Supported Products:

Engine Oil

Gear Oil

Hydraulic Oil

Transmission Oil

Brake Fluid

Coolant

Grease

Filters

Battery Water

Accessories

Tyre Care

Car Care Products

Future products must be configurable without modifying the Core Platform.

---

# Customer Management

Support:

Retail Customers

Wholesale Customers

Walk-in Customers

Fleet Customers

Credit Customers

Required Features:

Customer Ledger

Credit Limits

Outstanding Balance

Purchase History

Discount Rules

Loyalty (Future)

Reward Points (Future)

Never allow customer balances to become inconsistent.

---

# Supplier Management

Support:

Supplier Profiles

Purchase History

Outstanding Payables

Payment History

Supplier Ledger

Purchase Orders

Goods Receipt

Purchase Returns

Supplier data must remain auditable.

---

# CRM Expertise

The AI understands enterprise CRM workflows.

Support:

Customers

Suppliers

Fleet Clients

Corporate Clients

Communication History

Sales Opportunities

Complaints

Support Tickets

Customer Notes

Relationship history must never be lost.

---

# Fleet Management Knowledge

Support:

Fleet Companies

Vehicle Registry

Fuel Cards

Vehicle Consumption

Mileage

Maintenance

Fuel Limits

Driver Assignment

Trip History

Future expansion must not require Core modifications.

---

# Human Resource Expertise

Support:

Employees

Attendance

Leave

Salary

Advances

Bonuses

Deductions

Payroll

Permissions

Performance Reviews

Future:

Recruitment

Training

Documents

Compliance

---

# Role-Based Access Control

Every user must have a role.

Supported Roles:

Owner

Administrator

Manager

Supervisor

Cashier

Operator

Accountant

Auditor

Viewer

Future custom roles must be supported.

Never hardcode permissions.

Permissions must be configurable.

---

# Authentication

Required Skills:

JWT

Refresh Tokens

Session Management

Biometric Login

Secure Storage

Password Policies

Account Lockout

Multi-device Login

Session Expiration

Future:

Two-Factor Authentication

Passkeys

SSO

Identity Providers

Authentication must be secure by default.

---

# Security Engineering

The AI must understand:

OWASP Top 10

XSS Protection

CSRF Protection

SQL Injection Prevention

Rate Limiting

Input Validation

Output Encoding

Secrets Management

Key Rotation

Secure Headers

Certificate Pinning

Root Detection

Jailbreak Detection

Tamper Detection

Encrypted Local Storage

Every feature requires a security review.

---

# API Engineering

Supported Architectures:

REST

GraphQL

WebSocket

Future:

gRPC

Required Standards:

Versioning

Pagination

Filtering

Sorting

Idempotency

Standard Error Format

Rate Limiting

Authentication

Authorization

API Documentation

Every API must remain backward compatible whenever possible.

---

# File Management

Support:

PDF

Excel

CSV

Images

Receipts

Invoices

Backups

Reports

Rules:

Validate uploads.

Limit file sizes.

Sanitize filenames.

Prevent executable uploads.

Store metadata separately from business records.

---

# Notification System

Support:

In-App Notifications

Push Notifications

Email

SMS

WhatsApp (Future)

Notification Center

Notification History

Retry Queue

Delivery Status

Notifications must never block business workflows.

---

# Reporting Engine

The reporting system must support:

Daily Reports

Shift Reports

Sales Reports

Inventory Reports

Expense Reports

Profit Reports

Supplier Reports

Customer Reports

Employee Reports

Executive Reports

Reports must be exportable to:

PDF

Excel

CSV

Print

Large reports should execute in background workers.

---

# Analytics Expertise

The AI understands business intelligence.

Support:

KPIs

Business Health

Revenue Trends

Sales Trends

Expense Analysis

Inventory Turnover

Profit Margins

Variance Analysis

Forecasting

Predictive Analytics

Executive Dashboards

Analytics should be data-driven and deterministic.

---

# Forecasting

Support:

Demand Forecast

Sales Forecast

Inventory Forecast

Cash Forecast

Purchase Forecast

Forecast models must include:

Confidence Score

Historical Trends

Seasonality

Events

Holidays

Forecasts must never overwrite actual business data.
# AI Engineering Expertise

Motorway Core includes enterprise AI capabilities.

The AI must generate deterministic, explainable, and auditable outputs.

Supported AI Systems:

* Jarvis AI Assistant
* Business Intelligence
* Forecast Engine
* Recommendation Engine
* Smart Search
* Report Generator
* Anomaly Detection
* Business Health Analyzer

AI exists to assist users—not replace business rules.

---

# AI Principles

Every AI feature must follow:

* Explainable Results
* Deterministic Logic (where required)
* Confidence Scores
* Human Override
* Prompt Versioning
* Output Validation
* Audit Logging
* Zero Hidden Decisions

Business-critical workflows must never rely solely on probabilistic AI.

---

# AI Review Skills

The AI must be capable of reviewing:

Architecture

Performance

Security

Business Logic

Database Design

Code Quality

Accessibility

Documentation

Testing

API Design

Folder Structure

Dependency Graph

The AI must identify:

Anti-patterns

Duplicate Code

Circular Dependencies

Performance Bottlenecks

Memory Leaks

Dead Code

Unused Dependencies

Large Components

Unnecessary Re-renders

Security Risks

Maintainability Issues

---

# Code Review Standards

Every review must evaluate:

Correctness

Readability

Maintainability

Performance

Security

Scalability

Consistency

Offline Compatibility

Accessibility

Documentation

Testing

Every review should provide:

Issue

Impact

Risk

Recommendation

Priority

Estimated Effort

---

# Refactoring Skills

The AI must know how to safely refactor:

Large Components

Complex Hooks

Massive Stores

Business Logic

Services

Repositories

Utilities

Routes

Folder Structures

Rules:

Preserve behavior.

Improve readability.

Reduce complexity.

Increase testability.

Never introduce breaking changes without migration.

---

# Debugging Skills

The AI must diagnose:

Runtime Errors

Build Errors

Type Errors

State Bugs

Sync Failures

API Failures

Performance Issues

Memory Leaks

Rendering Bugs

Authentication Issues

Database Errors

Race Conditions

Always identify:

Root Cause

Impact

Fix

Regression Risk

Verification Steps

---

# Performance Optimization Skills

The AI must optimize:

Bundle Size

Startup Time

Rendering

Scrolling

Animations

Database Queries

Network Requests

Worker Usage

Memory Consumption

Battery Usage

APK Size

Every optimization must be measurable.

Never optimize based on assumptions.

---

# Testing Expertise

Supported Testing Types:

Unit Testing

Integration Testing

End-to-End Testing

Component Testing

Performance Testing

Load Testing

Stress Testing

Offline Testing

Recovery Testing

Security Testing

Accessibility Testing

Snapshot Testing

Contract Testing

Regression Testing

Mutation Testing

Tests are part of the feature.

Not an afterthought.

---

# Documentation Skills

Every architectural change requires documentation.

Maintain:

Architecture

API

Database

Business Rules

Deployment

Testing

Security

Release Notes

Migration Guides

ADRs

Documentation must always reflect the current implementation.

---

# Git Workflow Knowledge

Preferred Strategy:

Feature Branches

↓

Pull Request

↓

Code Review

↓

QA Validation

↓

Merge

↓

Release

Never commit directly to production branches.

Commit messages should follow Conventional Commits.

Examples:

feat:

fix:

refactor:

perf:

docs:

test:

build:

chore:

---

# Release Management

The AI understands:

Semantic Versioning

Feature Flags

Canary Releases

Blue/Green Deployment

Rollback Strategy

Release Notes

Migration Validation

Post-release Monitoring

Every release must be reversible.

---

# DevOps Knowledge

Support:

CI/CD Pipelines

GitHub Actions

Automated Builds

Automated Testing

Dependency Scanning

Secret Scanning

Artifact Generation

Release Automation

Environment Management

Deployment Validation

Production Health Checks

No deployment without passing quality gates.

---

# Observability

Support:

Structured Logging

Metrics

Distributed Tracing

Crash Analytics

Performance Monitoring

Business Metrics

Sync Metrics

Health Checks

Audit Logs

System Diagnostics

Every production issue must be diagnosable.

---

# Disaster Recovery

The AI must understand:

Automatic Backups

Backup Encryption

Point-in-Time Restore

Restore Testing

Disaster Recovery Plans

Power Failure Recovery

Sync Recovery

Data Recovery

Business Continuity

No single failure should result in permanent business data loss.

---

# Multi-Tenant Architecture

Motorway Core must support:

Multiple Companies

Multiple Stations

Multiple Warehouses

Multiple Shops

Multiple Branches

Independent Data

Independent Settings

Independent Permissions

Subscription Plans

License Management

The architecture must scale without redesign.

---

# Internationalization

Support:

Multiple Languages

Multiple Currencies

Multiple Time Zones

Regional Date Formats

Regional Number Formats

Localization

Translation Management

RTL Support

LTR Support

Pakistan is the primary market, but the platform must remain globally extensible.

---

# Compliance

The AI must understand enterprise compliance requirements.

Prepare the platform for:

Financial Audits

Data Retention Policies

Privacy Requirements

Security Standards

ISO 27001 Readiness

SOC 2 Readiness

Regulatory Reporting

Compliance must be built into the platform—not added later.
# AI Engineering Expertise

Motorway Core includes enterprise AI capabilities.

The AI must generate deterministic, explainable, and auditable outputs.

Supported AI Systems:

* Jarvis AI Assistant
* Business Intelligence
* Forecast Engine
* Recommendation Engine
* Smart Search
* Report Generator
* Anomaly Detection
* Business Health Analyzer

AI exists to assist users—not replace business rules.

---

# AI Principles

Every AI feature must follow:

* Explainable Results
* Deterministic Logic (where required)
* Confidence Scores
* Human Override
* Prompt Versioning
* Output Validation
* Audit Logging
* Zero Hidden Decisions

Business-critical workflows must never rely solely on probabilistic AI.

---

# AI Review Skills

The AI must be capable of reviewing:

Architecture

Performance

Security

Business Logic

Database Design

Code Quality

Accessibility

Documentation

Testing

API Design

Folder Structure

Dependency Graph

The AI must identify:

Anti-patterns

Duplicate Code

Circular Dependencies

Performance Bottlenecks

Memory Leaks

Dead Code

Unused Dependencies

Large Components

Unnecessary Re-renders

Security Risks

Maintainability Issues

---

# Code Review Standards

Every review must evaluate:

Correctness

Readability

Maintainability

Performance

Security

Scalability

Consistency

Offline Compatibility

Accessibility

Documentation

Testing

Every review should provide:

Issue

Impact

Risk

Recommendation

Priority

Estimated Effort

---

# Refactoring Skills

The AI must know how to safely refactor:

Large Components

Complex Hooks

Massive Stores

Business Logic

Services

Repositories

Utilities

Routes

Folder Structures

Rules:

Preserve behavior.

Improve readability.

Reduce complexity.

Increase testability.

Never introduce breaking changes without migration.

---

# Debugging Skills

The AI must diagnose:

Runtime Errors

Build Errors

Type Errors

State Bugs

Sync Failures

API Failures

Performance Issues

Memory Leaks

Rendering Bugs

Authentication Issues

Database Errors

Race Conditions

Always identify:

Root Cause

Impact

Fix

Regression Risk

Verification Steps

---

# Performance Optimization Skills

The AI must optimize:

Bundle Size

Startup Time

Rendering

Scrolling

Animations

Database Queries

Network Requests

Worker Usage

Memory Consumption

Battery Usage

APK Size

Every optimization must be measurable.

Never optimize based on assumptions.

---

# Testing Expertise

Supported Testing Types:

Unit Testing

Integration Testing

End-to-End Testing

Component Testing

Performance Testing

Load Testing

Stress Testing

Offline Testing

Recovery Testing

Security Testing

Accessibility Testing

Snapshot Testing

Contract Testing

Regression Testing

Mutation Testing

Tests are part of the feature.

Not an afterthought.

---

# Documentation Skills

Every architectural change requires documentation.

Maintain:

Architecture

API

Database

Business Rules

Deployment

Testing

Security

Release Notes

Migration Guides

ADRs

Documentation must always reflect the current implementation.

---

# Git Workflow Knowledge

Preferred Strategy:

Feature Branches

↓

Pull Request

↓

Code Review

↓

QA Validation

↓

Merge

↓

Release

Never commit directly to production branches.

Commit messages should follow Conventional Commits.

Examples:

feat:

fix:

refactor:

perf:

docs:

test:

build:

chore:

---

# Release Management

The AI understands:

Semantic Versioning

Feature Flags

Canary Releases

Blue/Green Deployment

Rollback Strategy

Release Notes

Migration Validation

Post-release Monitoring

Every release must be reversible.

---

# DevOps Knowledge

Support:

CI/CD Pipelines

GitHub Actions

Automated Builds

Automated Testing

Dependency Scanning

Secret Scanning

Artifact Generation

Release Automation

Environment Management

Deployment Validation

Production Health Checks

No deployment without passing quality gates.

---

# Observability

Support:

Structured Logging

Metrics

Distributed Tracing

Crash Analytics

Performance Monitoring

Business Metrics

Sync Metrics

Health Checks

Audit Logs

System Diagnostics

Every production issue must be diagnosable.

---

# Disaster Recovery

The AI must understand:

Automatic Backups

Backup Encryption

Point-in-Time Restore

Restore Testing

Disaster Recovery Plans

Power Failure Recovery

Sync Recovery

Data Recovery

Business Continuity

No single failure should result in permanent business data loss.

---

# Multi-Tenant Architecture

Motorway Core must support:

Multiple Companies

Multiple Stations

Multiple Warehouses

Multiple Shops

Multiple Branches

Independent Data

Independent Settings

Independent Permissions

Subscription Plans

License Management

The architecture must scale without redesign.

---

# Internationalization

Support:

Multiple Languages

Multiple Currencies

Multiple Time Zones

Regional Date Formats

Regional Number Formats

Localization

Translation Management

RTL Support

LTR Support

Pakistan is the primary market, but the platform must remain globally extensible.

---

# Compliance

The AI must understand enterprise compliance requirements.

Prepare the platform for:

Financial Audits

Data Retention Policies

Privacy Requirements

Security Standards

ISO 27001 Readiness

SOC 2 Readiness

Regulatory Reporting

Compliance must be built into the platform—not added later.
# Engineering Decision Framework

Before implementing any feature, every AI agent must answer:

* Why is this feature needed?
* What business problem does it solve?
* Can it scale?
* Is it maintainable?
* Is it testable?
* Does it work offline?
* Is it secure?
* Is it performant?
* Can it be reused?
* Does it introduce technical debt?
* Can another developer understand it after one year?
* Can it be safely extended in the future?

If any answer is "No", redesign before implementation.

---

# Feature Development Workflow

Every feature must follow this lifecycle:

Requirements

↓

Business Analysis

↓

Architecture Review

↓

UI/UX Design

↓

Domain Modeling

↓

Implementation

↓

Unit Testing

↓

Integration Testing

↓

Performance Validation

↓

Security Review

↓

Documentation Update

↓

Code Review

↓

QA Verification

↓

Production Release

No stage may be skipped.

---

# Quality Gates

Every Pull Request must pass:

✓ TypeScript Compilation

✓ ESLint (0 Errors / 0 Warnings)

✓ Unit Tests

✓ Integration Tests

✓ Security Validation

✓ Performance Validation

✓ Documentation Validation

✓ Accessibility Validation

✓ Offline Validation

✓ Code Review Approval

If any Quality Gate fails, the feature is NOT production ready.

---

# Definition of Ready (DoR)

A feature is ready for development only if:

* Requirements are complete.
* Business rules are defined.
* Acceptance criteria exist.
* UI/UX is approved.
* Data model is identified.
* API requirements are known.
* Security implications are reviewed.
* Offline behavior is specified.
* Testing strategy is defined.

Development must not begin without DoR.

---

# Definition of Done (DoD)

A feature is complete only when:

* Functionality is fully implemented.
* Business rules are respected.
* TypeScript is clean.
* ESLint reports zero issues.
* Tests pass.
* Documentation is updated.
* Performance targets are met.
* Security review is complete.
* Accessibility requirements are satisfied.
* Offline behavior is verified.
* QA approves the feature.
* Production deployment is safe.

Anything less is considered incomplete.

---

# Anti-Patterns

Never introduce:

* God Components
* God Classes
* Massive App.tsx
* Massive Zustand Stores
* Circular Dependencies
* Hidden Business Logic
* Duplicated Code
* Magic Numbers
* Hardcoded Permissions
* Hardcoded Roles
* Hardcoded Colors
* Hardcoded Strings
* Deep Component Nesting
* Global Mutable State
* Business Logic Inside UI
* Database Access Inside Components
* Direct Module Coupling
* Silent Failures
* Unhandled Exceptions
* Console Logs in Production
* Inconsistent Naming

Technical debt must be reduced continuously.

---

# Enterprise Folder Philosophy

Every file must have one clear responsibility.

Preferred Structure:

core/

features/

shared/

services/

store/

workers/

hooks/

types/

utils/

assets/

docs/

tests/

Avoid dumping unrelated files into a single directory.

---

# Error Handling

Every operation must:

Handle Errors

Log Errors

Recover When Possible

Provide User Feedback

Support Retry

Generate Diagnostics

Never swallow exceptions silently.

---

# Logging Standards

Every important action should be logged.

Levels:

TRACE

DEBUG

INFO

WARN

ERROR

FATAL

Sensitive information must never be logged.

Passwords

Tokens

Secrets

Financial Credentials

Personal Data

must always be protected.

---

# Naming Standards

Use consistent naming.

Examples:

FuelShiftService

InventoryRepository

CashLedger

ShiftClosingUseCase

TankCalculationEngine

Avoid vague names.

Bad:

data

temp

test

newFile

Good names describe intent.

---

# AI Response Standards

Every AI response should be:

Correct

Deterministic

Consistent

Actionable

Well Structured

Technically Accurate

Easy to Review

Easy to Maintain

Avoid unnecessary complexity.

Prefer explicitness over cleverness.

---

# Continuous Improvement

Every completed feature should improve:

Architecture

Performance

Maintainability

Documentation

Developer Experience

User Experience

Security

Test Coverage

Code Quality

The platform should become stronger after every release.

---

# Long-Term Vision

Motorway Core is designed to become a world-class enterprise operating platform.

The objective is not simply to build an ERP.

The objective is to build a reusable enterprise foundation capable of supporting multiple industries, business domains, and deployment models while maintaining exceptional engineering quality.

Every decision made today should still make sense five years from now.

---

# AI Oath

Every AI agent contributing to Motorway Core agrees to:

* Protect the architecture.
* Protect financial integrity.
* Protect business rules.
* Protect user data.
* Protect performance.
* Protect maintainability.
* Protect scalability.
* Protect documentation.
* Protect code quality.
* Protect long-term sustainability.

Short-term convenience must never compromise long-term excellence.

---

# Final Mission Statement

Motorway Core is an Enterprise Platform.

It is not a collection of pages.

It is not a collection of components.

It is not a collection of APIs.

It is a unified, scalable, secure, offline-first, domain-driven business operating system.

Every contribution—human or AI—must move the platform closer to enterprise excellence.

End of Document.
