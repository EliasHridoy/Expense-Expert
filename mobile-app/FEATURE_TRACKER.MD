# 📱 Expense Expert — Flutter Migration Tracker

> **Source App**: Angular 18 + Firebase (Web)
> **Target**: Flutter (iOS + Android)
> **Flutter Directory**: `/Pet Project/Expense Expert/flutter/`
> **Last Updated**: 2026-05-25

---

## 📋 Table of Contents
1. [Tech Stack Decision](#tech-stack)
2. [Project Structure](#project-structure)
3. [Development Rules & Techniques](#dev-rules)
4. [Implementation Plan — Phase by Phase](#phases)
5. [Changelog](#changelog)

---

## 🛠️ Tech Stack Decision <a name="tech-stack"></a>

| Concern | Package | Reason |
|---|---|---|
| Firebase Core | `firebase_core: ^3.x` | Required base |
| Auth | `firebase_auth: ^5.x` | Direct port from AngularFire Auth |
| Database | `cloud_firestore: ^5.x` | Same Firestore, same schema |
| State Management | `flutter_riverpod: ^2.x` | Replaces Angular Signals + Services |
| Navigation | `go_router: ^14.x` | Declarative routing, replaces Angular Router |
| Charts | `fl_chart: ^0.69.x` | Replaces Chart.js / ng2-charts |
| Date Formatting | `intl: ^0.19.x` | Currency + date formatting |
| App Tour / Guide | `tutorial_coach_mark: ^1.x` | Replaces `TourService` |
| Icons | `flutter_svg: ^2.x` + Material Icons | Replaces Tailwind SVG icons |
| Local Storage | `shared_preferences: ^2.x` | Replaces localStorage (theme, prefs) |
| Google Sign-In | `google_sign_in: ^6.x` | Replaces `signInWithPopup` Google |
| Env Config | `flutter_dotenv: ^5.x` | Replaces `environment.ts` |
| Loading States | `shimmer: ^3.x` | Skeleton loaders |
| Form Validation | Built-in Flutter + custom validators | Replaces Angular Reactive Forms |

---

## 📁 Project Structure <a name="project-structure"></a>

```
flutter/
├── lib/
│   ├── main.dart                     # App entry point, Firebase init
│   ├── app.dart                      # MaterialApp + GoRouter setup
│   ├── core/
│   │   ├── constants/
│   │   │   ├── app_colors.dart       # Color palette (replaces Tailwind tokens)
│   │   │   ├── app_text_styles.dart  # Typography
│   │   │   └── app_spacing.dart      # Spacing constants
│   │   ├── models/
│   │   │   ├── expense.model.dart
│   │   │   ├── expense_draft.model.dart
│   │   │   ├── saving.model.dart
│   │   │   ├── income.model.dart
│   │   │   ├── person.model.dart
│   │   │   └── user.model.dart
│   │   ├── providers/                # Riverpod providers (replaces Angular services)
│   │   │   ├── auth_provider.dart
│   │   │   ├── expense_provider.dart
│   │   │   ├── expense_draft_provider.dart
│   │   │   ├── saving_provider.dart
│   │   │   ├── dashboard_provider.dart
│   │   │   ├── category_provider.dart
│   │   │   ├── person_provider.dart
│   │   │   ├── profile_provider.dart
│   │   │   └── theme_provider.dart
│   │   ├── services/                 # Pure Firebase data layer
│   │   │   ├── firestore_service.dart
│   │   │   ├── auth_service.dart
│   │   │   ├── expense_service.dart
│   │   │   ├── expense_draft_service.dart
│   │   │   ├── saving_service.dart
│   │   │   ├── dashboard_service.dart
│   │   │   ├── category_service.dart
│   │   │   ├── person_service.dart
│   │   │   └── profile_service.dart
│   │   ├── router/
│   │   │   ├── app_router.dart       # GoRouter config + guards
│   │   │   └── route_names.dart      # Named route constants
│   │   └── utils/
│   │       ├── currency_formatter.dart
│   │       ├── date_helpers.dart
│   │       └── validators.dart
│   ├── features/
│   │   ├── auth/
│   │   │   ├── login_screen.dart
│   │   │   └── register_screen.dart
│   │   ├── dashboard/
│   │   │   ├── dashboard_screen.dart
│   │   │   ├── widgets/
│   │   │   │   ├── summary_card.dart
│   │   │   │   └── monthly_trend_chart.dart
│   │   ├── expenses/
│   │   │   ├── expense_list_screen.dart
│   │   │   ├── expense_form_screen.dart
│   │   │   ├── expense_detail_screen.dart
│   │   │   └── widgets/
│   │   │       ├── expense_list_item.dart
│   │   │       └── category_badge.dart
│   │   ├── expense_drafts/
│   │   │   ├── draft_list_screen.dart
│   │   │   ├── draft_form_screen.dart
│   │   │   └── widgets/
│   │   │       └── draft_card.dart
│   │   ├── savings/
│   │   │   ├── savings_screen.dart
│   │   │   ├── loan_summary_screen.dart
│   │   │   └── widgets/
│   │   │       ├── saving_goal_card.dart
│   │   │       └── bank_account_card.dart
│   │   └── profile/
│   │       ├── profile_screen.dart
│   │       └── widgets/
│   │           └── income_entry_card.dart
│   ├── layout/
│   │   ├── main_scaffold.dart        # Scaffold + BottomNavBar
│   │   └── bottom_nav_bar.dart       # 5-tab bottom nav
│   └── shared/
│       ├── widgets/
│       │   ├── amount_display.dart
│       │   ├── confirm_dialog.dart
│       │   ├── empty_state.dart
│       │   ├── loading_spinner.dart
│       │   ├── month_picker.dart
│       │   ├── page_header.dart
│       │   ├── category_select.dart
│       │   ├── person_select.dart
│       │   └── toast_message.dart
│       └── theme/
│           ├── app_theme.dart        # ThemeData light + dark
│           └── app_theme_dark.dart
├── assets/
│   ├── icons/                        # SVG icons
│   └── .env                          # Firebase config (gitignored)
├── android/
├── ios/
├── pubspec.yaml
├── pubspec.lock
└── FEATURE_TRACKER.MD                # This file
```

---

## 📐 Development Rules & Techniques <a name="dev-rules"></a>

### 1. Architecture Rules

- **Service/Provider Separation**: Keep Firebase queries in `services/` only. Providers consume services and expose state to the UI. Screens never call Firebase directly.
- **No business logic in widgets**: All computation (totals, filtering, formatting) lives in providers or services.
- **Immutable models**: All model classes use `copyWith()` and `fromMap()`/`toMap()` — no mutable fields.
- **One screen = one file**: Each screen has its own file. Complex screens extract sub-widgets into a `widgets/` subfolder.

### 2. State Management (Riverpod)

- Use `StreamProvider` for Firestore real-time streams (direct port of RxJS observables).
- Use `StateNotifierProvider` or `NotifierProvider` for mutable state (forms, selections).
- Use `FutureProvider` for one-shot async reads (replaces `firstValueFrom()`).
- Always use `ref.watch()` in build, `ref.read()` in callbacks/handlers.
- Provider families (`.family`) for parameterized queries (e.g., expenses by month).

```dart
// Example: Expense list stream
final expenseListProvider = StreamProvider.family<List<Expense>, String>((ref, month) {
  final service = ref.read(expenseServiceProvider);
  return service.getExpensesByMonth(month);
});
```

### 3. Navigation (GoRouter)

- All routes defined centrally in `app_router.dart`.
- Auth guard implemented via `redirect` callback — checks auth state before routing.
- Named routes only — no hardcoded path strings in screens.
- Bottom nav uses `go()`, deep links use `push()`.

```dart
// Route guard pattern
redirect: (context, state) {
  final isAuthenticated = ref.read(authStateProvider).value != null;
  final isAuthRoute = state.matchedLocation.startsWith('/auth');
  if (!isAuthenticated && !isAuthRoute) return '/auth/login';
  if (isAuthenticated && isAuthRoute) return '/dashboard';
  return null;
},
```

### 4. Firebase / Firestore Rules

- **Never change the Firestore schema** — the existing web app shares the same database. All collection paths must match exactly:
  - `users/{uid}/expenses`
  - `users/{uid}/expense-drafts`
  - `users/{uid}/saving-goals`
  - `users/{uid}/saving-entries`
  - `users/{uid}/bank-accounts`
  - `users/{uid}/categories`
  - `users/{uid}/persons`
- All Firestore documents must include `createdAt` / `updatedAt` timestamps.
- Use `FieldValue.serverTimestamp()` — never `DateTime.now()` — for timestamp fields.

### 5. Model Conventions

```dart
class Expense {
  final String id;
  final String title;
  // ... fields

  // Required: fromMap factory
  factory Expense.fromMap(Map<String, dynamic> map, String id) { ... }

  // Required: toMap for Firestore writes
  Map<String, dynamic> toMap() { ... }

  // Required: copyWith for immutable updates
  Expense copyWith({ String? title, ... }) { ... }
}
```

### 6. UI / Theming Rules

- All colors, font sizes, and spacing come from `core/constants/` — never hardcode values in widgets.
- Support light and dark mode from day one — define both `ThemeData` objects.
- Use `MediaQuery` for responsive breakpoints (tablet support is a bonus, not required).
- Bottom navigation is the primary nav pattern (mobile-first, matches existing web bottom nav).
- Shimmer loading for any list that fetches from Firestore.
- All currency amounts use `currency_formatter.dart` — never raw `toString()`.

### 7. Error Handling

- Wrap all Firestore calls in try/catch in the service layer.
- Providers expose `AsyncValue<T>` — UI handles `.loading`, `.error`, `.data` states explicitly.
- Show `SnackBar` for transient errors (replaces `ToastService`).
- Never `print()` in production — use `debugPrint()` only, remove before release.

### 8. Code Style

- Follow official [Dart style guide](https://dart.dev/guides/language/effective-dart/style).
- File names: `snake_case.dart`
- Class names: `PascalCase`
- Variables/methods: `camelCase`
- Constants: `camelCase` (Dart convention) or `SCREAMING_SNAKE` for true compile-time constants.
- Max line length: 100 characters.
- Always run `dart fix --apply` and `flutter analyze` before committing.
- No unused imports — enforce with `flutter analyze`.

### 9. Testing Strategy

- Unit test all service methods (mock Firestore with `fake_cloud_firestore`).
- Widget test shared components (buttons, dialogs, form fields).
- Integration tests for auth flow and core CRUD paths.
- Minimum coverage target: **70%** for services.

### 10. Git Workflow

- Branch naming: `phase/1-foundation`, `feat/expense-crud`, `fix/auth-guard`.
- Commit format: `feat(expenses): add expense CRUD`, `fix(auth): resolve guard redirect`.
- Never commit `.env` or `google-services.json` / `GoogleService-Info.plist`.
- Update this `FEATURE_TRACKER.MD` changelog with every meaningful commit.

---

## 🚀 Implementation Plan — Phase by Phase <a name="phases"></a>

---

### ✅ Phase 0 — Project Bootstrap
**Goal**: Runnable Flutter app connected to Firebase.

| Task | Status | Notes |
|---|---|---|
| Initialize Flutter project (`flutter create`) | ⬜ TODO | Inside `flutter/` directory |
| Add all dependencies to `pubspec.yaml` | ⬜ TODO | See Tech Stack table above |
| Configure FlutterFire CLI (`flutterfire configure`) | ⬜ TODO | Points to existing Firebase project |
| Set up `.env` file with Firebase config | ⬜ TODO | Use `flutter_dotenv` |
| Create `app_colors.dart`, `app_text_styles.dart`, `app_spacing.dart` | ⬜ TODO | Design tokens first |
| Create `app_theme.dart` (light + dark ThemeData) | ⬜ TODO | |
| Set up `GoRouter` skeleton with placeholder screens | ⬜ TODO | |
| Set up Riverpod `ProviderScope` in `main.dart` | ⬜ TODO | |
| Verify app builds on Android + iOS simulators | ⬜ TODO | |

**Exit Criteria**: App launches, connects to Firebase, shows a placeholder screen.

---

### ✅ Phase 1 — Authentication
**Goal**: Full auth flow (Login, Register, Google Sign-In).

| Task | Status | Notes |
|---|---|---|
| Port `AuthService` → `auth_service.dart` | ⬜ TODO | `signIn`, `register`, `signOut`, `signInWithGoogle` |
| Create `auth_provider.dart` with `authStateProvider` | ⬜ TODO | `StreamProvider` wrapping `FirebaseAuth.authStateChanges()` |
| Implement auth guard in GoRouter `redirect` | ⬜ TODO | Replaces `authGuard` + `guestGuard` |
| Build `LoginScreen` (email/password + Google button) | ⬜ TODO | |
| Build `RegisterScreen` (name, email, password, confirm) | ⬜ TODO | |
| Handle auth errors with SnackBar messages | ⬜ TODO | |
| Persist theme preference via `shared_preferences` | ⬜ TODO | |
| Test: login, register, logout, Google sign-in | ⬜ TODO | |

**Exit Criteria**: User can register, log in, log out, and Google sign-in works.

---

### ✅ Phase 2 — Core Layout & Navigation
**Goal**: Shell scaffold with working bottom navigation.

| Task | Status | Notes |
|---|---|---|
| Build `MainScaffold` with `BottomNavBar` | ⬜ TODO | 5 tabs: Dashboard, Expenses, Drafts, Savings, Profile |
| Implement tab routing with GoRouter `ShellRoute` | ⬜ TODO | Preserves tab state on switch |
| Build `PageHeader` shared widget | ✅ DONE | Title + optional action button |
| Build `LoadingSpinner`, `EmptyState` shared widgets | ⬜ TODO | |
| Build `ConfirmDialog` shared widget | ⬜ TODO | Used by delete flows |
| Build `ToastMessage` / SnackBar helper | ⬜ TODO | Replaces `ToastService` |
| Apply theme toggle (light/dark) in app bar | ⬜ TODO | Persisted via `shared_preferences` |

**Exit Criteria**: Shell renders, all 5 tabs navigate correctly, theme toggle works.

---

### ✅ Phase 3 — Profile & Income
**Goal**: User can set monthly salary and add extra income entries.

| Task | Status | Notes |
|---|---|---|
| Port `profile.model.ts` → `user.model.dart` + `income.model.dart` | ⬜ TODO | |
| Port `ProfileService` → `profile_service.dart` | ⬜ TODO | `getProfile`, `updateSalary`, `addIncome`, `deleteIncome` |
| Create `profile_provider.dart` | ⬜ TODO | |
| Build `ProfileScreen` | ⬜ TODO | Monthly salary card + income entries list |
| Build `IncomeEntryCard` widget | ⬜ TODO | |
| Add/edit/delete income entries | ⬜ TODO | |

**Exit Criteria**: User can set salary and manage income entries.

---

### ✅ Phase 4 — Categories & Persons
**Goal**: Dynamic categories and person tracking (shared by Expenses + Drafts).

| Task | Status | Notes |
|---|---|---|
| Port `CategoryService` → `category_service.dart` | ⬜ TODO | Built-in + custom categories with icons |
| Create `category_provider.dart` | ⬜ TODO | |
| Build `CategorySelect` widget (dropdown + inline add) | ⬜ TODO | |
| Port `PersonService` → `person_service.dart` | ⬜ TODO | |
| Create `person_provider.dart` | ⬜ TODO | |
| Build `PersonSelect` widget (dropdown + inline add) | ⬜ TODO | |
| Build `CategoryBadge` widget | ⬜ TODO | Colored chip with icon |

**Exit Criteria**: Dynamic categories + persons usable across features.

---

### ✅ Phase 5 — Expenses (CRUD)
**Goal**: Full expense management with loan tracking.

| Task | Status | Notes |
|---|---|---|
| Port `expense.model.ts` → `expense.model.dart` | ⬜ TODO | |
| Port `ExpenseService` → `expense_service.dart` | ⬜ TODO | CRUD + query by month |
| Create `expense_provider.dart` | ⬜ TODO | `StreamProvider.family` by month |
| Build `ExpenseListScreen` with `MonthPicker` | ⬜ TODO | Shows remaining amount header |
| Build `ExpenseListItem` widget | ⬜ TODO | Swipe-to-delete support |
| Build `ExpenseFormScreen` (add/edit) | ⬜ TODO | Category select, person select (loans) |
| Build `ExpenseDetailScreen` | ⬜ TODO | |
| Build `MonthPicker` shared widget | ⬜ TODO | |
| Build `AmountDisplay` shared widget | ⬜ TODO | |

**Exit Criteria**: Add, edit, delete, and list expenses by month. Loan type supported.

---

### ✅ Phase 6 — Expense Drafts
**Goal**: Reusable draft templates with installment payments.

| Task | Status | Notes |
|---|---|---|
| Port `expense-draft.model.ts` → `expense_draft.model.dart` | ⬜ TODO | Includes installments + loan fields |
| Port `ExpenseDraftService` → `expense_draft_service.dart` | ⬜ TODO | CRUD + pay-installment logic |
| Create `expense_draft_provider.dart` | ⬜ TODO | |
| Build `DraftListScreen` | ⬜ TODO | Shows pending vs paid status |
| Build `DraftFormScreen` | ⬜ TODO | |
| Build `DraftCard` widget | ⬜ TODO | Installment progress indicator |
| Implement "pay installment" action | ⬜ TODO | Deducts from draft balance |

**Exit Criteria**: Drafts can be created, paid by installment, and reused monthly.

---

### ✅ Phase 7 — Savings
**Goal**: Bank accounts, saving goals, entries, and loan summary.

| Task | Status | Notes |
|---|---|---|
| Port `saving.model.ts` → `saving.model.dart` | ⬜ TODO | `SavingGoal`, `SavingEntry`, `BankAccount` |
| Port `SavingService` → `saving_service.dart` | ⬜ TODO | Deposit, withdraw, goal CRUD |
| Create `saving_provider.dart` | ⬜ TODO | |
| Build `SavingsScreen` (goals + bank accounts) | ⬜ TODO | |
| Build `SavingGoalCard` widget | ⬜ TODO | Duration period display |
| Build `BankAccountCard` widget | ⬜ TODO | |
| Build `LoanSummaryScreen` | ⬜ TODO | Total pending loans + list |
| "Also record as expense" checkbox on deposit | ⬜ TODO | Creates expense with `Savings` category |

**Exit Criteria**: Saving goals, deposits, withdrawals, bank accounts, and loan summary all work.

---

### ✅ Phase 8 — Dashboard
**Goal**: Summary cards + 6-month trend chart.

| Task | Status | Notes |
|---|---|---|
| Port `DashboardService` → `dashboard_service.dart` | ⬜ TODO | `getCurrentMonthSummary`, `getMonthlyTrend` |
| Create `dashboard_provider.dart` | ⬜ TODO | |
| Build `DashboardScreen` | ⬜ TODO | |
| Build `SummaryCard` widget (Income, Expenses, Savings, Remaining) | ⬜ TODO | |
| Build `MonthlyTrendChart` with `fl_chart` | ⬜ TODO | Bar/line chart for 6 months |
| Apply correct remaining formula | ⬜ TODO | `income - expenses - (savings - savingsInExpenses)` |

**Exit Criteria**: Dashboard displays accurate monthly summary and chart.

---

### ✅ Phase 9 — App Tour / Guided Onboarding
**Goal**: Per-screen guided tour for new users.

| Task | Status | Notes |
|---|---|---|
| Port `TourService` logic → `tour_provider.dart` | ⬜ TODO | Persists `completedTourPages` in Firestore |
| Integrate `tutorial_coach_mark` package | ⬜ TODO | |
| Define tour steps for all 5 screens | ⬜ TODO | Match existing web app steps |
| Add "restart tour" button in app bar | ⬜ TODO | |

**Exit Criteria**: First-time users get a tour. Subsequent visits skip it.

---

### ✅ Phase 10 — Polish & Release Prep
**Goal**: Production-ready app.

| Task | Status | Notes |
|---|---|---|
| Add shimmer loaders to all list screens | ⬜ TODO | |
| Add pull-to-refresh on all list screens | ⬜ TODO | |
| Form validation and error display | ⬜ TODO | |
| Empty state illustrations | ⬜ TODO | |
| App icon + splash screen | ⬜ TODO | |
| Set app name to "Expense Expert" | ⬜ TODO | |
| Android `google-services.json` configured | ⬜ TODO | |
| iOS `GoogleService-Info.plist` configured | ⬜ TODO | |
| Run `flutter analyze` — zero warnings | ⬜ TODO | |
| Test on physical Android + iOS devices | ⬜ TODO | |
| Build release APK + IPA | ⬜ TODO | |

**Exit Criteria**: App passes analysis, builds release artifacts, runs on both platforms.

---

## 📊 Progress Summary

| Phase | Name | Status | Completion |
|---|---|---|---|
| 0 | Project Bootstrap | ⬜ TODO | 0% |
| 1 | Authentication | ⬜ TODO | 0% |
| 2 | Core Layout & Navigation | ⬜ TODO | 0% |
| 3 | Profile & Income | ⬜ TODO | 0% |
| 4 | Categories & Persons | ⬜ TODO | 0% |
| 5 | Expenses (CRUD) | ⬜ TODO | 0% |
| 6 | Expense Drafts | ⬜ TODO | 0% |
| 7 | Savings | ⬜ TODO | 0% |
| 8 | Dashboard | ⬜ TODO | 0% |
| 9 | App Tour / Onboarding | ⬜ TODO | 0% |
| 10 | Polish & Release Prep | ⬜ TODO | 0% |

**Legend**: ⬜ TODO &nbsp;|&nbsp; 🔄 IN PROGRESS &nbsp;|&nbsp; ✅ DONE &nbsp;|&nbsp; 🚫 BLOCKED

---

## 📝 Changelog <a name="changelog"></a>

| Date | Version | Author | Description |
|---|---|---|---|
| 2026-05-25 | v0.1.0 | Antigravity AI | Initial `FEATURE_TRACKER.MD` created. Full phase plan drafted based on Angular web app analysis. Development rules and tech stack defined. |

---

*Update this file after every phase completion or significant task change.*
