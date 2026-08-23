---
phase: 6
slug: real-time-synchronization-stability
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-08-23
---

# Phase 6 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 29.x + jest-expo + @testing-library/react-native |
| **Config file** | `expense-expert-rn/jest.config.js` |
| **Quick run command** | `npm test -- __tests__/features/sync/` |
| **Full suite command** | `npm test && npx tsc --noEmit` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- __tests__/features/sync/`
- **After every plan wave:** Run `npm test && npx tsc --noEmit`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 20 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 06-01-01 | 01 | 1 | SYNC-01 | — | N/A | unit | `npm test -- __tests__/features/sync/subscription-manager.test.ts` | ❌ W0 | ⬜ pending |
| 06-01-02 | 01 | 1 | SYNC-01, SYNC-02 | — | N/A | unit | `npm test -- __tests__/features/sync/useFirestoreCollection.test.ts` | ❌ W0 | ⬜ pending |
| 06-02-01 | 02 | 2 | SYNC-01, SYNC-02 | — | N/A | unit | `npm test -- __tests__/features/expenses/ExpenseProviderRealtime.test.tsx` | ❌ W0 | ⬜ pending |
| 06-02-02 | 02 | 2 | SYNC-01, SYNC-02 | — | N/A | unit | `npm test -- __tests__/features/categories/CategoryProviderRealtime.test.tsx` | ❌ W0 | ⬜ pending |
| 06-02-03 | 02 | 2 | SYNC-01, SYNC-02 | — | N/A | unit | `npm test -- __tests__/features/budgets/BudgetProviderRealtime.test.tsx` | ❌ W0 | ⬜ pending |
| 06-03-01 | 03 | 3 | SYNC-02 | — | N/A | unit | `npm test -- __tests__/components/ErrorBoundary.test.tsx` | ❌ W0 | ⬜ pending |
| 06-03-02 | 03 | 3 | SYNC-02 | — | N/A | unit | `npm test -- __tests__/components/ToastNotification.test.tsx` | ❌ W0 | ⬜ pending |
| 06-04-01 | 04 | 4 | SYNC-01, SYNC-02 | — | N/A | unit | `npm test` | ❌ W0 | ⬜ pending |
| 06-04-02 | 04 | 4 | SYNC-01, SYNC-02 | — | N/A | typecheck | `npx tsc --noEmit` | ❌ W0 | ⬜ pending |
| 06-04-03 | 04 | 4 | SYNC-01, SYNC-02 | — | N/A | build | `npm run build:web` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `__tests__/features/sync/subscription-manager.test.ts` — Subscription manager listener pooling and deterministic unsubscribe tests
- [ ] `__tests__/features/sync/useFirestoreCollection.test.ts` — React lifecycle Firestore onSnapshot hook tests
- [ ] `__tests__/features/expenses/ExpenseProviderRealtime.test.tsx` — Expense provider live onSnapshot and optimistic merge tests
- [ ] `__tests__/features/categories/CategoryProviderRealtime.test.tsx` — Category provider live onSnapshot tests
- [ ] `__tests__/features/budgets/BudgetProviderRealtime.test.tsx` — Budget provider live onSnapshot tests
- [ ] `__tests__/components/ErrorBoundary.test.tsx` — Global React ErrorBoundary crash recovery tests
- [ ] `__tests__/components/ToastNotification.test.tsx` — Toast notification and connectivity banner overlay tests

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Real-time Multi-Tab / Multi-Device Sync | SYNC-01 | Live Firestore write reflection without reload | Add an expense in one tab/browser, verify it appears instantly on the second without refreshing |
| Offline Mutation Auto-Reconnection Sync | SYNC-02 | Device airplane mode round-trip | Disconnect network, create an expense/budget, observe offline banner, reconnect, verify auto-sync toast |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 20s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-08-23
