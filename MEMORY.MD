# Expense Expert - Project Memory

## Tech Stack
- Angular 18 (standalone components, no NgModules)
- AngularFire 18.0.1 + Firebase
- Tailwind CSS
- Chart.js + ng2-charts@6.0.1 (with @angular/cdk@18)
- Node 20.11.1, npm 10.2.4

## Project Location
- Root: `/mnt/5cf2a800-97fa-463a-878d-37bb8b42ecdb/Pet Project/Expense Expert/expense-expert/`
- App source: `src/app/`

## Architecture
- All standalone components with `inject()` pattern
- Signals for reactive state in services
- New control flow (`@if`, `@for`, `@empty`)
- Functional guards (authGuard, guestGuard)
- Lazy-loaded feature routes

## Key Directories
- `core/models/` - TypeScript interfaces and enums
- `core/services/` - auth, firestore, expense, expense-draft, person, saving, dashboard, toast
- `core/guards/` - auth.guard.ts, guest.guard.ts
- `features/auth/` - Login (email/password), Register, social sign-in (Google, Facebook)
- `features/dashboard/` - Summary cards, monthly chart (Chart.js)
- `features/expenses/` - CRUD with categories, loan tracking
- `features/expense-drafts/` - Reusable templates, installments
- `features/savings/` - Bank accounts, saving goals, entries, history, loan summary
- `shared/components/` - PageHeader, ConfirmDialog, EmptyState, LoadingSpinner, CategoryBadge, AmountDisplay, PersonSelect, MonthPicker, ToastContainer
- `layout/` - MainLayout (sidebar + navbar), responsive

## Firebase Config
- Environment files at `src/environments/environment.ts` - user needs to add their Firebase config
- Firestore subcollections under `users/{userId}/` for data isolation
- Auth via email/password + Google + Facebook (signInWithPopup)
- Requires enabling Email/Password, Google, and Facebook providers in Firebase Console

## Dependency Compatibility Notes
- @angular/fire must be pinned to v18 for Angular 18
- ng2-charts must be pinned to v6.0.1 for Angular 18
- @angular/cdk must be pinned to v18 for Angular 18

## Recent Changes
1. **Auth Persistence Fix**
   - Added `authReady` promise to `AuthService` that resolves when Firebase restores the session
   - Both `authGuard` and `guestGuard` now await `authService.authReady` before checking auth state
   - No more redirect to login on page reload
2. **Custom Categories**
   - Created `CategoryService` - stores custom categories in Firestore `users/{uid}/categories`
   - Created `CategorySelectComponent` - dropdown with inline "+ Add" button (same pattern as PersonSelect)
   - Updated expense form and draft form to use the new component instead of the static dropdown
3. **Dark Mode**
   - Created `ThemeService` - persists to localStorage, respects system preference
   - Added sun/moon toggle button in the Navbar
   - Enabled `darkMode: 'class'` in `tailwind.config.js`
   - Applied `dark:` variants to: global styles, sidebar, navbar, main layout, auth layout, login page, page header, confirm dialog, amount display, category badge, month picker, summary cards, expense list, expense form, expense detail, draft form, and monthly chart
5. **Savings: Infinite Loop Fix & Goal Duration**
   - **Bug fixed**: `addSavingEntry()` in `SavingService` used `.subscribe()` (live stream) to read the goal before updating `savedAmount`, causing an infinite update loop. Replaced with `firstValueFrom()` for a one-shot read.
   - **Duration feature**: `SavingGoal` model now has `durationValue: number`, `durationUnit: 'months' | 'years'`, `startMonth: string`, and `endMonth: string` (auto-computed). Removed single `month` field.
   - **Form UI**: `SavingGoalFormComponent` now has preset duration buttons (1m, 3m, 6m, 1yr, 2yr, 3yr) + custom input with months/years toggle, plus a computed end month preview.
   - **Goal list query**: `getGoalsByMonth()` replaced by `getGoalsActiveInMonth()` which fetches all goals and filters client-side for those spanning the selected month.
   - **Goal card UI**: Shows duration period (e.g., "Mar 2026 → Aug 2026 (6 months)") below the saved/target amounts.

6. **Savings as Expense & Dashboard Fix**
   - Added `Savings` to `ExpenseCategory` enum with 💰 icon in `CategoryService`
   - Quick Save dialog now has an "Also record as expense" checkbox (default: on) — deposits optionally create an expense with category `Savings`
   - **Dashboard bug fixed**: `getCurrentMonthSummary()` and `getMonthlyTrend()` were querying `saving-goals` with `where('month', '==', month)`, but `SavingGoal` has no `month` field (only `startMonth`/`endMonth`), so `totalSavings` was always 0. Fixed to query `saving-entries` instead, computing net savings (deposits − withdrawals).
   - Dashboard `remaining` formula updated to `totalIncome - totalExpenses - (totalSavings - savingsInExpenses)` to avoid double-counting savings that are also recorded as expenses.

4. **Auth Migration: Passwordless → Email/Password + Social**
   - Replaced passwordless (email link) auth with email/password sign-in
   - Added Google and Facebook social sign-in via `signInWithPopup`
   - Rewrote `LoginComponent` with email/password form + social buttons
   - Created `RegisterComponent` with display name, email, password, confirm password + social buttons
   - Deleted `VerifyComponent` and its route (no longer needed)
   - Updated `AuthService` with `register()`, `login()`, `signInWithGoogle()`, `signInWithFacebook()` methods

7. **Loan Summary Migration**
   - Added a "Total Pending Loan to Pay" card on the Savings page, computing total outstanding loans.
   - Relocated `LoanSummaryComponent` from `features/expense-drafts` to `features/savings`.
   - Updated routes and navigation links to reflect the new location (`/savings/loans`).

8. **Guided App Tour (Per-Page Contextual)**
   - Created `TourService` (`core/services/tour.service.ts`) — manages per-page tour state with Firestore persistence.
     - Stores `completedTourPages` array in Firestore `users/{uid}` document.
     - First visit to each page auto-starts its guide; subsequent visits skip it.
     - Methods: `tryStartPageTour(pageKey)`, `forceStartPageTour(pageKey)`, `resetAllTours()`, `nextStep()`, `previousStep()`, `skipTour()`.
   - Created `TourOverlayComponent` (`shared/components/tour-overlay/tour-overlay.component.ts`) — spotlight overlay with positioned tooltips.
     - Uses SVG mask for spotlight cutout around the target element.
     - Animated tooltip with title, description, step counter, Back/Next/Skip buttons.
     - Supports dark mode and responsive positioning.
   - **Tour steps defined per page:**
     - Dashboard (5 steps): Total Income, Total Expenses, Total Savings, Remaining Balance, Monthly Trend chart.
     - Expenses (2 steps): Add Expense button, expense list area.
     - Expense Drafts (2 steps): New Draft button, draft list area.
     - Savings (3 steps): Pending Loans card, Bank Accounts section, Saving Goals section.
     - Profile (2 steps): Monthly Salary card, Additional Earnings section.
   - Added `actionId` input to `PageHeaderComponent` for tour-targetable action buttons.
   - Added element IDs to: summary cards, sidebar nav items, navbar buttons.
   - Added 💡 restart-tour button in `NavbarComponent` — resets all page tours and starts the current page's guide.
   - Tour overlay integrated in `MainLayoutComponent`.

