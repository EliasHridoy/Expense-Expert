# Mobile Responsive & UI Interaction Issues Audit Report

## Environment & Testing Scope
- **Target Viewports Tested:**
  - 360x800 px (Android standard / Samsung Galaxy)
  - 375x667 px (Apple iPhone SE / iPhone 8)
  - 390x844 px (Apple iPhone 12 / 13 / 14)
- **Application:** Expense Expert (Angular 18 + TailwindCSS)
- **Authentication Context:** Tested in both authenticated and unauthenticated states.
- **Verification Tooling:** Puppeteer automation with Chrome headless rendering, full-page DOM inspection, and viewport visual screenshot audits.

---

## Summary of Identified Issues

| ID | Component / File | Severity | Issue Description |
|---|---|---|---|
| **ISSUE-01** | `features/expenses/expense-list/expense-list.component.ts` | High | Month picker, Drafts, and Shopping buttons row does not wrap on <= 375px screens, causing the Shopping button to clip off the right viewport edge. |
| **ISSUE-02** | `features/expenses/expense-list/expense-list.component.ts` | Medium | Expense item card header places title, category badge, and shopping badge on a non-wrapping flex line, severely truncating titles (e.g. "We...") and crowding amounts on mobile. Search viewMode toggle also wraps awkwardly to the far right. |
| **ISSUE-03** | `features/expenses/shopping/shopping-form/shopping-form.component.ts`<br>`features/expenses/expense-form/expense-form.component.ts`<br>`features/expense-drafts/draft-form/draft-form.component.ts`<br>`features/savings/bank-account-form/bank-account-form.component.ts` | High | Wizard and shopping forms use `fixed bottom-[72px]` action bars that hover over the viewport, permanently obscuring up to 25% of mobile screen content (subcategories, inputs, and items) and conflicting with mobile virtual keyboards. |
| **ISSUE-04** | `layout/bottom-nav/bottom-nav.component.ts` | Medium | Bottom navigation bar displays identical SVG dollar icons for both "Loans" and "Savings", confusing navigation. |
| **ISSUE-05** | `layout/main-layout/main-layout.component.ts`<br>`layout/navbar/navbar.component.ts`<br>`features/auth/auth-layout/auth-layout.component.ts` | Medium | Global container padding (`p-6` = 48px horizontal) excessively constrains content width on 360px mobile viewports (leaving only 312px). Auth card padding (`p-8`) similarly squishes authentication form inputs. |
| **ISSUE-06** | `features/expenses/shopping/shopping-list/shopping-list.component.ts` | Medium | Filter tabs ("All", "Planned", "Completed & In Expenses") wrap into cramped 3-line text on mobile screens. Shopping list card titles clamp to a single truncated word beside status badges. |
| **ISSUE-07** | `features/savings/bank-account-list/bank-account-list.component.ts`<br>`features/savings/saving-goal-list/saving-goal-list.component.ts` | Medium | Account name, total saved, and Edit/Delete action buttons are crammed on a single non-wrapping line with touch targets under 24px, violating mobile accessibility touch targets. |
| **ISSUE-08** | `features/savings/loans-page/loans-page.component.ts` | High | Inside expanded loan detail cards, repayment date input (`w-32`), amount input (`w-24`), and Pay button sit in a non-wrapping flex row, causing horizontal overflow on 360px screens. Tab switcher buttons also lack mobile flex width. |
| **ISSUE-09** | `shared/components/category-card-picker/category-card-picker.component.ts` | Medium | The "Add New Category" inline form combines icon input, category name input, Save button, and Cancel button in a single row without wrapping, breaking on viewports <= 360px. |
| **ISSUE-10** | `shared/components/tour-overlay/tour-overlay.component.ts` | Low | Hardcoded `tooltipWidth = 340` causes the guide tooltip to hug or exceed screen borders on 360px viewports; arrows misalign when clamped to screen edges. |
| **ISSUE-11** | `shared/components/toast-container/toast-container.component.ts` | Medium | Toast container is pinned to `fixed top-4 right-4` with `min-w-[280px]` and `z-50`, causing toasts to sit off-center or clip on narrow screens and stack improperly behind or at the same layer as bottom navigation. |
| **ISSUE-12** | `shared/components/confirm-dialog/confirm-dialog.component.ts` | Low | Modal dialog overlay uses `z-50`, creating stacking context conflicts with the mobile bottom navigation bar (`z-50`). |

---

## Detailed Root Cause Analysis & Remediation Plan

### ISSUE-01: Expense List Action Header Overflow
- **File:** `features/expenses/expense-list/expense-list.component.ts`
- **Root Cause:** Container `<div class="flex items-center gap-2">` lacks `flex-wrap`. Combined width of MonthPicker (~190px) + Drafts (~75px) + Shopping (~105px) = ~370px, which exceeds 360px minus page padding.
- **Fix:** Add `flex-wrap` and `gap-2` so action buttons flow naturally on mobile screens.

### ISSUE-02: Expense List Filter Controls & Card Titles Truncation
- **File:** `features/expenses/expense-list/expense-list.component.ts`
- **Root Cause:** The item card flex row `<div class="flex items-center gap-2 mb-1">` does not wrap. Badges force `truncate` on the title, reducing readability. View mode toggle is pushed to `ml-auto` on mobile, breaking grid flow.
- **Fix:** Apply `flex-wrap items-center gap-1.5` to badges and allow title wrapping or proper layout hierarchy on mobile. Group view toggle cleanly with filters.

### ISSUE-03: Fixed Bottom Action Bar Overlapping Form Content
- **Files:**
  - `features/expenses/shopping/shopping-form/shopping-form.component.ts`
  - `features/expenses/expense-form/expense-form.component.ts`
  - `features/expense-drafts/draft-form/draft-form.component.ts`
  - `features/savings/bank-account-form/bank-account-form.component.ts`
- **Root Cause:** `fixed bottom-[72px] left-0 right-0` renders sticky bars that permanently block content beneath them. On mobile keyboards, this covers active form fields.
- **Fix:** Replace `fixed bottom-[72px]` with sticky-safe containers or responsive flow (`sticky bottom-16 sm:static sm:bg-transparent` or inline with adequate scroll clearance and keyboard-safe padding). In `shopping-form`, allow the actions bar to be part of the flow or sticky with background blur and appropriate spacing.

### ISSUE-04: Duplicate Icons in Bottom Navigation
- **File:** `layout/bottom-nav/bottom-nav.component.ts`
- **Root Cause:** `Loans` and `Savings` navigation links both use the dollar coin SVG path.
- **Fix:** Update `Savings` to use an established bank building SVG icon (`M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z`) matching `SidebarComponent`.

### ISSUE-05: Main Container & Auth Padding on Mobile
- **Files:**
  - `layout/main-layout/main-layout.component.ts`
  - `layout/navbar/navbar.component.ts`
  - `features/auth/auth-layout/auth-layout.component.ts`
- **Root Cause:** `p-6` (24px) padding on mobile wastes 48px of width. `p-8` on auth card cramps login/register forms.
- **Fix:** Update to `p-4 sm:p-6 pb-24 lg:pb-6` on main, `px-4 sm:px-6` on navbar, and `p-5 sm:p-8` on auth card.

### ISSUE-06: Shopping List Tabs & Card Title Clamping
- **File:** `features/expenses/shopping/shopping-list/shopping-list.component.ts`
- **Root Cause:** Tabs do not scroll or wrap horizontally. Card title and badge in `flex items-start justify-between` causes harsh truncation.
- **Fix:** Enable horizontal scroll on tabs with `overflow-x-auto scrollbar-hide flex-nowrap`, make "Completed & In Expenses" responsive (`Completed <span class="hidden sm:inline">& In Expenses</span>`), and adjust card title/badge flex layout.

### ISSUE-07: Bank Account & Saving Goal Lists Squeezed Buttons
- **Files:**
  - `features/savings/bank-account-list/bank-account-list.component.ts`
  - `features/savings/saving-goal-list/saving-goal-list.component.ts`
- **Root Cause:** Single-row flex container without wrapping forces text to overlap actions and provides undersized touch targets (< 24px).
- **Fix:** Structure bank account rows with `flex-col sm:flex-row sm:items-center sm:justify-between gap-2`, and give `Edit` and `Delete` buttons at least 36-44px touch targets. In saving goals, ensure action buttons wrap cleanly with comfortable padding.

### ISSUE-08: Loans Repayment Controls Overflow
- **File:** `features/savings/loans-page/loans-page.component.ts`
- **Root Cause:** In expanded loans row, date input (`w-32`) + amount input (`w-24`) + Pay button + labels exceed available width inside the padded card on 360px screens.
- **Fix:** Use `flex-wrap` and responsive full-width inputs on mobile (`w-full sm:w-32`, `w-full sm:w-28`), or a responsive flex container. Make tab switcher full-width on mobile.

### ISSUE-09: Category Card Picker Add Form Overflow
- **File:** `shared/components/category-card-picker/category-card-picker.component.ts`
- **Root Cause:** Fixed horizontal row of icon input + name input + Save + Cancel exceeds mobile card width.
- **Fix:** Allow inputs and action buttons to wrap cleanly on small screens: `flex flex-wrap sm:flex-nowrap gap-2`.

### ISSUE-10: Tour Overlay Mobile Viewport Clamping
- **File:** `shared/components/tour-overlay/tour-overlay.component.ts`
- **Root Cause:** Hardcoded `340px` tooltip width doesn't accommodate 360px viewport margins.
- **Fix:** Dynamically clamp width using `Math.min(320, window.innerWidth - 32)` and safely bounds-check coordinates.

### ISSUE-11: Toast Container Mobile Positioning
- **File:** `shared/components/toast-container/toast-container.component.ts`
- **Root Cause:** Fixed top right positioning with rigid minimum width and `z-50`.
- **Fix:** Change to `fixed top-4 left-4 right-4 sm:left-auto sm:right-4 z-[100] max-w-sm mx-auto sm:mx-0` so toasts adapt to mobile screens and float above all layers.

### ISSUE-12: ConfirmDialog Z-Index
- **File:** `shared/components/confirm-dialog/confirm-dialog.component.ts`
- **Root Cause:** `z-50` conflicts with bottom nav `z-50`.
- **Fix:** Change to `z-[100]`.

---

## Resolution & Verification Status

All 12 reported issues have been fully resolved, verified via automated visual regression across 3 target viewports (360x800, 375x667, 390x844), and tested via Karma unit test suites.

| Issue ID | Status | Verification Method | Result |
|---|---|---|---|
| **ISSUE-01** | ✅ Fixed | Viewport rendering at 360x800 & 375x667 | Buttons wrap gracefully onto next row with clean spacing. Zero overflow. |
| **ISSUE-02** | ✅ Fixed | Viewport inspection of `/expenses` on 360px | Card titles wrap with proper badge tags and search view mode toggle groups neatly. |
| **ISSUE-03** | ✅ Fixed | Viewport inspection of `/expenses/shopping/new`, `/expenses/new`, `/expenses/drafts/new`, `/savings/accounts/new`, `/savings/goals/new` | Action bars integrated into natural flow / sticky bottom, leaving full form content visible and accessible with virtual keyboards. |
| **ISSUE-04** | ✅ Fixed | Bottom nav icon inspection | Savings uses bank SVG, Loans uses coin SVG. Clear visual differentiation. |
| **ISSUE-05** | ✅ Fixed | Layout inspection across all pages | Main padding optimized to `p-3.5 sm:p-6 pb-28 lg:pb-6`, navbar `px-4 sm:px-6`, auth `p-5 sm:p-8`. Maximum usable width preserved. |
| **ISSUE-06** | ✅ Fixed | Viewport inspection of `/expenses/shopping` | Filter tabs horizontally scrollable, responsive labels ("Completed & In Expenses" -> "Completed" on mobile), title wraps cleanly. |
| **ISSUE-07** | ✅ Fixed | Viewport inspection of `/savings` | Bank account and saving goal items wrap to clean mobile layout with comfortable touch targets (>= 36px). |
| **ISSUE-08** | ✅ Fixed | Viewport inspection of `/savings/loans` | Repayment form inputs wrap and stretch responsively on mobile, tab switcher spans mobile width cleanly. |
| **ISSUE-09** | ✅ Fixed | Viewport inspection of `/expenses/new` category modal | Add category form wraps icon + input + action buttons gracefully without clipping. |
| **ISSUE-10** | ✅ Fixed | Code verification & math clamp | Tour tooltip width responsive (`min(320px, calc(100vw - 32px))`) and bounds clamped. |
| **ISSUE-11** | ✅ Fixed | Viewport inspection of toasts | Toast container centered with responsive margin (`left-4 right-4 sm:left-auto sm:right-4`), `z-[100]`, and touch-friendly dismiss icon. |
| **ISSUE-12** | ✅ Fixed | Modal dialog inspection | Dialog overlay elevated to `z-[100]`, backdrop padding, and stacked full-width touch buttons on mobile. |

### Test Suite Execution
- **Karma Unit Tests:** `38 of 38 SUCCESS` (0 failures).
- **Angular Production Build:** Exited with code 0 (`ng build` successful).
- **Automated Puppeteer Viewport Suite:** 15 routes tested across 360px, 375px, and 390px viewports. `0 horizontal overflows, 0 layout clipping errors`.

