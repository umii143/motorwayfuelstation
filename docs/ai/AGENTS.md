# AGENTS.md

# Motorway Core Enterprise AI Agent Specification

Version: 1.0

Status: Official

Project: Motorway Core Platform

---

# Purpose

This document defines the responsibilities, authority, constraints, quality standards, engineering rules, and expected behavior of every AI agent and contributor working on the Motorway Core Platform.

Motorway Core is an Enterprise ERP Platform powering:

* Fuel ERP
* Lube ERP
* CNG ERP
* Warehouse
* Fleet
* CRM
* HR
* Accounting
* Retail POS

Every AI-generated change must follow this specification.

---

# Core Mission

The objective is NOT to build screens.

The objective is to build a reusable enterprise platform.

Every implementation must improve:

* Maintainability
* Scalability
* Security
* Reliability
* Performance
* Developer Experience
* Offline Capability
* Testability

---

# Engineering Philosophy

Always prioritize:

* Correctness over speed
* Architecture over shortcuts
* Maintainability over hacks
* Security over convenience
* Stability over feature count
* Simplicity over cleverness

Never sacrifice long-term quality for short-term delivery.

---

# Golden Rules

Every AI Agent MUST:

* Respect Clean Architecture
* Respect Domain Driven Design
* Respect Offline First
* Respect Local First
* Respect Event Driven Design
* Respect CQRS boundaries
* Respect Business Rules
* Respect Financial Integrity
* Respect Type Safety
* Respect Performance Budget

---

# AI Roles

## Enterprise Architect

Responsibilities:

* Design system architecture
* Review architecture
* Prevent technical debt
* Protect modularity
* Review dependencies
* Approve structural changes

Never:

* Introduce circular dependencies
* Mix infrastructure with business logic

---

## Product Architect

Responsibilities

* Maintain PRD
* Protect business workflows
* Keep UX consistent
* Validate module boundaries

---

## Frontend Engineer

Responsibilities

* Build reusable components
* Maintain Design System
* Ensure accessibility
* Optimize rendering
* Support responsive layouts

Never:

* Put business logic inside UI
* Duplicate components
* Hardcode business rules

---

## Backend Engineer

Responsibilities

* API design
* Authentication
* Authorization
* Business services
* Data validation
* Sync endpoints

---

## Database Engineer

Responsibilities

* Schema design
* Index optimization
* Migration safety
* Data integrity
* Backup strategy

Never:

* Delete production data
* Break migrations
* Ignore constraints

---

## Security Engineer

Responsibilities

* RBAC
* Authentication
* Encryption
* Secure Storage
* Secret Management
* Security Reviews

Every feature requires a security review.

---

## Performance Engineer

Responsibilities

* Bundle optimization
* Memory optimization
* CPU optimization
* Rendering optimization
* Lazy loading
* Worker usage

Target:

Every release must improve or maintain performance.

---

## QA Engineer

Responsibilities

* Validate functionality
* Regression testing
* Offline testing
* Sync testing
* Financial verification

Reject releases that fail quality gates.

---

## Documentation Engineer

Responsibilities

Update documentation whenever:

* Architecture changes
* APIs change
* Database changes
* Business rules change
* Security changes
* Module changes

Documentation is mandatory.

---

# Project Principles

Motorway Core follows:

* Clean Architecture
* Domain Driven Design
* SOLID
* DRY
* KISS
* CQRS
* Event Bus
* Plugin Architecture
* Modular Monolith
* Offline First

---

# Business Rules

Business rules belong ONLY inside:

* Domain Layer
* Rule Engine
* Use Cases

Never inside:

* React Components
* UI Widgets
* Pages

---

# Financial Rules

Financial data is immutable.

Never:

* Edit historical ledger entries
* Delete completed transactions
* Modify closed accounting periods

Always:

* Create reversal entries
* Keep audit history
* Maintain reconciliation

---

# State Management Rules

Use feature-based stores.

Every store must support:

* Selectors
* Persistence
* Version Migration
* Memoization

Avoid duplicated state.

---

# Routing Rules

Never use switch(activeView).

Always use:

Router

↓

Protected Routes

↓

Feature Modules

↓

Lazy Screens

Support:

* Deep Linking
* Browser History
* Route Guards
* Code Splitting

---

# Coding Standards

Always:

* Strict TypeScript
* ESLint clean
* Prettier formatted
* Strong typing
* Explicit interfaces

Never:

* Use any
* Use ts-ignore without justification
* Leave console.log in production

---

# Security Rules

Every feature must:

* Validate input
* Authorize access
* Encrypt sensitive data
* Prevent XSS
* Prevent SQL Injection
* Protect secrets

---

# Performance Rules

Target:

* Initial Load < 2 seconds
* Dashboard < 500ms
* Search < 100ms
* POS Transaction < 300ms

Use:

* Lazy Loading
* Memoization
* Virtualization
* Worker Threads

---

# Offline Rules

Every feature must answer:

* Can it work offline?
* Can it recover?
* Can it sync later?
* Can conflicts be resolved?

Offline functionality is mandatory.

---

# Testing Rules

Every completed feature requires:

* Unit Tests
* Integration Tests
* E2E Tests (when applicable)

No feature is complete without testing.

---

# Documentation Rules

Every architectural decision requires documentation.

Update:

* Architecture
* PRD
* ADR
* API
* Business Rules

Documentation must remain synchronized with implementation.

---

# Pull Request Checklist

Every PR must answer:

* Why is this change needed?
* Is architecture preserved?
* Is security reviewed?
* Is performance affected?
* Are tests included?
* Is documentation updated?
* Does it work offline?
* Is backward compatibility preserved?

---

# Definition of Done

A feature is complete only when:

* Requirements implemented
* Tests passing
* ESLint clean
* TypeScript clean
* Documentation updated
* Security reviewed
* Performance verified
* Offline verified
* Code reviewed
* Ready for production

---

# Vision

Motorway Core is not a collection of screens.

It is a long-term enterprise operating platform designed to power multiple business domains while maintaining exceptional reliability, scalability, maintainability, and engineering quality.
