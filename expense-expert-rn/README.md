# 💳 Expense Expert — Universal React Native Financial Tracking Application

[![React Native](https://img.shields.io/badge/React%20Native-0.76.6-61DAFB?logo=react&logoColor=black)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-SDK%2052-000020?logo=expo&logoColor=white)](https://expo.dev/)
[![Firebase](https://img.shields.io/badge/Firebase-v11.0-FFCA28?logo=firebase&logoColor=black)](https://firebase.google.com/)
[![TailwindCSS](https://img.shields.io/badge/NativeWind-v4-38B2AC?logo=tailwindcss&logoColor=white)](https://www.nativewind.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tests](https://img.shields.io/badge/Tests-546%20Passed-22C55E?logo=jest&logoColor=white)](https://jestjs.io/)

**Expense Expert** is a cross-platform (Web, iOS, Android) personal finance and expense management application. It provides an offline-first architecture, zero-drift financial calculations, real-time multi-client synchronization, interactive SVG charts, custom categorization, and monthly budget tracking with 100% mathematical parity to the original Angular application.

---

## 📑 Table of Contents

- [Features](#-features)
- [Architecture & Tech Stack](#-architecture--tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Environment Variables (.env)](#environment-variables-env)
  - [Option 1: Running with Docker (Recommended)](#option-1-running-with-docker-recommended)
  - [Option 2: Running Locally](#option-2-running-locally)
- [Running Automated Tests](#-running-automated-tests)
- [Financial Calculation & Parity Logic](#-financial-calculation--parity-logic)
- [Real-time Synchronization & Offline Resilience](#-real-time-synchronization--offline-resilience)
- [Scripts Reference](#-scripts-reference)

---

## ✨ Features

### 1. 🔐 Authentication & Profile Management
- **Universal Auth:** Email/Password authentication and Google Sign-in on Web.
- **Session Persistence:** Persistent auth state across app restarts, browser refreshes, and mobile app suspension.
- **Profile Hydration:** Automatically syncs user profile data (`displayName`, `email`, `createdAt`, salary history) from Firestore `users/{uid}`.
- **Multi-Account Switching:** Complete session isolation and deterministic subscription cleanup when switching accounts.

### 2. 💸 Core Transaction Entry (Offline-First)
- **3-Step Wizard Flow:**
  1. *Amount Input:* Numeric keypad with fractional cent parsing and instant validation.
  2. *Category & Date:* Interactive category selection cards with 30-emoji palette and date presets (Today, Yesterday, Custom).
  3. *Details & Summary:* Title suggestions, notes, and live review card before saving.
- **Zero-Drift Integer-Cents Math:** Strict integer-based currency arithmetic (`toCents`, `fromCents`, `addCents`, `subtractCents`) that completely eliminates IEEE-754 floating-point rounding errors.
- **Durable Offline Queue:** Mutations created while offline are queued in `AsyncStorage` (FIFO) and automatically drain and commit idempotently with Firestore `setDoc(..., { merge: true })` upon reconnection.

### 3. 🏷️ Categorization & Multi-Criteria Filtering
- **Predefined & Custom Categories:** 7 default categories (`Food 🍔`, `Transport 🚌`, `Entertainment 🎮`, `Utilities 💡`, `Savings 💰`, `Loan Repayment 💳`, `Other 📁`) plus user-created custom categories with 30 expressive emoji choices.
- **Historical Integrity Fallback:** Deleted custom categories fall back gracefully to `📁 Unknown` in `CategoryBadge` preventing UI crashes.
- **In-Memory Filtering Engine:**
  - *Instant Search:* Case-insensitive substring matching on titles and descriptions.
  - *Date Presets:* Today, This Week, This Month, All Time, and Custom Range.
  - *Sorting:* Date (newest/oldest), Amount (highest/lowest), Title (A-Z).
  - *Grouping:* Group by Date, Group by Category (with spend subtotal), or Flat List.

### 4. 🎯 Category Budgeting & Threshold Warnings
- **Deterministic Keys:** Monthly category budgets stored as `{month}_{category}` (e.g. `2026-08_food`) to prevent duplicates and ensure idempotent updates.
- **3-Tier Visual Threshold Indicators:**
  - 🟢 **Under Budget (<80%):** Emerald status tokens and *On Track* badge.
  - 🟡 **Near Limit (80% - 99.9%):** Amber status tokens and *Near Limit (80%+)* warning.
  - 🔴 **Exceeded (≥100%):** Rose status tokens, negative remaining amount, and clamped progress bar fill.
- **Budget Summary Widget:** Real-time multi-category limit, spent, and remaining balance overview.

### 5. 📊 Dashboards & Interactive Visualizations
- **Financial Metric Cards Grid:** 5 responsive cards (Total Income with carryover breakdown, Total Expenses with transaction count, Total Savings, Net Remaining surplus/deficit, Loans Taken inflow).
- **Exact Angular Financial Parity:** Multi-month historical roll-forward from user `createdAt`, resolving salary step progression, additional income, loans taken, and savings deduplication (`totalSavings - savingsInExpenses`).
- **Interactive Hardware-Accelerated SVG Charts:**
  - *Category Donut Chart:* Trigonometric SVG arc slices with tap-to-focus selection, center percentage readout, and color legend.
  - *Monthly Trend Bar Chart:* 6-month dual-series comparison (Expenses vs. Savings) with gridlines, currency ticks, and tap tooltip.
- **Month Navigator:** Seamless temporal navigation (`‹` / `›`), calendar rollover handling, and quick *Current Month* reset.

### 6. 🔄 Real-time Synchronization & App Stability
- **`RealtimeSyncManager`:** Centralized listener pooling with reference counting and duplicate subscription suppression.
- **Deterministic Teardown:** Automatic Firestore listener unsubscription on component unmount and `AuthProvider.logout`.
- **Global Error Boundary:** Accessible fallback UI catching render crashes with stack details and "Try Again" recovery.
- **Toast Feedback System:** Non-intrusive toast notifications (Success, Error, Warning, Info) with queue management and auto-dismissal.
- **Connection Status Overlay:** Real-time banner displaying offline alerts, pending mutation counter, sync spinner, and manual "Sync Now" trigger.

---

## 🏗️ Architecture & Tech Stack

| Layer | Technologies | Purpose |
|---|---|---|
| **Framework** | Expo SDK 52 / React Native 0.76 (New Architecture) | Cross-platform core targeting Web, iOS, Android |
| **Routing** | Expo Router v4 | Universal file-based navigation with deep linking |
| **Backend & Auth** | Firebase JS SDK v11 (Firestore + Auth) | Cloud authentication, document store, real-time data sync |
| **Styling** | NativeWind v4 (Tailwind CSS) | Responsive styling using utility classes across web & mobile |
| **Visualizations**| `react-native-svg` | Universal vector graphics for charts without canvas overhead |
| **Local Storage** | `@react-native-async-storage/async-storage` | Offline mutation queues and category/budget caching |
| **Network** | `@react-native-community/netinfo` | Network connectivity listeners and auto-sync triggers |
| **Date Library** | `date-fns` v4 | Light, immutable date arithmetic and formatting |
| **Testing** | Jest + `@testing-library/react-native` | Behavior-driven unit, component, and simulation testing |

---

## 📁 Project Structure

```text
expense-expert/
├── Dockerfile                        # Node 20 slim container definition
├── docker-compose.yml                # Docker Compose dev environment configuration
├── package.json                      # Project dependencies & scripts
├── tsconfig.json                     # TypeScript strict configuration
├── tailwind.config.js                # NativeWind Tailwind configuration
├── app/                              # Expo Router File-Based Navigation
│   ├── _layout.tsx                   # Root layout (ErrorBoundary, AuthProvider, ToastProvider)
│   ├── index.tsx                     # Entry redirect / landing
│   ├── (auth)/                       # Authentication Route Group
│   │   ├── _layout.tsx
│   │   ├── login.tsx                 # Login screen
│   │   └── register.tsx              # Register screen
│   └── (app)/                        # Authenticated App Route Group
│       ├── _layout.tsx               # App stack with Providers (Expense, Category, Budget, Dashboard)
│       ├── index.tsx                 # Responsive Financial Dashboard
│       ├── expenses/
│       │   ├── new.tsx               # 3-step expense creation wizard
│       │   └── [id].tsx              # Expense detail & edit screen
│       ├── budgets/
│       │   └── index.tsx             # Monthly category budget manager
│       └── categories/
│           └── index.tsx             # Custom category manager
└── src/
    ├── config/                       # Firebase client configuration
    ├── core/                         # Universal core infrastructure
    │   ├── components/               # ErrorBoundary, ConnectionStatusBanner
    │   ├── feedback/                 # ToastContext, ToastProvider, useToast
    │   └── sync/                     # RealtimeSyncManager, useFirestoreSubscription
    └── features/                     # Domain modules
        ├── auth/                     # AuthService, AuthContext, LoginForm, RegisterForm
        ├── expenses/                 # ExpenseService, currency.util, filter.util, ExpenseForm
        ├── categories/               # CategoryService, CategoryBadge, CategoryIconPicker
        ├── budgets/                  # BudgetService, budget.util, BudgetProgressBar, BudgetModal
        └── dashboard/                # DashboardService, aggregation.util, Donut/Bar Charts
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: `v20.x` or higher
- **npm**: `v10.x` or higher
- **Docker & Docker Compose** (Optional, for containerized execution)

---

### Environment Variables (`.env`)

Create a `.env` file inside `expense-expert-rn/` (or copy from `.env.example`):

```bash
EXPO_PUBLIC_FIREBASE_API_KEY="your-api-key"
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com"
EXPO_PUBLIC_FIREBASE_PROJECT_ID="your-project-id"
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET="your-project.appspot.com"
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="your-sender-id"
EXPO_PUBLIC_FIREBASE_APP_ID="your-app-id"
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID="your-measurement-id"
```

---

### Option 1: Running with Docker (Recommended)

To run the application inside an isolated Docker container while testing from your local machine:

```bash
# Navigate to the React Native project directory
cd expense-expert-rn

# Build and start the container
docker compose up --build
```

- **Web Application:** Open [http://localhost:8081](http://localhost:8081) in your browser.
- **Metro Bundler Dev Server:** Accessible at [http://localhost:8081](http://localhost:8081).
- **Mobile Live Preview:** Scan the QR code displayed in the terminal with the **Expo Go** app on iOS or Android (ensure your device is on the same local network).

To stop the container:
```bash
docker compose down
```

---

### Option 2: Running Locally

```bash
# 1. Navigate to the project directory
cd expense-expert-rn

# 2. Install dependencies
npm install

# 3. Start Expo development server (Interactive CLI)
npm run start

# 4. Start directly in Web browser
npm run web

# 5. Start on Android Emulator
npm run android

# 6. Start on iOS Simulator (macOS only)
npm run ios
```

---

## 🧪 Running Automated Tests

Expense Expert features a comprehensive automated test suite spanning unit tests, component tests, route navigation tests, and multi-module dummy-data simulations.

```bash
# Run full Jest test suite (546 tests across 65 suites)
npm test

# Run specific feature tests
npm test -- __tests__/features/auth/
npm test -- __tests__/features/expenses/
npm test -- __tests__/features/categories/
npm test -- __tests__/features/budgets/
npm test -- __tests__/features/dashboard/
npm test -- __tests__/features/sync/

# Run end-to-end multi-module simulation suites
npm test -- __tests__/integration/

# Run TypeScript strict typecheck
npm run typecheck

# Verify static production web export
npm run build:web
```

---

## 🧮 Financial Calculation & Parity Logic

All financial math is executed in **integer cents** to prevent binary floating point rounding inaccuracies:

```typescript
// Currency Math Utilities (src/features/expenses/utils/currency.util.ts)
toCents("19.99")    // => 1999
fromCents(1999)     // => "19.99"
formatCents(1999)   // => "$19.99"
addCents(1999, 100) // => 2099
```

### Dashboard Roll-Forward Formula (Angular Parity)
```text
Total Income = Current Month Income + Previous Month Remaining
Where:
- Current Month Income = Salary (for month) + Additional Income + Loans Taken Inflow
- Net Savings Deduction = Total Savings - Savings in Expenses (savingsInExpenses)
- Net Remaining = Total Income - Total Expenses - Net Savings Deduction
- Previous Month Remaining = Compounded accumulation of all historical months from user createdAt.
```

---

## 📜 Scripts Reference

| Script | Command | Description |
|---|---|---|
| `start` | `expo start` | Starts the interactive Metro development server |
| `web` | `expo start --web` | Starts Metro and opens the app in your default browser |
| `android` | `expo start --android` | Boots Metro and connects to an active Android device / emulator |
| `ios` | `expo start --ios` | Boots Metro and connects to an active iOS Simulator |
| `build:web` | `expo export --platform web` | Builds production-optimized static web bundle into `dist/` |
| `test` | `jest --watchAll=false` | Executes the complete test suite |
| `typecheck` | `tsc --noEmit` | Runs strict TypeScript validation across the codebase |

---

## 📄 License

This project is licensed under the MIT License.
