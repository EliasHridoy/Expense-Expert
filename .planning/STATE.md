# GSD Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-08-23)

**Core value:** Provide a seamless, cross-platform (mobile and web) expense tracking experience using React Native, while maintaining exact parity with the existing Angular application's logic and Firebase integration.
**Current focus:** Ready for Phase 6: Real-time Synchronization & Stability

## Current Phase

- **Phase:** 05-dashboards-visualizations
- **Status:** Complete (Verified 2026-08-23)

## Workflow Preferences

See: .planning/config.json
- **Mode:** yolo
- **Parallel execution:** Yes

## Memory & Guidelines

- **Style:** Multi-collection integer-cents roll-forward aggregations; universal hardware-accelerated SVG charts (`CategoryDonutChart`, `MonthlyTrendBarChart`); responsive grid breakpoints.
- **Gotchas:** 360-degree SVG arc clamping; cumulative past balance calculations from `createdAt`.
- **Agent instructions:** Ensure unit tests and TypeScript verification pass after each plan.
