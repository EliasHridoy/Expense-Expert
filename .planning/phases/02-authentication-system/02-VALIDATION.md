---
phase: 2
slug: authentication-system
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-08-23
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 29.x + jest-expo + @testing-library/react-native |
| **Config file** | `expense-expert-rn/jest.config.js` |
| **Quick run command** | `npm test -- __tests__/features/auth/` |
| **Full suite command** | `npm test && npx tsc --noEmit` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- __tests__/features/auth/`
- **After every plan wave:** Run `npm test && npx tsc --noEmit`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 20 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 01 | 1 | AUTH-01, AUTH-02 | — | N/A | unit | `npm test -- __tests__/features/auth/auth.service.test.ts` | ❌ W0 | ⬜ pending |
| 02-01-02 | 01 | 1 | AUTH-01, AUTH-02 | — | N/A | unit | `npm test -- __tests__/features/auth/AuthProvider.test.tsx` | ❌ W0 | ⬜ pending |
| 02-02-01 | 02 | 2 | AUTH-01 | — | N/A | unit | `npm test -- __tests__/features/auth/LoginForm.test.tsx` | ❌ W0 | ⬜ pending |
| 02-02-02 | 02 | 2 | AUTH-01 | — | N/A | unit | `npm test -- __tests__/features/auth/RegisterForm.test.tsx` | ❌ W0 | ⬜ pending |
| 02-03-01 | 03 | 3 | AUTH-01, AUTH-02 | — | N/A | typecheck | `npx tsc --noEmit` | ❌ W0 | ⬜ pending |
| 02-03-02 | 03 | 3 | AUTH-01, AUTH-02 | — | N/A | build | `npm run build:web` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `__tests__/features/auth/auth.service.test.ts` — AuthService test suite
- [ ] `__tests__/features/auth/AuthProvider.test.tsx` — AuthContext & Provider test suite
- [ ] `__tests__/features/auth/LoginForm.test.tsx` — LoginForm test suite
- [ ] `__tests__/features/auth/RegisterForm.test.tsx` — RegisterForm test suite

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Web/Mobile Login & Register Flow | AUTH-01 | Real Firebase Auth interactive round-trip | Create account, log in, verify Firestore profile sync |
| Session Persistence Across Refresh | AUTH-02 | Visual verification of token persistence | Refresh browser or restart mobile bundle to verify session remains active |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 20s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-08-23
