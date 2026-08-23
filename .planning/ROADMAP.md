# Roadmap: Expense Expert

## Overview

This roadmap defines the execution strategy for converting the existing Angular-based Expense Expert application into a cross-platform React Native solution for both mobile and web. The journey starts with establishing an isolated, Dockerized development environment, progresses through core feature reimplementation (authentication, offline-first transaction entry, categorization, and budgeting), and culminates in a responsive dashboard with real-time, leak-free Firebase synchronization. The focus is on maintaining business logic parity with the original app while delivering a robust, unified frontend.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation & Environment Setup** - Dockerized React Native setup with Firebase integration
- [x] **Phase 2: Authentication System** - Secure cross-platform login and session management
- [x] **Phase 3: Core Transaction Entry** - Offline-first expense recording with safe integer math
- [x] **Phase 4: Categorization & Budgeting** - Custom categories, filtering, and budget tracking
- [x] **Phase 5: Dashboards & Visualizations** - Responsive financial overview and interactive charts
- [ ] **Phase 6: Real-time Synchronization & Stability** - Leak-free real-time listeners and final polish

## Phase Details

### Phase 1: Foundation & Environment Setup
**Goal**: A working, dockerized React Native cross-platform environment connected to Firebase.
**Depends on**: Nothing
**Requirements**: ENV-01
**Success Criteria** (what must be TRUE):
  1. Developer can spin up the environment using Docker and connect locally.
  2. React Native web and mobile applications build and run successfully.
  3. Firebase SDK is initialized and ready for use across platforms.
**Plans**: 3 plans

Plans:
- [x] 01-01: Set up Dockerfile and docker-compose for React Native development.
- [x] 01-02: Initialize React Native project with Web support (e.g., Expo or React Native Web).
- [x] 01-03: Integrate Firebase SDK and define configuration for web and mobile.

### Phase 2: Authentication System
**Goal**: Secure user authentication and session management.
**Depends on**: Phase 1
**Requirements**: AUTH-01, AUTH-02
**Success Criteria** (what must be TRUE):
  1. User can securely log in via Firebase Auth on both web and mobile.
  2. User session persists after restarting the app or refreshing the browser.
**Plans**: 3 plans

Plans:
- [x] 02-01: Implement authentication context and state management.
- [x] 02-02: Build login and registration UI components (responsive for mobile/web).
- [x] 02-03: Wire up Firebase Auth methods (login, logout, persistence).

### Phase 3: Core Transaction Entry
**Goal**: Users can reliably enter expenses with offline support and precise math.
**Depends on**: Phase 2
**Requirements**: TXN-01, TXN-02, TXN-03
**Success Criteria** (what must be TRUE):
  1. User can manually enter expense amounts, categories, and dates.
  2. Financial values are accurately handled using integer cents without floating-point errors.
  3. Expenses entered offline are stored locally and sync when reconnected.
**Plans**: 4 plans

Plans:
- [x] 03-01: Create secure integer-based math utilities for currency handling.
- [x] 03-02: Build the expense entry form UI (date picker, category dropdown, amount input).
- [x] 03-03: Implement local storage mechanism for offline queueing (e.g., AsyncStorage or equivalent).
- [x] 03-04: Implement network connectivity listener and sync queue logic.

### Phase 4: Categorization & Budgeting
**Goal**: Users can organize expenses and set budget limits.
**Depends on**: Phase 3
**Requirements**: CAT-01, CAT-02, CAT-03
**Success Criteria** (what must be TRUE):
  1. User can create, edit, and delete custom categories.
  2. User can filter transactions by category and date range.
  3. User can set monthly budget limits and track spending against them.
**Plans**: 4 plans

Plans:
- [x] 04-01: Create CategoryService, CustomCategory management UI, and CategoryContext with Firestore sync.
- [x] 04-02: Build transaction list filtering & search engine (category filter chips, date range selector, text search).
- [x] 04-03: Create BudgetService, Budget models (integer cents), and Category Budget management UI.
- [x] 04-04: Integrate Category & Budget screens, visual progress meters, routes, and comprehensive automated test suites.

### Phase 5: Dashboards & Visualizations
**Goal**: Provide actionable financial insights via responsive charts.
**Depends on**: Phase 4
**Requirements**: DASH-01, DASH-02, DASH-03
**Success Criteria** (what must be TRUE):
  1. User can view financial summary cards for expenses, income, and balance.
  2. User can interact with visual charts showing spending breakdown by category.
  3. UI adapts cleanly between mobile and desktop/web layouts.
**Plans**: 4 plans

Plans:
- [x] 05-01: Create DashboardService & aggregation utilities (integer-cents monthly summaries, trends, category breakdowns, savings & loan aggregations).
- [x] 05-02: Build cross-platform responsive metric cards (Total Income, Total Expenses, Net Remaining, Savings, Loans Taken) and MonthNavigator.
- [x] 05-03: Build universal SVG visualization components (Category Donut/Pie Chart with legend, Monthly Spending Trend Bar Chart, interactive tooltips).
- [x] 05-04: Integrate full Dashboard page (`/dashboard`), navigation shortcuts, monthly switcher, and automated test suites.

### Phase 6: Real-time Synchronization & Stability
**Goal**: Ensure robust, leak-free real-time data flow and finalize application testing.
**Depends on**: Phase 5
**Requirements**: SYNC-01, SYNC-02
**Success Criteria** (what must be TRUE):
  1. Expenses added on one platform instantly reflect on others.
  2. The application exhibits no memory leaks or duplicate listeners during navigation.
  3. Core components and logic have passing unit tests validating business logic parity.
**Plans**: 3 plans

Plans:
- [ ] 06-01: Audit and refactor Firebase real-time listeners using React hooks for clean mount/unmount.
- [ ] 06-02: Perform cross-platform synchronization testing (web vs mobile simultaneous usage).
- [ ] 06-03: Finalize unit tests for critical state logic, math utilities, and hooks.

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation & Environment Setup | 3/3 | Complete | 2026-08-23 |
| 2. Authentication System | 3/3 | Complete | 2026-08-23 |
| 3. Core Transaction Entry | 4/4 | Complete | 2026-08-23 |
| 4. Categorization & Budgeting | 4/4 | Complete | 2026-08-23 |
| 5. Dashboards & Visualizations | 4/4 | Complete | 2026-08-23 |
| 6. Real-time Synchronization & Stability | 0/3 | Not started | - |
