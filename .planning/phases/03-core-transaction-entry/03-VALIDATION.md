---
phase: 3
slug: core-transaction-entry
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-08-23
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 29.x + jest-expo + @testing-library/react-native |
| **Config file** | `expense-expert-rn/jest.config.js` |
| **Quick run command** | `npm test -- __tests__/features/expenses/` |
| **Full suite command** | `npm test && npx tsc --noEmit` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- __tests__/features/expenses/`
- **After every plan wave:** Run `npm test && npx tsc --noEmit`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 20 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 03-01-01 | 01 | 1 | TXN-02 | — | N/A | unit | `npm test -- __tests__/features/expenses/currency.util.test.ts` | ❌ W0 | ⬜ pending |
| 03-01-02 | 01 | 1 | TXN-01 | — | N/A | unit | `npm test -- __tests__/features/expenses/date.util.test.ts` | ❌ W0 | ⬜ pending |
| 03-02-01 | 02 | 2 | TXN-03 | — | N/A | unit | `npm test -- __tests__/features/expenses/offline-queue.service.test.ts` | ❌ W0 | ⬜ pending |
| 03-02-02 | 02 | 2 | TXN-01, TXN-03 | — | N/A | unit | `npm test -- __tests__/features/expenses/expense.service.test.ts` | ❌ W0 | ⬜ pending |
| 03-03-01 | 03 | 3 | TXN-01, TXN-02 | — | N/A | unit | `npm test -- __tests__/features/expenses/ExpenseForm.test.tsx` | ❌ W0 | ⬜ pending |
| 03-04-01 | 04 | 4 | TXN-01, TXN-02, TXN-03 | — | N/A | typecheck | `npx tsc --noEmit` | ❌ W0 | ⬜ pending |
| 03-04-02 | 04 | 4 | TXN-01, TXN-02, TXN-03 | — | N/A | build | `npm run build:web` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `__tests__/features/expenses/currency.util.test.ts` — Integer currency math tests
- [ ] `__tests__/features/expenses/date.util.test.ts` — Date formatting & month partition tests
- [ ] `__tests__/features/expenses/offline-queue.service.test.ts` — Durable offline mutation queue tests
- [ ] `__tests__/features/expenses/expense.service.test.ts` — Expense service Firestore & offline tests
- [ ] `__tests__/features/expenses/ExpenseForm.test.tsx` — Expense entry wizard form interaction tests

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Multi-Step Form UI on Mobile & Web | TXN-01 | Visual touch/click wizard navigation and layout | Enter amount, select category, add note, view summary |
| Airplane Mode Offline Entry & Auto Sync | TXN-03 | End-to-end device network toggle round-trip | Disconnect network, save expense, reconnect, verify Firestore sync |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 20s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-08-23
