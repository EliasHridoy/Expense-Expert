---
phase: 5
slug: dashboards-visualizations
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-08-23
---

# Phase 5 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 29.x + jest-expo + @testing-library/react-native |
| **Config file** | `expense-expert-rn/jest.config.js` |
| **Quick run command** | `npm test -- __tests__/features/dashboard/` |
| **Full suite command** | `npm test && npx tsc --noEmit` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- __tests__/features/dashboard/`
- **After every plan wave:** Run `npm test && npx tsc --noEmit`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 20 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 05-01-01 | 01 | 1 | DASH-01 | — | N/A | unit | `npm test -- __tests__/features/dashboard/aggregation.util.test.ts` | ❌ W0 | ⬜ pending |
| 05-01-02 | 01 | 1 | DASH-01 | — | N/A | unit | `npm test -- __tests__/features/dashboard/dashboard.service.test.ts` | ❌ W0 | ⬜ pending |
| 05-02-01 | 02 | 2 | DASH-01, DASH-03 | — | N/A | unit | `npm test -- __tests__/features/dashboard/SummaryCard.test.tsx` | ❌ W0 | ⬜ pending |
| 05-02-02 | 02 | 2 | DASH-01, DASH-03 | — | N/A | unit | `npm test -- __tests__/features/dashboard/MonthNavigator.test.tsx` | ❌ W0 | ⬜ pending |
| 05-03-01 | 03 | 3 | DASH-02 | — | N/A | unit | `npm test -- __tests__/features/dashboard/svg-chart.util.test.ts` | ❌ W0 | ⬜ pending |
| 05-03-02 | 03 | 3 | DASH-02 | — | N/A | unit | `npm test -- __tests__/features/dashboard/CategoryDonutChart.test.tsx` | ❌ W0 | ⬜ pending |
| 05-03-03 | 03 | 3 | DASH-02 | — | N/A | unit | `npm test -- __tests__/features/dashboard/MonthlyTrendBarChart.test.tsx` | ❌ W0 | ⬜ pending |
| 05-04-01 | 04 | 4 | DASH-01..03 | — | N/A | unit | `npm test -- __tests__/routes/dashboard-screen.test.tsx` | ❌ W0 | ⬜ pending |
| 05-04-02 | 04 | 4 | DASH-01..03 | — | N/A | typecheck | `npx tsc --noEmit` | ❌ W0 | ⬜ pending |
| 05-04-03 | 04 | 4 | DASH-01..03 | — | N/A | build | `npm run build:web` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `__tests__/features/dashboard/aggregation.util.test.ts` — Pure integer cents financial calculations and balance roll-forward
- [ ] `__tests__/features/dashboard/dashboard.service.test.ts` — Firestore aggregation service and AsyncStorage cache tests
- [ ] `__tests__/features/dashboard/SummaryCard.test.tsx` — Financial metric cards and grid responsiveness
- [ ] `__tests__/features/dashboard/MonthNavigator.test.tsx` — Month navigation and current month reset
- [ ] `__tests__/features/dashboard/svg-chart.util.test.ts` — SVG arc geometry and bar chart scale math
- [ ] `__tests__/features/dashboard/CategoryDonutChart.test.tsx` — Category donut chart interaction and legend
- [ ] `__tests__/features/dashboard/MonthlyTrendBarChart.test.tsx` — 6-month dual bar chart rendering and tooltips
- [ ] `__tests__/routes/dashboard-screen.test.tsx` — Dashboard route screen full layout integration

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Cross-Platform Donut & Bar Charts | DASH-02 | Visual rendering on mobile and web viewports | View dashboard on mobile and web, interact with slices and trend bars |
| Monthly Navigation & Metric Calculation | DASH-01, DASH-03 | Visual layout transition across previous/next months | Tap '<' to switch month, observe instant calculation of expenses, income, and balance |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 20s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-08-23
