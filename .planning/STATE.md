# GSD Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-08-23)

**Core value:** Provide a seamless, cross-platform (mobile and web) expense tracking experience using React Native, while maintaining exact parity with the existing Angular application's logic and Firebase integration.
**Current focus:** Ready to execute Phase 3: Core Transaction Entry

## Current Phase

- **Phase:** 03-core-transaction-entry
- **Status:** Planned (4 plans, 4 waves)

## Workflow Preferences

See: .planning/config.json
- **Mode:** yolo
- **Parallel execution:** Yes

## Memory & Guidelines

- **Style:** Integer cents arithmetic for all monetary amounts; FIFO offline mutation queue via AsyncStorage; NetInfo auto-sync.
- **Gotchas:** Floating point drift on cents calculation; timestamp serialization over AsyncStorage.
- **Agent instructions:** Ensure unit tests and TypeScript verification pass after each plan.
