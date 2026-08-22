# Expense Expert

## What This Is

Expense Expert is an existing Angular-based web application for managing expenses, featuring dashboards, reports, and real-time data using Firebase. This project will convert the existing application into a React Native mobile and web application.

## Core Value

Provide a seamless, cross-platform (mobile and web) expense tracking experience using React Native, while maintaining exact parity with the existing Angular application's logic and Firebase integration.

## Requirements

### Validated

- ✓ Expense tracking and management — existing Angular app
- ✓ Dashboard visualization (charts) — existing Angular app
- ✓ Reporting features — existing Angular app
- ✓ User authentication and real-time data sync (Firebase Auth & Firestore) — existing Angular app

### Active

- [ ] Convert the existing Angular application to a React Native mobile and web app.
- [ ] Set up a Docker container to isolate the development environment.
- [ ] Ensure the React Native app can be run and tested from a local machine while running inside the Docker container.
- [ ] Retain and integrate Firebase for backend services (Auth, Firestore, etc.) identically to the current application.
- [ ] Write unit tests for each module/component to ensure they function correctly.
- [ ] Run the application autonomously, troubleshoot, and fix any failures.
- [ ] Verify that all business logic matches the current Angular application.
- [ ] Suggest and implement feasible improvements during the conversion process.

### Out of Scope

- [ ] Migrating away from Firebase — Firebase is explicitly required as the backend.

## Context

- The current application (`expense-expert`) is a Single Page Application (SPA) built with Angular 18, Angular Material, Tailwind CSS, and Firebase.
- The architecture features domain-specific modules for core, features, shared, and layout components.
- The new React Native application needs to be developed within an isolated Docker container but remain testable on the local machine.

## Constraints

- **Tech Stack**: Must use React Native (for both mobile and web).
- **Backend**: Must continue using Firebase (matching current logic).
- **Environment**: Must use Docker for isolation.
- **Quality**: Must have unit testing for each component/module.
- **Logic Parity**: Business logic must remain consistent with the Angular app.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Use React Native for both Web and Mobile | User requirement to convert Angular app to cross-platform React Native. | — Pending |
| Dockerized Development Environment | User requirement for environment isolation. | — Pending |
| Continue using Firebase | To maintain existing backend infrastructure and logic. | — Pending |

---
*Last updated: 2026-08-23 after initialization*

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state
