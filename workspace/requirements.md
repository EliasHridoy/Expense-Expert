# Project Requirements Specification: Expense Expert Modernization

## 1. Executive Summary

**Expense Expert** is a comprehensive personal finance, expense tracking, savings management, and loan reconciliation application. The goal of this project is to modernize and migrate the existing Angular 18 web application (`@expense-expert`) into a unified **React Native cross-platform application** supporting **Mobile (iOS & Android)** and **Web**, backed by **Firebase** services, with **Docker containerization** for isolated local development and testing.

---

## 2. Project Vision & Key Objectives

1. **Cross-Platform React Native Implementation**: Rebuild the Angular application using **React Native with Expo**, enabling unified codebase execution across Web, Android, and iOS.
2. **Docker Containerization**: Provide a fully isolated Docker environment (`Dockerfile` & `docker-compose.yml`) ensuring reproducible builds, dependencies isolation, and easy local test execution.
3. **Seamless Firebase Integration**: Retain existing Firestore data schemas (`users/{userId}/...`) and Firebase Authentication to ensure full data compatibility and zero data loss for existing users.
4. **Local Testing & Testability**: Ensure the new app can be easily built, tested, and run on a local development machine with comprehensive unit and end-to-end testing setups.
5. **Architectural & UX Enhancements**: Introduce key mobile-native improvements such as offline caching, biometric lock, push notifications, and enhanced analytics.

---

## 3. Scope of Work & Functional Requirements

### 3.1. User Authentication & Profile Management
- **Firebase Auth**: Support Email/Password sign-in and registration with auth state persistence.
- **Protected Routing**: Guest guards for login/register pages; Auth guards for main layout and feature routes.
- **Salary & Income Setup**:
  - Base monthly salary configuration.
  - Historical monthly salary tracking (`salaries: { [month: string]: number }`).
- **Additional Income Sources**:
  - Add/Edit/Delete static and recurring income entries (`income_entries` and `income_drafts`).
- **User Profile Settings**: Theme preferences (Dark / Light / System), profile summary.

### 3.2. Dashboard & Financial Analytics
- **Monthly Financial Summary**:
  - Total Income (Base Salary + Additional Income + Loans Taken Income).
  - Total Expenses & Total Savings.
  - Remaining Balance calculation with previous month balance rollover.
  - Total Expense count.
- **Visual Analytics**:
  - Monthly Expense vs. Saving trends (interactive charts).
  - Category Breakdown (percentage, count, and total amount per category: *Food, Transport, Entertainment, Utilities, Savings, Loan Repayment, Other*).
- **Onboarding / Feature Tour**: Cross-platform interactive app tour/walkthrough for first-time users.

### 3.3. Expense Management
- **Expense CRUD**:
  - Fields: Title, Description, Amount, Category, Date, Month (`YYYY-MM`), `isLoan` flag, `loanPersonId`, `loanCleared` state, `loanRepaid`, `draftId`, `installmentIndex`.
- **Filtering & Search**:
  - Search by title/description.
  - Filter by Category, Month range, or Loan association.
  - Sorting by date, amount, or creation timestamp.
- **Expense Detail View**: Complete history breakdown for individual transactions.

### 3.4. Expense Drafts & Installment Tracker
- **Recurring Draft Templates**:
  - Template creation (`CreateDraftDto`) with target amount, category, loan flag, and planned installment count (`installmentCount`).
  - Active/Inactive toggle for draft templates.
- **Monthly Draft Applications**:
  - Automatic/Manual application of drafts into specific monthly tracking cards.
  - Status tracking: `Pending`, `Partial`, `Completed`.
  - Payment logging per installment (`DraftPayment[]`) linking directly to generated Expense records.

### 3.5. Savings & Goal Tracking
- **Bank Account Directory**:
  - Add, edit, remove bank accounts (Account Name, Account Number, Bank Name).
- **Saving Goals**:
  - Purpose, Target Amount, Saved Amount.
  - Duration configuration (Value + Unit: *months* or *years*).
  - Start Month (`YYYY-MM`) and computed End Month.
  - Association with specific Bank Account.
- **Saving Entries (Transactions)**:
  - Deposit and Withdrawal logging with date, amount, goal link, and notes.
  - Automatic recalculation of goal progress (`savedAmount`).
- **Saving Summaries & History**: Detailed audit trail of savings transactions across goals.

### 3.6. Loans & Debt Reconciliation
- **Person Directory**: Management of contacts/people involved in personal loans (`persons` collection).
- **Loans Taken**:
  - Record loans borrowed from individuals (Amount, Note, Month, Date).
  - Track loan statuses (`active`, `partially_repaid`, `cleared`) and cumulative repayments.
- **Loan Repayment Integration**:
  - Logging an expense under `LoanRepayment` category updates the associated `LoanTaken` record's `repaid` amount and status automatically.

---

## 4. Technical Architecture & Tech Stack

| Layer | Technology | Rationale |
| :--- | :--- | :--- |
| **Core Framework** | **React Native (Expo SDK 51+)** | Universal cross-platform engine targeting iOS, Android, and Web (`react-native-web`). |
| **Navigation** | **React Navigation v6 / Expo Router** | Stack & Tab navigation with deep linking and web URL route matching. |
| **State & Data Fetching** | **Zustand / TanStack React Query** | Lightweight global state management and reactive data fetching/caching. |
| **Database & Auth** | **Firebase JS SDK (v10+)** | Auth (Email/Pass) + Firestore real-time database matching existing document schema. |
| **Styling** | **NativeWind (Tailwind CSS for RN)** | Consistent visual design system shared between Web and Mobile views. |
| **Data Visualization** | **Victory Native / React Native Chart Kit** | Responsive cross-platform charting for financial trends and category breakdowns. |
| **Environment / Container** | **Docker & Docker Compose** | Isolated container environment for Node.js, Expo CLI, and local web testing. |

---

## 5. Firebase Data Schema & Rules Mapping

The React Native application will strictly preserve the existing Firestore document structure under `users/{userId}`:

- `users/{userId}`: User profile data (salary, settings).
- `users/{userId}/expenses/{expenseId}`: Expense transactions.
- `users/{userId}/expense_drafts/{draftId}`: Draft templates.
- `users/{userId}/draft_applications/{appId}`: Monthly draft application state.
- `users/{userId}/income_entries/{entryId}`: Income records.
- `users/{userId}/income_drafts/{draftId}`: Income draft templates.
- `users/{userId}/persons/{personId}`: Person contact list for loans.
- `users/{userId}/loans_taken/{loanId}`: Debt records.
- `users/{userId}/bank_accounts/{accountId}`: Registered bank accounts.
- `users/{userId}/saving_goals/{goalId}`: Savings goals.
- `users/{userId}/saving_entries/{entryId}`: Savings deposits/withdrawals.

**Security Rule Set**:
```cel
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      match /{document=**} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```

---

## 6. Docker & Local Development Setup Requirements

1. **Docker Isolation**:
   - `Dockerfile`: Multi-stage build for Node.js environment supporting Expo web server and testing tools.
   - `docker-compose.yml`: Configure services for `web` (Expo web on port `8081` / `19006`) and optional `firebase-emulator` (ports `8080`, `9099`).
2. **Local Machine Execution**:
   - Web application exposed via standard HTTP port for immediate browser testing.
   - Metro Bundler QR code exposed for Expo Go mobile device testing on local Wi-Fi network.
3. **Environment Configuration**:
   - `.env` template supporting Firebase config keys (`EXPO_PUBLIC_FIREBASE_API_KEY`, `EXPO_PUBLIC_FIREBASE_PROJECT_ID`, etc.).

---

## 7. Recommended Architectural & Feature Improvements

As requested in `AGENT.md`, the following modernization improvements are recommended for implementation:

1. **Offline-First Persistence**: Utilize `@react-native-async-storage/async-storage` combined with Firestore offline persistence to enable full offline expense logging with background sync when back online.
2. **Biometric Security**: Integrate `expo-local-authentication` to support Face ID / Touch ID / Fingerprint app locking on mobile devices.
3. **Push & Local Notifications**: Integrate `expo-notifications` for monthly bill reminders, installment due dates, and savings goal milestones.
4. **Data Export & PDF Reports**: Provide CSV and PDF export functionality (`expo-print` / `expo-sharing`) for monthly financial statements.
5. **Multi-Currency Support & Formatting**: Introduce configurable currency formatting (USD, EUR, BDT, GBP, etc.) across the app settings.
6. **Enhanced Loan Auto-Reconciliation**: Implement atomic Firestore batch updates when creating loan repayment expenses to prevent race conditions in debt balance tracking.

---

## 8. Non-Functional Requirements

- **Performance**: Mobile app rendering at stable 60 FPS with responsive web layout scaling smoothly from mobile screens up to 4K displays.
- **Security**: Secure storage for user tokens and biometric tokens via `expo-secure-store`.
- **Accessibility**: Minimum touch target size of 48x48dp on mobile, screen reader support, high-contrast dark mode support.
- **Maintainability**: Strict TypeScript configuration (`strict: true`), clean modular architecture separating Core, Features, and Components.

---

## 9. Verification & Acceptance Criteria

- [ ] React Native app runs locally via web (`npm run web` / Docker container) and mobile bundler (`npm start`).
- [ ] User can register, login, and authenticate against Firebase Auth.
- [ ] Expense CRUD operations function seamlessly with real-time Firestore updates.
- [ ] Expense Drafts and Installment tracking update payments correctly.
- [ ] Saving Goals, Bank Accounts, and Saving Entries calculate balances accurately.
- [ ] Loans Taken and Loan Repayments reconcile balance accurately.
- [ ] Visual charts load and display monthly income/expense/saving data correctly on both Web and Mobile viewports.
- [ ] Docker container successfully builds and runs tests locally without environment leakage.
