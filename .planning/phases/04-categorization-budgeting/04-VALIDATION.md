---
phase: 4
slug: categorization-budgeting
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-08-23
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 29.x + jest-expo + @testing-library/react-native |
| **Config file** | `expense-expert-rn/jest.config.js` |
| **Quick run command** | `npm test -- __tests__/features/categories/ __tests__/features/budgets/` |
| **Full suite command** | `npm test && npx tsc --noEmit` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- __tests__/features/categories/ __tests__/features/budgets/`
- **After every plan wave:** Run `npm test && npx tsc --noEmit`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 20 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 04-01-01 | 01 | 1 | CAT-01 | — | N/A | unit | `npm test -- __tests__/features/categories/category.service.test.ts` | ❌ W0 | ⬜ pending |
| 04-01-02 | 01 | 1 | CAT-01 | — | N/A | unit | `npm test -- __tests__/features/categories/CategoryProvider.test.tsx` | ❌ W0 | ⬜ pending |
| 04-02-01 | 02 | 2 | CAT-02 | — | N/A | unit | `npm test -- __tests__/features/expenses/filter.util.test.ts` | ❌ W0 | ⬜ pending |
| 04-02-02 | 02 | 2 | CAT-02 | — | N/A | unit | `npm test -- __tests__/features/expenses/useTransactionFilters.test.ts` | ❌ W0 | ⬜ pending |
| 04-03-01 | 03 | 3 | CAT-03 | — | N/A | unit | `npm test -- __tests__/features/budgets/budget.util.test.ts` | ❌ W0 | ⬜ pending |
| 04-03-02 | 03 | 3 | CAT-03 | — | N/A | unit | `npm test -- __tests__/features/budgets/budget.service.test.ts` | ❌ W0 | ⬜ pending |
| 04-04-01 | 04 | 4 | CAT-01..03 | — | N/A | unit | `npm test -- __tests__/features/budgets/BudgetProgressBar.test.tsx` | ❌ W0 | ⬜ pending |
| 04-04-02 | 04 | 4 | CAT-01..03 | — | N/A | typecheck | `npx tsc --noEmit` | ❌ W0 | ⬜ pending |
| 04-04-03 | 04 | 4 | CAT-01..03 | — | N/A | build | `npm run build:web` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `__tests__/features/categories/category.service.test.ts` — Custom category service & offline persistence tests
- [ ] `__tests__/features/categories/CategoryProvider.test.tsx` — CategoryContext reactive store tests
- [ ] `__tests__/features/expenses/filter.util.test.ts` — Multi-dimensional search & filter pure engine tests
- [ ] `__tests__/features/expenses/useTransactionFilters.test.ts` — Transaction filter hook tests
- [ ] `__tests__/features/budgets/budget.util.test.ts` — Integer cents budget math and threshold tests
- [ ] `__tests__/features/budgets/budget.service.test.ts` — Category budget service Firestore tests
- [ ] `__tests__/features/budgets/BudgetProgressBar.test.tsx` — Budget progress visual indicator component tests

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Custom Category Creation Modal & Grid | CAT-01 | Visual touch/click emoji selection | Open modal, pick emoji, type name, verify new card appears |
| Transaction Filter Bar & Date Selector | CAT-02 | Visual filter chips and search bar interaction | Select category chip, pick 'This Week', verify filtered count updates |
| Visual Budget Progress Bar Thresholds | CAT-03 | Visual color validation (green < 80%, amber 80-99%, red >= 100%) | View category budget cards under, near, and exceeding budget |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 20s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-08-23
