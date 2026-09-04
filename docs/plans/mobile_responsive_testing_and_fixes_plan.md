# Implementation Plan - Mobile Responsive UI Testing, Issue Reporting & Resolution

## Objective
Run Expense Expert, rigorously test all UI components and pages for mobile responsiveness (360px, 375px, 390px, 414px) and UI interaction issues, document all identified glitches under `docs/issues/`, resolve every bug, verify the fixes with automated browser tests and unit tests, and submit a PR from a dedicated branch.

---

## Target Pages & UI Components to Test
1. **Authentication:**
   - `/auth/login` (inputs, buttons, responsive card)
   - `/auth/register` (form layout, validation messages)
2. **Main Layout & Navigation:**
   - Navbar (`layout/navbar`)
   - Bottom navigation bar on mobile (`layout/bottom-nav`)
   - Content bottom padding to prevent bottom-nav obscuring content
   - Tour overlay (`shared/components/tour-overlay`)
   - Toast container (`shared/components/toast-container`)
3. **Dashboard:**
   - Month picker (`shared/components/month-picker`)
   - Summary cards (`features/dashboard/summary-cards`)
   - Monthly chart (`features/dashboard/monthly-chart`)
   - Category breakdown (`features/dashboard/category-breakdown`)
   - Quick action buttons
4. **Expenses:**
   - Expense list (`features/expenses/expense-list`) - filters, view toggle, table vs cards on mobile, pagination
   - Expense form (`features/expenses/expense-form`) - category card picker, subcategory combobox, date/amount inputs, split payment/tags
   - Expense detail (`features/expenses/expense-detail`) - modal responsiveness, buttons
5. **Shopping & Grocery Lists:**
   - Shopping list (`features/expenses/shopping/shopping-list`) - tabs, cards, status badges
   - Shopping form (`features/expenses/shopping/shopping-form`) - item table/cards, quantities, units, dynamic price calculation, action buttons
6. **Expense Drafts & Installments:**
   - Draft list & draft form (`features/expense-drafts/draft-list`, `draft-form`)
   - Installment tracker (`features/expense-drafts/installment-tracker`)
7. **Savings, Bank Accounts & Loans:**
   - Savings overview (`features/savings/savings-page`)
   - Bank account list & form (`features/savings/bank-account-list`, `bank-account-form`)
   - Saving goal list & form (`features/savings/saving-goal-list`, `saving-goal-form`)
   - Loans & lending page (`features/savings/loans-page`)
8. **Profile:**
   - Profile page (`features/profile/profile-page`) - stats, cards, form inputs

---

## Testing Strategy
1. **Dev Server Launch:** Run `npm start` (`ng serve`) on `http://localhost:4200`.
2. **Mobile Viewport Automated Inspection:**
   - Create a Puppeteer test script (`scratch/test-mobile-responsive.js`) that:
     - Sets viewports: 360x800 (Galaxy S20/Android standard), 375x667 (iPhone SE), 390x844 (iPhone 12/14/15)
     - Logs in using `.env` test user credentials
     - Visits every route and opens interactive elements (dialogs, drawers, dropdowns, forms)
     - Detects horizontal document overflow (`document.documentElement.scrollWidth > window.innerWidth`)
     - Detects overflowing elements (`el.scrollWidth > el.clientWidth` for non-scrollable containers, or elements extending beyond viewport width)
     - Detects touch target sizes under 44px for primary interactions
     - Detects bottom-nav collision (interactive elements hidden beneath bottom navigation)
     - Captures screenshots for visual verification of every page
3. **Issue Reporting:**
   - Create `docs/issues/mobile_responsive_issues.md` with detailed descriptions, screenshots/paths, affected components, and root causes.
4. **Fix Implementation:**
   - Fix each reported issue in the respective component templates, SCSS/CSS, and TypeScript files.
5. **Retest & Validation:**
   - Re-run the automated mobile test suite; ensure 0 overflow errors and proper layouts.
   - Run `npm test -- --watch=false --browsers=ChromeHeadless` to ensure no regressions in unit tests.
   - Run `npm run build` to verify clean build without compilation errors.
6. **Git Branch & Pull Request:**
   - Verify changes are on `fix/mobile-responsive-and-ui-glitches`.
   - Commit changes with clear, descriptive commit messages.
   - Push to `origin fix/mobile-responsive-and-ui-glitches`.
   - Create Pull Request against `dev`.
