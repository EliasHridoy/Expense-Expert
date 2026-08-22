---
phase: 1
slug: foundation-environment-setup
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-08-23
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 29.x + jest-expo |
| **Config file** | `jest.config.js` / package.json |
| **Quick run command** | `npm test -- __tests__/services/firebase.test.ts` |
| **Full suite command** | `npm test && npx tsc --noEmit` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- __tests__/services/firebase.test.ts`
- **After every plan wave:** Run `npm test && npx tsc --noEmit`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 20 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 01-01-01 | 01 | 1 | ENV-01 | — | N/A | build | `docker compose build` | ❌ W0 | ⬜ pending |
| 01-01-02 | 01 | 1 | ENV-01 | — | N/A | smoke | `docker compose up -d && docker compose ps` | ❌ W0 | ⬜ pending |
| 01-02-01 | 02 | 2 | ENV-01 | — | N/A | typecheck | `npx tsc --noEmit` | ❌ W0 | ⬜ pending |
| 01-02-02 | 02 | 2 | ENV-01 | — | N/A | build | `npx expo export --platform web` | ❌ W0 | ⬜ pending |
| 01-03-01 | 03 | 3 | ENV-01 | — | N/A | unit | `npm test -- __tests__/services/firebase.test.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `Dockerfile` & `docker-compose.yml` — Container environment setup
- [ ] `package.json` — Expo, React Native, Firebase, Jest, and TypeScript dependencies
- [ ] `__tests__/services/firebase.test.ts` — Firebase initialization test suite

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Web UI in Browser | ENV-01 | Requires visual verification of rendered web interface | Open `http://localhost:8081` in a browser and verify layout |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 20s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-08-23
