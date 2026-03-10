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
- `features/expense-drafts/` - Reusable templates, installments, loan summary
- `features/savings/` - Bank accounts, saving goals, entries, history
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

4. **Auth Migration: Passwordless → Email/Password + Social**
   - Replaced passwordless (email link) auth with email/password sign-in
   - Added Google and Facebook social sign-in via `signInWithPopup`
   - Rewrote `LoginComponent` with email/password form + social buttons
   - Created `RegisterComponent` with display name, email, password, confirm password + social buttons
   - Deleted `VerifyComponent` and its route (no longer needed)
   - Updated `AuthService` with `register()`, `login()`, `signInWithGoogle()`, `signInWithFacebook()` methods
