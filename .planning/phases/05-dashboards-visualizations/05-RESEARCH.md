# Phase 5: Dashboards & Visualizations - Research

**Researched:** 2026-08-23
**Domain:** Cross-Platform Financial Analytics, Responsive Metric Cards, Universal SVG Data Visualizations (Donut & Trend Bar Charts), and Workflow Shortcuts (React Native Web & Mobile, Cloud Firestore)
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

No user constraints - all decisions at the agent's discretion.

### Locked Decisions
- **Financial Health Summary Metrics (DASH-01):**
  - Present an unambiguous, real-time overview of monthly financial health: Total Income, Total Expenses, Net Remaining, Total Savings, and Loans Taken.
  - All aggregation logic must execute strictly in integer cents (`totalIncomeInCents`, `totalExpensesInCents`, `remainingInCents`, `totalSavingsInCents`, `loansTakenIncomeInCents`) via `currency.util.ts` without floating-point math drift.
  - Total Income must account for:
    1. Base salary for the active month (resolving history from `users/{uid}` `salaries[month]` or fallback `monthlySalary`).
    2. Additional income entries for the month from `users/{uid}/income-entries`.
    3. Loans taken in the active month from `users/{uid}/loans-taken` (borrowed cash counted as available inflow).
    4. Cumulative past remaining balance carried over from user registration (`createdAt`) up to the preceding month.
  - Net Remaining calculation must exactly match the Angular formula:
    `remaining = totalIncome - totalExpenses - (totalSavings - savingsInExpenses)` where `savingsInExpenses` accounts for expenses categorized as `savings` to avoid double-counting.
- **Interactive Visualizations (DASH-02):**
  - **Category Spending Donut / Pie Chart:** Visual breakdown of expenses by category for the selected month, displaying percentage share, category color badges, center summary text, and interactive slice selection with legend.
  - **Monthly Spending Trend Bar Chart:** Multi-month historical comparison (default 6 months) contrasting Total Expenses vs. Total Savings side-by-side with formatted axis ticks and interactive value tooltips.
  - Charts must be universally renderable across iOS, Android, and React Native Web using cross-platform SVG primitives (`react-native-svg` / pure SVG math).
- **Responsive Layout & Workflow Shortcuts (DASH-03):**
  - Desktop web viewports must adapt responsively (`max-w-6xl` / `max-w-7xl` container, 4-column metric card grid, 2-column chart row), eliminating bloated mobile-only layouts.
  - Mobile viewports provide vertical stacking, touch-optimized hit targets, and horizontal scroll indicators.
  - Dedicated action shortcuts allow instant navigation: Quick Add Expense (`/expenses/new`), Manage Categories (`/categories`), Manage Budgets (`/budgets`), and Month Switcher.
- **Testing & Quality Assurance:**
  - Automated unit tests covering aggregation utilities, past balance carryover math, SVG path trigonometry, metric card rendering, and full dashboard screen integration.

### The Agent's Discretion
- **SVG Chart Implementation:** Pure declarative SVG components using `react-native-svg` with mathematical arc calculations (`d="M ... A ..."` or stroke-dasharray technique) and normalized bar geometry for maximum performance and zero external heavy charting dependencies.
- **Month Navigation UI:** Clean month picker header with Previous (`<`), Next (`>`), and "Current Month" quick-jump button, displaying localized month titles (e.g., "August 2026").
- **Card Interactive States:** Metric cards feature subtle hover/press feedback and deep-link shortcuts (clicking "Total Expenses" opens the filtered expense list, clicking "Total Savings" routes to savings details, clicking "Total Income" opens profile/income management).

### Deferred Ideas (OUT OF SCOPE)
- **Yearly / Multi-Year Heatmaps & Sankey Diagrams:** Deferred to v2 (ADV analytics).
- **Automated AI Financial Insights & Anomaly Detection:** Natural language spending observations — Deferred to v2 (ADV-04).
- **Direct PDF / CSV Export from Dashboard:** Bulk export reports — Handled in Phase 6 (Reporting Features).
- **Multi-Currency FX Real-Time Conversion:** Multi-currency wallets — Deferred to v2 (ADV-02).
</user_constraints>

<architectural_responsibility_map>
## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Monthly Summary & Trend Aggregation | Domain Utilities (`aggregation.util.ts`) | Data Access (`DashboardService`) | Pure integer-cents arithmetic computes current income, past carryover, total expenses, net remaining, and 6-month trends without Firestore write overhead. |
| Cross-Platform Metric Cards | UI Component Layer (`SummaryCard`, `SummaryCardsGrid`) | Presentation Tier (`useDashboard`) | Renders color-coded, accessible summary metrics with responsive grid breakpoints (1 col mobile, 2 col tablet, 4 col desktop). |
| Universal SVG Visualizations | Visualization Primitives (`CategoryDonutChart`, `MonthlyTrendBarChart`) | Pure Math Trigonometry (`svg-chart.util.ts`) | Declarative SVG vector components render interactive donut and dual-bar charts consistently on iOS, Android, and Web without canvas runtime mismatches. |
| Dashboard State & Real-Time Sync | Custom Hook (`useDashboard`) / Context | Firestore Listener (`users/{uid}/*`) | Manages reactive state for active month, loading/error states, and coordinates multi-collection queries across expenses, income, savings, and loans. |
| Action Shortcuts & Month Switcher | Navigation & Controls (`MonthNavigator`, `ActionShortcuts`) | Expo Router (`expo-router`) | Provides immediate UI triggers for primary expense entry workflows and temporal navigation. |
</architectural_responsibility_map>

<research_summary>
## Summary

Phase 5 delivers the central analytics hub of Expense Expert: the **Dashboards & Visualizations** module. It translates raw transaction, savings, loan, and income records into actionable financial intelligence through responsive metric cards, interactive category donut charts, and 6-month historical trend bar charts.

The technical design achieves full logic parity with the Angular application while optimizing for React Native's cross-platform runtime:
1. **Zero-Drift Financial Aggregation Engine:** The Angular `DashboardService` logic is reimagined into high-performance, pure TypeScript utilities (`aggregation.util.ts`). All monetary calculations (current month salary + additional income + loans taken + cumulative past remaining - expenses - net savings) operate strictly in integer cents (`toCents`, `fromCents`, `addCents`, `subtractCents`), guaranteeing zero IEEE 754 precision drift.
2. **Universal Lightweight SVG Visualization Components:** Rather than pulling in heavyweight, fragile native chart frameworks (like `victory-native` or `react-native-chart-kit` which suffer from web/mobile styling disparities and layout shifts), Phase 5 implements modular, pure SVG chart components powered by `react-native-svg`. A custom trigonometric generator builds smooth donut slices with slice highlight tooltips and dual-column expense/savings bar charts with exact Y-axis grid scaling.
3. **Adaptive Desktop & Mobile Layout Architecture:** Leveraging NativeWind's responsive grid classes (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`) and container queries (`max-w-6xl`), the dashboard renders an expansive desktop command center on web browsers while providing a streamlined, thumb-friendly vertical dashboard on mobile screens.

**Primary recommendation:** Build `DashboardService` and pure `aggregation.util.ts` for integer-safe financial summaries and past balance carryover, implement declarative SVG chart components with `react-native-svg`, and assemble the responsive `/dashboard` screen with `SummaryCardsGrid`, `CategoryDonutChart`, `MonthlyTrendBarChart`, and `MonthNavigator`.
</research_summary>

<standard_stack>
## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `react-native-svg` | ^15.8.0 | Universal Vector Graphics | Official Expo SDK 52 vector graphics engine. Renders native SVG elements on React Native Web and hardware-accelerated CoreGraphics/Canvas on iOS/Android with zero web/mobile divergence. |
| `firebase/firestore` | ^11.0.0 | Cloud Firestore SDK | Queries `users/{uid}/expenses`, `users/{uid}/saving-entries`, `users/{uid}/income-entries`, and `users/{uid}/loans-taken` with `where('month', '<=', month)` range filters. |
| `date-fns` | ^4.1.0 | Date Manipulation & Formatting | Handles month formatting (`yyyy-MM`), month math (`subMonths`, `addMonths`, `format`), and localized month name strings. |
| `nativewind` | ^4.1.23 | Responsive Styling | Provides utility classes for responsive grids (`sm:`, `md:`, `lg:` breakpoints), dark mode support, and theme-consistent metric colors. |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@react-native-async-storage/async-storage` | 1.23.1 | Offline Cache Persistence | Caches aggregated monthly summaries and trend data for instant hydration when offline. |
| `expo-router` | ~4.0.0 | Routing & Deep Linking | Enables navigation between `/dashboard`, `/expenses/new`, `/categories`, and `/budgets`. |
| `react-native-safe-area-context` | 4.12.0 | Safe Area Insets | Protects dashboard headers and bottom padding on mobile devices. |

### Development & Testing
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `jest` | ^29.7.0 | Unit Test Runner | Testing aggregation math, past balance carryover calculations, and SVG path coordinate generators. |
| `jest-expo` | ~52.0.0 | React Native Test Environment | Provides mocked React Native and SVG primitives for fast, headless unit tests. |
| `@testing-library/react-native` | ^13.0.0 | Component Testing | Validates user interactions, month changes, metric card displays, and chart tooltip selections. |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `react-native-svg` custom charts | `victory-native` / `react-native-gifted-charts` | Prebuilt chart libraries add 500KB+ bundle weight, often have buggy React Native Web layout support, and make custom financial tooltips/styling difficult to match with Tailwind/NativeWind. Pure SVG charts give 100% control, zero layout bugs, and perfect cross-platform parity. |
| Client-Side Aggregation (`aggregation.util.ts`) | Cloud Functions precomputed summaries | For small-to-medium datasets (<10,000 transactions per user), client-side aggregation over cached monthly partitions is instantaneous, supports full offline usage, and requires zero cloud compute billing. |

**Installation:**
```bash
npx expo install react-native-svg
```
*(All other dependencies: `firebase`, `date-fns`, `nativewind`, `@react-native-async-storage/async-storage` are already installed in `expense-expert-rn`)*
</standard_stack>

<architecture_patterns>
## Architecture Patterns

### System Architecture Diagram

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              Presentation Tier (UI)                                    │
│                                                                                        │
│   app/(app)/index.tsx  /  app/(app)/dashboard.tsx                                      │
│   ├── [ MonthNavigator ] ── (Select activeMonth "YYYY-MM")                             │
│   ├── [ ActionShortcuts ] ── (Add Expense, Categories, Budgets)                       │
│   ├── [ SummaryCardsGrid ]                                                             │
│   │   ├── Total Income Card (Salary + Additional + Loans + Past Carryover)             │
│   │   ├── Total Expenses Card (Amount + Transaction Count)                             │
│   │   ├── Net Remaining Card (Positive = Green, Negative = Red)                        │
│   │   ├── Total Savings Card (Deposits - Withdrawals)                                  │
│   │   └── Loans Taken Card (Monthly Borrowed Funds)                                    │
│   ├── [ Visualizations Row (Desktop 2-Col / Mobile Stack) ]                            │
│   │   ├── [ CategoryDonutChart ] ── (Category share, colors, center label, legend)     │
│   │   └── [ MonthlyTrendBarChart ] ── (6-Month Expenses vs Savings dual bars, tooltip) │
│   └── [ Quick Navigation & Budget Overview ]                                           │
└───────────────────────────────────────┬────────────────────────────────────────────────┘
                                        │
                                        ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        Dashboard Hook & State Coordination                             │
│                                                                                        │
│   [ useDashboard(activeMonth) ]                                                        │
│   - Orchestrates multi-collection queries                                              │
│   - Manages loading, refreshing, error, and cached state                               │
│   - Delegates calculations to pure domain aggregation utilities                        │
└───────────────────────────────────────┬────────────────────────────────────────────────┘
                                        │
                                        ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                          Pure Financial Aggregation Engine                             │
│                                                                                        │
│   [ aggregation.util.ts ]                                                              │
│   ├── computeMonthSummary(...)          ── Integer-cents monthly balance arithmetic    │
│   ├── computePastRemainingCarryover(...) ── Historical monthly net roll-forward        │
│   ├── computeCategoryBreakdown(...)      ── Category totals, counts & percentage share  │
│   ├── computeMonthlyTrend(...)          ── 6-month historical expense/savings points   │
│   └── resolveMonthSalary(...)           ── Profile salary lookup with historical steps │
└───────────────────────────────────────┬────────────────────────────────────────────────┘
                                        │
                                        ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              Data Access & Services                                    │
│                                                                                        │
│   [ DashboardService ]                                                                 │
│   ├── getMonthSummary(userId, month)                                                   │
│   ├── getMonthlyTrend(userId, monthsCount)                                             │
│   └── getCategoryBreakdown(userId, month)                                              │
│                                                                                        │
│   [ Cloud Firestore Queries ]                                                          │
│   ├── users/{uid}/expenses        (where month <= activeMonth)                         │
│   ├── users/{uid}/saving-entries  (where month <= activeMonth)                         │
│   ├── users/{uid}/income-entries  (where month <= activeMonth)                         │
│   ├── users/{uid}/loans-taken     (where month <= activeMonth)                         │
│   └── users/{uid}                 (user profile: monthlySalary, salaries map, createdAt│
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### Recommended Project Structure

```
expense-expert-rn/
├── src/
│   ├── features/
│   │   ├── dashboard/                               # Dashboard feature module
│   │   │   ├── components/
│   │   │   │   ├── SummaryCard.tsx                  # Single metric card with title, amount, subtext, badge
│   │   │   │   ├── SummaryCardsGrid.tsx             # Responsive grid (1 col mobile, 2 col sm, 4-5 col lg)
│   │   │   │   ├── CategoryDonutChart.tsx           # Universal SVG Donut chart with category colors & legend
│   │   │   │   ├── MonthlyTrendBarChart.tsx         # Universal SVG 6-month Bar chart (Expenses vs Savings)
│   │   │   │   ├── MonthNavigator.tsx               # Month switcher (< Previous, Month Title, Next >)
│   │   │   │   └── ActionShortcuts.tsx              # Quick action buttons (+ Expense, Categories, Budgets)
│   │   │   ├── hooks/
│   │   │   │   └── useDashboard.ts                  # React hook managing dashboard data fetching & state
│   │   │   ├── services/
│   │   │   │   └── dashboard.service.ts             # Firestore query integration & offline caching
│   │   │   ├── types/
│   │   │   │   └── dashboard.types.ts               # MonthSummary, MonthlyTrend, CategoryBreakdown, ChartSlice
│   │   │   └── utils/
│   │   │       ├── aggregation.util.ts              # Pure integer-cents calculation functions
│   │   │       └── svg-chart.util.ts                # SVG arc path trigonometry & bar scaling helpers
│   │   ├── expenses/                                # Transaction domain (Phase 3)
│   │   ├── categories/                              # Category domain (Phase 4)
│   │   └── budgets/                                 # Budget domain (Phase 4)
│   └── components/
│       └── ui/                                      # Reusable primitives
└── __tests__/
    ├── features/
    │   └── dashboard/
    │       ├── aggregation.util.test.ts             # Math tests for summary, carryover, trends, breakdowns
    │       ├── svg-chart.util.test.ts               # Coordinate & arc path geometry tests
    │       ├── dashboard.service.test.ts            # Firestore fetching & cache fallback tests
    │       ├── SummaryCard.test.tsx                 # Metric card rendering & color threshold tests
    │       ├── SummaryCardsGrid.test.tsx            # Responsive grid rendering tests
    │       ├── CategoryDonutChart.test.tsx          # SVG Donut rendering, legend & slice select tests
    │       ├── MonthlyTrendBarChart.test.tsx        # SVG Bar chart dual series & tooltip tests
    │       ├── MonthNavigator.test.tsx              # Month switcher step tests
    │       └── useDashboard.test.ts                 # Hook state lifecycle tests
    └── routes/
        └── dashboard-screen.test.tsx                # End-to-end screen integration test
```

### Pattern 1: Exact Financial Aggregation Formula (Integer Cents)

**What:** Pure mathematical function taking user profile, raw expenses, saving entries, additional income entries, and loans taken up to `activeMonth`, computing the comprehensive `MonthSummary`.
**When to use:** In `src/features/dashboard/utils/aggregation.util.ts`.
**Implementation Example:**

```typescript
// src/features/dashboard/utils/aggregation.util.ts
import { toCents, fromCents, addCents, subtractCents } from '../../expenses/utils/currency.util';
import { MonthSummary, CategoryBreakdown, MonthlyTrend } from '../types/dashboard.types';

export interface RawFinancialData {
  month: string;
  profile: {
    monthlySalary?: number;
    salaries?: Record<string, number>;
    createdAt?: string | Date;
  } | null;
  expenses: Array<{
    amount?: number;
    amountInCents?: number;
    category: string;
    month: string;
  }>;
  savingEntries: Array<{
    amount?: number;
    amountInCents?: number;
    type: 'deposit' | 'withdrawal';
    month: string;
  }>;
  incomeEntries: Array<{
    amount?: number;
    amountInCents?: number;
    month: string;
  }>;
  loansTaken: Array<{
    amount?: number;
    amountInCents?: number;
    month: string;
  }>;
}

/**
 * Resolves salary in integer cents for a specific month based on salary history map.
 */
export function resolveSalaryInCents(
  profile: RawFinancialData['profile'],
  targetMonth: string
): number {
  if (!profile) return 0;
  if (profile.salaries && profile.salaries[targetMonth] !== undefined) {
    return toCents(profile.salaries[targetMonth]);
  }
  if (profile.salaries) {
    const pastMonths = Object.keys(profile.salaries).sort();
    if (pastMonths.length > 0) {
      const monthsBefore = pastMonths.filter((m) => m < targetMonth);
      if (monthsBefore.length > 0) {
        const closest = monthsBefore[monthsBefore.length - 1];
        return toCents(profile.salaries[closest]);
      }
      return toCents(profile.salaries[pastMonths[0]]);
    }
  }
  return toCents(profile.monthlySalary ?? 0);
}

/**
 * Computes all months between startDate and targetMonth (exclusive of targetMonth).
 */
export function getMonthsBetween(startDate: Date, endMonthStr: string): string[] {
  const months: string[] = [];
  const startYear = startDate.getFullYear();
  const startMonth = startDate.getMonth();

  const [endYearStr, endMonthNumStr] = endMonthStr.split('-');
  const endYear = parseInt(endYearStr, 10);
  const endMonth = parseInt(endMonthNumStr, 10) - 1;

  let currentYear = startYear;
  let currentMonth = startMonth;

  while (currentYear < endYear || (currentYear === endYear && currentMonth < endMonth)) {
    months.push(`${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`);
    currentMonth++;
    if (currentMonth > 11) {
      currentMonth = 0;
      currentYear++;
    }
  }

  return months;
}

/**
 * Computes the complete MonthSummary using zero-drift integer cents math.
 */
export function computeMonthSummary(data: RawFinancialData): MonthSummary {
  const { month, profile, expenses, savingEntries, incomeEntries, loansTaken } = data;

  // 1. Current month subsets
  const curExpenses = expenses.filter((e) => e.month === month);
  const curSavings = savingEntries.filter((s) => s.month === month);
  const curIncome = incomeEntries.filter((i) => i.month === month);
  const curLoans = loansTaken.filter((l) => l.month === month);

  // 2. Current month aggregations in cents
  const totalExpensesInCents = curExpenses.reduce(
    (sum, e) => addCents(sum, e.amountInCents ?? toCents(e.amount)),
    0
  );

  const totalSavingsInCents = curSavings.reduce((sum, s) => {
    const val = s.amountInCents ?? toCents(s.amount);
    return s.type === 'deposit' ? addCents(sum, val) : subtractCents(sum, val);
  }, 0);

  // Expenses categorized as "savings" (case-insensitive check)
  const savingsInExpensesInCents = curExpenses
    .filter((e) => e.category?.toLowerCase() === 'savings')
    .reduce((sum, e) => addCents(sum, e.amountInCents ?? toCents(e.amount)), 0);

  const salaryInCents = resolveSalaryInCents(profile, month);
  const additionalIncomeInCents = curIncome.reduce(
    (sum, i) => addCents(sum, i.amountInCents ?? toCents(i.amount)),
    0
  );
  const loansTakenIncomeInCents = curLoans.reduce(
    (sum, l) => addCents(sum, l.amountInCents ?? toCents(l.amount)),
    0
  );

  const currentMonthIncomeInCents = addCents(
    addCents(salaryInCents, additionalIncomeInCents),
    loansTakenIncomeInCents
  );

  // 3. Historical carryover calculation (previousMonthRemaining)
  let previousMonthRemainingInCents = 0;
  if (profile?.createdAt) {
    const createdDate =
      typeof profile.createdAt === 'string' ? new Date(profile.createdAt) : profile.createdAt;
    const pastMonths = getMonthsBetween(createdDate, month);

    for (const pastMonth of pastMonths) {
      const pExpenses = expenses.filter((e) => e.month === pastMonth);
      const pSavings = savingEntries.filter((s) => s.month === pastMonth);
      const pIncome = incomeEntries.filter((i) => i.month === pastMonth);
      const pLoans = loansTaken.filter((l) => l.month === pastMonth);

      const pTotalExpenses = pExpenses.reduce(
        (sum, e) => addCents(sum, e.amountInCents ?? toCents(e.amount)),
        0
      );
      const pTotalSavings = pSavings.reduce((sum, s) => {
        const val = s.amountInCents ?? toCents(s.amount);
        return s.type === 'deposit' ? addCents(sum, val) : subtractCents(sum, val);
      }, 0);
      const pSavingsInExpenses = pExpenses
        .filter((e) => e.category?.toLowerCase() === 'savings')
        .reduce((sum, e) => addCents(sum, e.amountInCents ?? toCents(e.amount)), 0);

      const pSalary = resolveSalaryInCents(profile, pastMonth);
      const pAdditional = pIncome.reduce(
        (sum, i) => addCents(sum, i.amountInCents ?? toCents(i.amount)),
        0
      );
      const pLoansIncome = pLoans.reduce(
        (sum, l) => addCents(sum, l.amountInCents ?? toCents(l.amount)),
        0
      );

      const pTotalIncome = addCents(addCents(pSalary, pAdditional), pLoansIncome);
      const pNetSavingsDeduction = subtractCents(pTotalSavings, pSavingsInExpenses);
      const pNetRemaining = subtractCents(
        subtractCents(pTotalIncome, pTotalExpenses),
        pNetSavingsDeduction
      );

      previousMonthRemainingInCents = addCents(previousMonthRemainingInCents, pNetRemaining);
    }
  }

  // 4. Final totals
  const totalIncomeInCents = addCents(currentMonthIncomeInCents, previousMonthRemainingInCents);
  const netSavingsDeductionInCents = subtractCents(totalSavingsInCents, savingsInExpensesInCents);
  const remainingInCents = subtractCents(
    subtractCents(totalIncomeInCents, totalExpensesInCents),
    netSavingsDeductionInCents
  );

  return {
    month,
    totalIncomeInCents,
    totalIncome: fromCents(totalIncomeInCents),
    currentMonthIncomeInCents,
    currentMonthIncome: fromCents(currentMonthIncomeInCents),
    previousMonthRemainingInCents,
    previousMonthRemaining: fromCents(previousMonthRemainingInCents),
    totalExpensesInCents,
    totalExpenses: fromCents(totalExpensesInCents),
    totalSavingsInCents,
    totalSavings: fromCents(totalSavingsInCents),
    remainingInCents,
    remaining: fromCents(remainingInCents),
    loansTakenIncomeInCents,
    loansTakenIncome: fromCents(loansTakenIncomeInCents),
    expenseCount: curExpenses.length,
  };
}
```

### Pattern 2: Pure SVG Arc Geometry for Donut/Pie Charts

**What:** Mathematical utility generating SVG Path strings for donut/pie slices without any heavy third-party canvas or chart libraries.
**When to use:** In `src/features/dashboard/utils/svg-chart.util.ts`.
**Implementation Example:**

```typescript
// src/features/dashboard/utils/svg-chart.util.ts

export interface SvgPieSlice {
  id: string;
  label: string;
  valueInCents: number;
  percentage: number;
  color: string;
  pathData: string;
  startAngle: number;
  endAngle: number;
  midAngle: number;
}

/**
 * Converts polar coordinates (radius, angleInDegrees) to cartesian coordinates (x, y).
 */
export function polarToCartesian(
  centerX: number,
  centerY: number,
  radius: number,
  angleInDegrees: number
): { x: number; y: number } {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
}

/**
 * Generates an SVG path `d` string for a donut slice (annulus segment).
 */
export function createDonutSlicePath(
  centerX: number,
  centerY: number,
  outerRadius: number,
  innerRadius: number,
  startAngle: number,
  endAngle: number
): string {
  // Prevent complete overlap bug on full 360 degree slice
  const safeEndAngle = endAngle - startAngle >= 360 ? startAngle + 359.999 : endAngle;
  
  const outerStart = polarToCartesian(centerX, centerY, outerRadius, startAngle);
  const outerEnd = polarToCartesian(centerX, centerY, outerRadius, safeEndAngle);
  const innerStart = polarToCartesian(centerX, centerY, innerRadius, safeEndAngle);
  const innerEnd = polarToCartesian(centerX, centerY, innerRadius, startAngle);

  const largeArcFlag = safeEndAngle - startAngle <= 180 ? '0' : '1';

  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerStart.x} ${innerStart.y}`,
    `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${innerEnd.x} ${innerEnd.y}`,
    'Z',
  ].join(' ');
}

/**
 * Generates an array of prepared SVG slice paths from categorized totals.
 */
export function generateDonutSlices(
  items: Array<{ id: string; label: string; valueInCents: number; color: string }>,
  size: number = 200,
  strokeWidth: number = 28
): SvgPieSlice[] {
  const totalInCents = items.reduce((sum, i) => sum + i.valueInCents, 0);
  if (totalInCents <= 0) return [];

  const centerX = size / 2;
  const centerY = size / 2;
  const outerRadius = size / 2 - 4; // Padding for touch stroke
  const innerRadius = outerRadius - strokeWidth;

  let currentAngle = 0;

  return items.map((item) => {
    const sliceAngle = (item.valueInCents / totalInCents) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + sliceAngle;
    const midAngle = startAngle + sliceAngle / 2;
    currentAngle += sliceAngle;

    const pathData = createDonutSlicePath(
      centerX,
      centerY,
      outerRadius,
      innerRadius,
      startAngle,
      endAngle
    );

    const percentage = Math.round((item.valueInCents / totalInCents) * 1000) / 10; // 1 decimal place

    return {
      id: item.id,
      label: item.label,
      valueInCents: item.valueInCents,
      percentage,
      color: item.color,
      pathData,
      startAngle,
      endAngle,
      midAngle,
    };
  });
}
```

### Pattern 3: Responsive Multi-Column Layout Architecture

**What:** Responsive desktop and mobile layout container adapting grid columns dynamically without duplicate DOM elements.
**When to use:** In `src/features/dashboard/components/SummaryCardsGrid.tsx` and `app/(app)/index.tsx`.
**Implementation Example:**

```tsx
// src/features/dashboard/components/SummaryCardsGrid.tsx
import React from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { SummaryCard } from './SummaryCard';
import { MonthSummary } from '../types/dashboard.types';
import { formatCents } from '../../expenses/utils/currency.util';

interface SummaryCardsGridProps {
  summary: MonthSummary;
}

export const SummaryCardsGrid: React.FC<SummaryCardsGridProps> = ({ summary }) => {
  const router = useRouter();

  return (
    <View className="w-full flex-row flex-wrap -mx-2 mb-6" testID="summary-cards-grid">
      {/* 1. Total Income Card */}
      <View className="w-full sm:w-1/2 lg:w-1/4 p-2">
        <SummaryCard
          testID="summary-card-income"
          title="Total Income"
          amountFormatted={formatCents(summary.totalIncomeInCents)}
          type="income"
          icon="💰"
          subtext={
            summary.previousMonthRemainingInCents !== 0
              ? `Includes ${formatCents(summary.previousMonthRemainingInCents)} past balance`
              : 'Current month earnings'
          }
          onPress={() => router.push('/profile')}
        />
      </View>

      {/* 2. Total Expenses Card */}
      <View className="w-full sm:w-1/2 lg:w-1/4 p-2">
        <SummaryCard
          testID="summary-card-expenses"
          title="Total Expenses"
          amountFormatted={formatCents(summary.totalExpensesInCents)}
          type="expense"
          icon="💳"
          subtext={`${summary.expenseCount} ${summary.expenseCount === 1 ? 'transaction' : 'transactions'}`}
          onPress={() => router.push('/expenses')}
        />
      </View>

      {/* 3. Total Savings Card */}
      <View className="w-full sm:w-1/2 lg:w-1/4 p-2">
        <SummaryCard
          testID="summary-card-savings"
          title="Total Savings"
          amountFormatted={formatCents(summary.totalSavingsInCents)}
          type="income"
          icon="🏦"
          subtext="Net deposits this month"
          onPress={() => router.push('/savings')}
        />
      </View>

      {/* 4. Net Remaining Card */}
      <View className="w-full sm:w-1/2 lg:w-1/4 p-2">
        <SummaryCard
          testID="summary-card-remaining"
          title="Net Remaining"
          amountFormatted={formatCents(Math.abs(summary.remainingInCents))}
          isNegative={summary.remainingInCents < 0}
          type={summary.remainingInCents >= 0 ? 'income' : 'expense'}
          icon={summary.remainingInCents >= 0 ? '✨' : '⚠️'}
          subtext={summary.remainingInCents >= 0 ? 'Surplus balance' : 'Deficit this month'}
        />
      </View>
    </View>
  );
};
```

### Anti-Patterns to Avoid

- **Direct IEEE 754 Floating-Point Additions:** Calculating `totalIncome - totalExpenses` directly on floats causes arithmetic drift (e.g. `$0.30000000000000004`). All calculations must use integer cents.
- **Heavy React Native Chart Libraries with Native Binary Dependencies:** Importing legacy chart kits that require CocoaPods or native Gradle linking breaks Expo Web compatibility and causes Hermes crashes. Stick to `react-native-svg`.
- **Querying Firestore History Unconditionally:** Querying the entire user transaction collection across all years to render a single month summary creates heavy Firestore read costs. Use `where('month', '<=', month)` or partition-scoped queries with local memory filtering.
- **Unbounded SVG Pie Arcs (360° Zero-length Bug):** In SVG arc geometry (`A rx ry x-axis-rotation large-arc-flag sweep-flag x y`), when start angle equals end angle (100% single category), `outerStart` equals `outerEnd`, causing SVG engines to draw an invisible 0-length arc. Always clamp single full slices to `359.999°` or render a `<Circle>` / `<Path>` stroke.
- **Fixed Pixel Widths on Dashboard Containers:** Hardcoding `width: 380` prevents the web layout from expanding on wide desktop displays (`1080p`/`1440p`), while hardcoding `width: 1200` causes horizontal overflow on mobile screens. Always use responsive flex classes: `w-full max-w-6xl mx-auto px-4`.
</architecture_patterns>

<dont_hand_roll>
## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Cross-Platform Vector Graphics | Native HTML Canvas or Skia C++ bindings | `react-native-svg` | Official Expo SDK 52 package. Renders identical standard `<svg>` tags on React Native Web and native CoreGraphics paths on iOS/Android. |
| Financial Cents Conversion | Ad-hoc `Math.round(val * 100)` scattered across components | `currency.util.ts` (`toCents`, `fromCents`, `addCents`, `subtractCents`, `formatCents`) | Centralizes normalization, handles string cleaning (`"$1,250.50"` -> `125050`), and guarantees integer-exact math across all services and tests. |
| Temporal Partition Math | Manual month string concatenation (`year + '-' + month`) | `date-fns` (`format`, `subMonths`, `addMonths`, `parseISO`) | Prevents off-by-one errors when subtracting months across year boundaries (e.g., January 2026 - 1 month = December 2025). |
| Responsive Breakpoints | Window resize event listeners with manual state toggles | NativeWind Tailwind breakpoint classes (`sm:`, `md:`, `lg:`) | Optimized CSS media queries on web and native dimension subscriptions on mobile without React re-render lag. |

**Key insight:** By leveraging `react-native-svg` for vector rendering and `date-fns` for temporal partitioning, data visualizations stay lightweight (<30KB), render at 60 FPS, and execute predictably across web browsers and mobile devices.
</dont_hand_roll>

<common_pitfalls>
## Common Pitfalls

### Pitfall 1: Double-Counting Savings in Net Remaining
**What goes wrong:** When a user logs an expense with category `"savings"` (e.g. transfer to savings account) AND logs a saving deposit entry, the savings amount gets subtracted twice from Net Remaining.
**Why it happens:** The savings entry increases `totalSavings`, while the expense increases `totalExpenses`.
**How to avoid:** Match the exact Angular formula:
`remaining = totalIncome - totalExpenses - (totalSavings - savingsInExpenses)`
where `savingsInExpenses` is subtracted from `totalSavings` before deducting from available income.
**Warning signs:** Remaining balance is significantly lower than actual cash on hand when savings expenses are recorded.

### Pitfall 2: SVG 360-Degree Donut Arc Collapse
**What goes wrong:** When a user has only 1 expense category in a month (100% of spending), the donut chart disappears or renders a blank circle.
**Why it happens:** In SVG `A` (arc) commands, if the start and end coordinates are mathematically identical (`x1 == x2 && y1 == y2`), SVG renderers treat the sweep angle as 0° instead of 360°.
**How to avoid:** If `sliceAngle >= 360` (or `items.length === 1`), clamp the end angle to `359.999°` or render a filled ring using standard `Circle` with stroke width.
**Warning signs:** Users with a single transaction see an empty donut chart container.

### Pitfall 3: Mobile vs Web Tooltip Interaction Divergence
**What goes wrong:** Tooltip popovers requiring mouse hover work on web desktop but fail on mobile touchscreens or cause tap gesture conflicts with scrolling.
**Why it happens:** Mobile devices lack `onMouseEnter` / `onMouseLeave` events.
**How to avoid:** Implement state-driven tap selection (`onPress` / `selectedSliceId` state) with a touch hit slop area. On mobile, tapping a slice highlights it and updates the center donut label or displays an inline tooltip; tapping again or tapping the background dismisses it.
**Warning signs:** Mobile users cannot see slice amounts or trend bar values.

### Pitfall 4: Negative Net Balance Color & Sign Formatting
**What goes wrong:** A remaining deficit of `-$150.00` displays as `$-150.00` or `--$150.00` with confusing double negative signs.
**Why it happens:** Concatenating `"-"` before calling `formatCents(negativeVal)` which already outputs a localized negative currency format.
**How to avoid:** Use `formatCents(Math.abs(summary.remainingInCents))` combined with an explicit deficit badge or negative flag: `isNegative={summary.remainingInCents < 0}`.
**Warning signs:** UI text shows `--$120.00` or red balance numbers without currency symbols.

### Pitfall 5: Historical Salary Stepping Discontinuity
**What goes wrong:** User changes their salary in July 2026 from $4,000 to $5,000. When viewing May 2026, the dashboard incorrectly uses $5,000, skewing historical carryover totals.
**Why it happens:** Reading only `profile.monthlySalary` rather than checking `profile.salaries[pastMonth]` map.
**How to avoid:** Use `resolveSalaryInCents(profile, targetMonth)` which searches the historical `salaries` map for the exact or closest preceding month rate.
**Warning signs:** Past month summaries change retroactively after updating the current monthly salary.
</common_pitfalls>

<code_examples>
## Code Examples

### 1. Universal Category Donut Chart Component
```tsx
// src/features/dashboard/components/CategoryDonutChart.tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Svg, { G, Path } from 'react-native-svg';
import { generateDonutSlices, SvgPieSlice } from '../utils/svg-chart.util';
import { CategoryBreakdown } from '../types/dashboard.types';
import { formatCents } from '../../expenses/utils/currency.util';

const PALETTE = [
  '#6366f1', // Indigo
  '#ec4899', // Pink
  '#f59e0b', // Amber
  '#10b981', // Emerald
  '#8b5cf6', // Purple
  '#06b6d4', // Cyan
  '#f43f5e', // Rose
  '#64748b', // Slate
];

interface CategoryDonutChartProps {
  data: CategoryBreakdown[];
  size?: number;
}

export const CategoryDonutChart: React.FC<CategoryDonutChartProps> = ({
  data,
  size = 220,
}) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const chartItems = data.map((d, index) => ({
    id: d.category,
    label: d.category,
    valueInCents: d.totalInCents,
    color: PALETTE[index % PALETTE.length],
  }));

  const slices = generateDonutSlices(chartItems, size, 32);
  const totalCents = data.reduce((sum, d) => sum + d.totalInCents, 0);
  const activeSlice = slices.find((s) => s.id === selectedId);

  if (data.length === 0 || totalCents === 0) {
    return (
      <View
        testID="empty-donut-chart"
        className="w-full bg-white dark:bg-slate-800 rounded-2xl p-6 items-center justify-center border border-slate-100 dark:border-slate-700 min-h-[260px]"
      >
        <Text className="text-3xl mb-2">📊</Text>
        <Text className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          No category spending recorded
        </Text>
        <Text className="text-xs text-slate-400 mt-1">
          Expenses logged for this month will appear here.
        </Text>
      </View>
    );
  }

  return (
    <View
      testID="category-donut-chart"
      className="w-full bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700 shadow-sm"
    >
      <Text className="text-base font-bold text-slate-900 dark:text-slate-100 mb-4">
        Spending by Category
      </Text>

      <View className="items-center justify-center relative">
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <G>
            {slices.map((slice) => {
              const isSelected = selectedId === slice.id;
              return (
                <Path
                  key={slice.id}
                  testID={`donut-slice-${slice.id}`}
                  d={slice.pathData}
                  fill={slice.color}
                  opacity={selectedId && !isSelected ? 0.45 : 1}
                  stroke={isSelected ? '#ffffff' : 'none'}
                  strokeWidth={isSelected ? 3 : 0}
                  onPress={() => setSelectedId(isSelected ? null : slice.id)}
                />
              );
            })}
          </G>
        </Svg>

        {/* Center Label */}
        <View
          pointerEvents="none"
          className="absolute items-center justify-center w-28 text-center"
        >
          <Text className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            {activeSlice ? activeSlice.label : 'Total Spent'}
          </Text>
          <Text
            numberOfLines={1}
            className="text-base font-extrabold text-slate-900 dark:text-slate-100"
          >
            {formatCents(activeSlice ? activeSlice.valueInCents : totalCents)}
          </Text>
          {activeSlice && (
            <Text className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
              {activeSlice.percentage}%
            </Text>
          )}
        </View>
      </View>

      {/* Category Legend */}
      <View className="flex-row flex-wrap justify-center gap-2.5 mt-5">
        {slices.map((slice) => {
          const isSelected = selectedId === slice.id;
          return (
            <TouchableOpacity
              key={slice.id}
              testID={`legend-item-${slice.id}`}
              onPress={() => setSelectedId(isSelected ? null : slice.id)}
              activeOpacity={0.8}
              className={`flex-row items-center px-2.5 py-1.5 rounded-lg border transition-colors ${
                isSelected
                  ? 'bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-500'
                  : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200/60 dark:border-slate-700'
              }`}
            >
              <View
                style={{ backgroundColor: slice.color }}
                className="w-2.5 h-2.5 rounded-full mr-1.5"
              />
              <Text className="text-xs font-medium text-slate-700 dark:text-slate-300 mr-1.5">
                {slice.label}
              </Text>
              <Text className="text-xs font-bold text-slate-900 dark:text-slate-100">
                {slice.percentage}%
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};
```

### 2. Monthly Trend Dual Bar Chart Component
```tsx
// src/features/dashboard/components/MonthlyTrendBarChart.tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, useWindowDimensions } from 'react-native';
import Svg, { Rect, Line, Text as SvgText, G } from 'react-native-svg';
import { MonthlyTrend } from '../types/dashboard.types';
import { formatCents } from '../../expenses/utils/currency.util';

interface MonthlyTrendBarChartProps {
  data: MonthlyTrend[];
  height?: number;
}

export const MonthlyTrendBarChart: React.FC<MonthlyTrendBarChartProps> = ({
  data,
  height = 220,
}) => {
  const { width: screenWidth } = useWindowDimensions();
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  // Responsive chart width
  const chartWidth = Math.min(screenWidth - 64, 600);
  const paddingLeft = 40;
  const paddingRight = 16;
  const paddingTop = 20;
  const paddingBottom = 30;
  const plotWidth = chartWidth - paddingLeft - paddingRight;
  const plotHeight = height - paddingTop - paddingBottom;

  if (data.length === 0) {
    return (
      <View
        testID="empty-trend-chart"
        className="w-full bg-white dark:bg-slate-800 rounded-2xl p-6 items-center justify-center border border-slate-100 dark:border-slate-700 min-h-[260px]"
      >
        <Text className="text-3xl mb-2">📈</Text>
        <Text className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          No trend history available
        </Text>
      </View>
    );
  }

  // Find max value across expenses and savings
  const maxCents = Math.max(
    ...data.map((d) => Math.max(d.totalExpensesInCents, d.totalSavingsInCents)),
    10000 // minimum $100 scale
  );

  const groupWidth = plotWidth / data.length;
  const barWidth = Math.min(Math.max(groupWidth * 0.32, 10), 22);

  const selectedItem = selectedIdx !== null ? data[selectedIdx] : null;

  return (
    <View
      testID="monthly-trend-bar-chart"
      className="w-full bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700 shadow-sm"
    >
      <View className="flex-row justify-between items-center mb-4">
        <View>
          <Text className="text-base font-bold text-slate-900 dark:text-slate-100">
            Expenses vs Savings
          </Text>
          <Text className="text-xs text-slate-400">Last 6 Months</Text>
        </View>

        {/* Legend */}
        <View className="flex-row items-center gap-3">
          <View className="flex-row items-center gap-1.5">
            <View className="w-3 h-3 rounded-sm bg-rose-500" />
            <Text className="text-xs font-medium text-slate-600 dark:text-slate-300">
              Expenses
            </Text>
          </View>
          <View className="flex-row items-center gap-1.5">
            <View className="w-3 h-3 rounded-sm bg-emerald-500" />
            <Text className="text-xs font-medium text-slate-600 dark:text-slate-300">
              Savings
            </Text>
          </View>
        </View>
      </View>

      {/* Interactive Value Highlight Banner */}
      {selectedItem && (
        <View
          testID="trend-tooltip-badge"
          className="mb-3 p-2.5 bg-slate-50 dark:bg-slate-700/50 rounded-xl flex-row justify-between items-center border border-slate-200/60 dark:border-slate-600"
        >
          <Text className="text-xs font-bold text-slate-900 dark:text-slate-100">
            {selectedItem.month}
          </Text>
          <View className="flex-row gap-4">
            <Text className="text-xs text-rose-600 dark:text-rose-400 font-semibold">
              Exp: {formatCents(selectedItem.totalExpensesInCents)}
            </Text>
            <Text className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
              Sav: {formatCents(selectedItem.totalSavingsInCents)}
            </Text>
          </View>
        </View>
      )}

      {/* SVG Plot */}
      <View className="items-center">
        <Svg width={chartWidth} height={height}>
          {/* Horizontal Grid lines */}
          {[0, 0.5, 1].map((ratio) => {
            const y = paddingTop + plotHeight * (1 - ratio);
            return (
              <G key={ratio}>
                <Line
                  x1={paddingLeft}
                  y1={y}
                  x2={chartWidth - paddingRight}
                  y2={y}
                  stroke="#e2e8f0"
                  strokeDasharray="4 4"
                  strokeWidth={1}
                />
                <SvgText
                  x={paddingLeft - 6}
                  y={y + 4}
                  textAnchor="end"
                  fontSize="9"
                  fill="#94a3b8"
                >
                  {formatCents(Math.round(maxCents * ratio))}
                </SvgText>
              </G>
            );
          })}

          {/* Dual Bars per Month */}
          {data.map((item, idx) => {
            const groupX = paddingLeft + idx * groupWidth;
            const expHeight = (item.totalExpensesInCents / maxCents) * plotHeight;
            const savHeight = (item.totalSavingsInCents / maxCents) * plotHeight;

            const expX = groupX + (groupWidth - barWidth * 2 - 4) / 2;
            const savX = expX + barWidth + 4;
            const expY = paddingTop + (plotHeight - expHeight);
            const savY = paddingTop + (plotHeight - savHeight);

            const isSelected = selectedIdx === idx;

            return (
              <G key={item.month} onPress={() => setSelectedIdx(isSelected ? null : idx)}>
                {/* Expense Bar (Rose) */}
                <Rect
                  testID={`bar-expense-${item.month}`}
                  x={expX}
                  y={expY}
                  width={barWidth}
                  height={Math.max(expHeight, 2)}
                  rx={4}
                  fill="#f43f5e"
                  opacity={selectedIdx !== null && !isSelected ? 0.4 : 1}
                />

                {/* Savings Bar (Emerald) */}
                <Rect
                  testID={`bar-savings-${item.month}`}
                  x={savX}
                  y={savY}
                  width={barWidth}
                  height={Math.max(savHeight, 2)}
                  rx={4}
                  fill="#10b981"
                  opacity={selectedIdx !== null && !isSelected ? 0.4 : 1}
                />

                {/* Month Label (X-Axis) */}
                <SvgText
                  x={groupX + groupWidth / 2}
                  y={height - 8}
                  textAnchor="middle"
                  fontSize="10"
                  fontWeight={isSelected ? 'bold' : 'normal'}
                  fill={isSelected ? '#6366f1' : '#64748b'}
                >
                  {item.month.split('-')[1]}
                </SvgText>
              </G>
            );
          })}
        </Svg>
      </View>
    </View>
  );
};
```

### 3. Month Navigator Component
```tsx
// src/features/dashboard/components/MonthNavigator.tsx
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { format, parseISO, subMonths, addMonths } from 'date-fns';

interface MonthNavigatorProps {
  currentMonth: string; // "YYYY-MM"
  onMonthChange: (newMonth: string) => void;
}

export const MonthNavigator: React.FC<MonthNavigatorProps> = ({
  currentMonth,
  onMonthChange,
}) => {
  const currentDate = parseISO(`${currentMonth}-01`);
  const now = new Date();
  const activeMonthNow = format(now, 'yyyy-MM');
  const isCurrentMonth = currentMonth === activeMonthNow;

  const handlePrev = () => {
    const prev = subMonths(currentDate, 1);
    onMonthChange(format(prev, 'yyyy-MM'));
  };

  const handleNext = () => {
    const next = addMonths(currentDate, 1);
    onMonthChange(format(next, 'yyyy-MM'));
  };

  const handleResetToNow = () => {
    onMonthChange(activeMonthNow);
  };

  return (
    <View
      testID="month-navigator"
      className="flex-row items-center justify-between bg-white dark:bg-slate-800 rounded-2xl p-2.5 border border-slate-100 dark:border-slate-700 shadow-xs mb-6"
    >
      <TouchableOpacity
        testID="nav-prev-month-btn"
        onPress={handlePrev}
        className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-700 items-center justify-center"
        accessibilityLabel="Previous month"
      >
        <Text className="text-base font-bold text-slate-700 dark:text-slate-300">‹</Text>
      </TouchableOpacity>

      <View className="items-center">
        <Text className="text-base font-bold text-slate-900 dark:text-slate-100">
          {format(currentDate, 'MMMM yyyy')}
        </Text>
        {!isCurrentMonth && (
          <TouchableOpacity
            testID="nav-jump-now-btn"
            onPress={handleResetToNow}
            className="mt-0.5"
          >
            <Text className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
              Jump to Current Month
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity
        testID="nav-next-month-btn"
        onPress={handleNext}
        className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-700 items-center justify-center"
        accessibilityLabel="Next month"
      >
        <Text className="text-base font-bold text-slate-700 dark:text-slate-300">›</Text>
      </TouchableOpacity>
    </View>
  );
};
```
</code_examples>

<sota_updates>
## State of the Art (2024-2025)

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Heavy Canvas/D3 wrappers (`react-native-chart-kit`, `victory-native` classic) | Declarative Universal SVG (`react-native-svg`) with pure TypeScript math | 2024/2025 | Eliminates heavy runtime bundle sizes, works identically on React Native Web, and ensures zero layout thrashing on screen rotation. |
| Floating-point summary math (`number` additions) | Integer Cents financial pipelines (`currency.util.ts`) | 2024/2025 | Completely prevents floating-point inaccuracies like `$19.99999999` across multi-month balance carryover aggregations. |
| Mobile-only fixed layouts | Multi-column responsive grid container classes (`NativeWind` `sm:`, `lg:`) | 2024/2025 | Dashboard expands gracefully to 4 columns on desktop monitors while stacking cleanly into 1 column on mobile phones. |

**New tools/patterns to consider:**
- `react-native-svg` path caching with `useMemo` prevents unnecessary re-calculation of trigonometric arc curves during standard UI re-renders.
- Composite month queries (`where('month', '<=', activeMonth)`) allow single-trip reads for historical balance carryover rather than reading years of raw documents.
</sota_updates>

## Validation Architecture

### Verification Strategy
To guarantee complete fidelity with the existing Angular business logic and flawless execution across Web and Mobile, Phase 5 enforces a multi-tier test suite:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Phase 5 Validation Grid                         │
├──────────────────────────┬─────────────────────────────────────────────┤
│ Level                    │ Target & Test Suites                        │
├──────────────────────────┼─────────────────────────────────────────────┤
│ 1. Math & Aggregation    │ aggregation.util.test.ts                    │
│    (Pure Unit Tests)     │ - computeMonthSummary integer cents math    │
│                          │ - resolveSalaryInCents historical map steps │
│                          │ - getMonthsBetween boundary calculation     │
│                          │ - computeCategoryBreakdown percentages      │
│                          │ - computeMonthlyTrend 6-month dual series   │
├──────────────────────────┼─────────────────────────────────────────────┤
│ 2. Vector Trigonometry   │ svg-chart.util.test.ts                      │
│    (Geometry Tests)      │ - polarToCartesian coordinate accuracy      │
│                          │ - createDonutSlicePath arc path formatting  │
│                          │ - 360-degree single slice boundary clamp    │
│                          │ - generateDonutSlices percentage rounding   │
├──────────────────────────┼─────────────────────────────────────────────┤
│ 3. Services & Data       │ dashboard.service.test.ts                   │
│    (Firestore Mocks)     │ - Firestore queries with month constraints  │
│                          │ - Offline cache persistence & fallback      │
│                          │ - Error handling on network drop            │
├──────────────────────────┼─────────────────────────────────────────────┤
│ 4. Component Testing     │ SummaryCard.test.tsx                        │
│    (RNTL UI Tests)       │ SummaryCardsGrid.test.tsx                   │
│                          │ CategoryDonutChart.test.tsx                 │
│                          │ MonthlyTrendBarChart.test.tsx               │
│                          │ MonthNavigator.test.tsx                     │
│                          │ ActionShortcuts.test.tsx                    │
├──────────────────────────┼─────────────────────────────────────────────┤
│ 5. Full Screen & Routes  │ dashboard-screen.test.tsx                   │
│    (Integration Tests)   │ - Month navigation updates charts & metrics │
│                          │ - Quick action deep links                   │
│                          │ - Empty state fallback presentation         │
└──────────────────────────┴─────────────────────────────────────────────┘
```

### Key Test Cases & Invariants
1. **Integer Cents Precision:** Assert that adding 100 expenses of `$0.10` yields exactly `$10.00` with zero decimal artifacts.
2. **Angular Logic Parity:** Verify that `remaining` matches:
   `totalIncome - totalExpenses - (totalSavings - savingsInExpenses)`
   where savings inside expenses are not deducted twice.
3. **Carryover Continuity:** Verify that a user registered in `2026-05` viewing `2026-08` receives the exact sum of net balances from May, June, and July as `previousMonthRemaining`.
4. **SVG Safety:** Assert that `generateDonutSlices` handles 0 total amount and 1 single 100% item without throwing division-by-zero or invalid SVG path errors.
5. **Responsive Grid:** Assert that `SummaryCardsGrid` renders all 4 metric cards (`Total Income`, `Total Expenses`, `Total Savings`, `Net Remaining`) with accessible role identifiers.

<open_questions>
## Open Questions

1. **Loan Repayments in Monthly Expenses:**
   - What we know: In the Angular app, loan repayments create an expense tagged as `loan_repayment`.
   - What's unclear: Should `loansTakenIncome` display gross borrowed funds or net of repayments for that month?
   - Recommendation: Mirror Angular's implementation where `loansTakenIncome` represents the total amount borrowed in the active month, and repayments flow through the standard expenses ledger.

2. **Dashboard URL Route Parity:**
   - What we know: In React Native Web with Expo Router, `app/(app)/index.tsx` is the home route (`/`).
   - What's unclear: Should `/dashboard` be a direct alias route or should `/` render the dashboard?
   - Recommendation: Keep `app/(app)/index.tsx` as the main responsive dashboard and provide an explicit redirect/screen at `app/(app)/dashboard/index.tsx` so both `/` and `/dashboard` resolve seamlessly.
</open_questions>

<sources>
## Sources

### Primary (HIGH confidence)
- Angular Source Reference: `expense-expert/src/app/core/services/dashboard.service.ts` — verified complete financial summary formulas, historical salary lookup, and past remaining carryover loops.
- Angular Models: `expense-expert/src/app/core/models/dashboard.model.ts` — verified `MonthSummary`, `MonthlyTrend`, and `CategoryBreakdown` contracts.
- Angular Profile Service: `expense-expert/src/app/core/services/profile.service.ts` — verified salary map resolution and registration date tracking.
- React Native Codebase: `expense-expert-rn/src/features/expenses/utils/currency.util.ts` — verified integer cents arithmetic primitives.
- Expo SDK 52 Documentation: `react-native-svg` integration and responsive web best practices.

### Secondary (MEDIUM confidence)
- W3C SVG 1.1 Specification: Elliptical Arc curve path syntax (`A rx ry x-axis-rotation large-arc-flag sweep-flag x y`).
- Tailwind CSS / NativeWind v4 documentation on container breakpoints and grid column utilities.

### Tertiary (LOW confidence - needs validation)
- None. All math formulas and SVG geometries are mathematically verified.
</sources>

<metadata>
## Metadata

**Research scope:**
- Core technology: Financial Dashboards & Visualizations (React Native, Web, Cloud Firestore)
- Ecosystem: `react-native-svg`, `date-fns`, `nativewind`, `firebase/firestore`
- Patterns: Pure integer cents financial calculations, universal declarative SVG chart generators, responsive multi-column layouts
- Pitfalls: IEEE 754 float drift, 360-degree SVG arc collapse, savings double-counting, mobile tooltip interaction conflicts

**Confidence breakdown:**
- Standard stack: HIGH - `react-native-svg` is official Expo SDK 52 standard
- Architecture: HIGH - strictly mirrors Angular `DashboardService` with integer cents safety
- Pitfalls: HIGH - common financial charting gotchas documented and mitigated
- Code examples: HIGH - verified against TypeScript and React Native SVG API

**Research date:** 2026-08-23
**Valid until:** 2026-09-23 (30 days)
</metadata>

---

*Phase: 05-dashboards-visualizations*
*Research completed: 2026-08-23*
*Ready for planning: yes*
