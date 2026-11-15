# Implementation Plan: Web & Mobile Browser Testing System

## Objective
Build an automated, reproducible browser testing system for Expense Expert that tests both Web (Desktop) and Mobile viewports with real headless/headed Chrome, automated interaction testing, layout overflow detection, and report generation so tests do not need to be written or run from scratch.

---

## Architecture & Components

```
Expense Expert
├── expense-expert/
│   ├── scripts/
│   │   └── browser-test-runner.js      # Standalone Node.js Puppeteer test harness
│   └── package.json                   # Added npm run test:browser[:mobile|:web]
├── .agents/
│   └── skills/
│       └── browser-testing/
│           ├── SKILL.md               # Antigravity skill specification & runbook
│           └── scripts/
│               └── run.sh             # Convenience shell wrapper
├── test-results/
│   └── browser/                       # Auto-generated reports & screenshots (gitignored)
└── docs/plans/
    └── browser_testing_agent_and_skill_plan.md
```

---

## Proposed Tasks

### 1. Standalone Browser Test Runner (`expense-expert/scripts/browser-test-runner.js`)
- **Puppeteer-core engine** with `/usr/bin/google-chrome` auto-detection.
- **Configurable Viewport Presets:**
  - **Mobile:** `360x800` (Galaxy/Android), `375x667` (iPhone SE), `390x844` (iPhone 12-15)
  - **Desktop/Web:** `1280x800` (Laptop), `1536x864` (Standard Desktop), `1920x1080` (FHD Desktop)
- **Automatic Dev Server Check:** Verifies if server is active on `http://localhost:4200`; provides quick diagnostics if inactive.
- **Authentication Automation:** Pre-authenticates test account, tests public and protected routes.
- **Interactive UI Testing:**
  - Tests modal dialogs (Expense details, Add category).
  - Tests tab switching (Loans Taken/Given, Shopping Planned/Completed).
  - Tests bottom navigation bar and desktop sidebar links.
- **Automated Glitch & Defect Audits:**
  - Horizontal overflow detection (`scrollWidth > clientWidth`).
  - Browser console error and failed HTTP request logging.
  - Interactive touch target sizing checks on mobile.
- **Reporting:**
  - Real-time console logs with colored indicators.
  - Generates `test-results/browser/REPORT.md` with markdown summary tables.
  - Generates `test-results/browser/summary.json`.
  - Captures full-page screenshots per viewport & route under `test-results/browser/screenshots/`.

### 2. Package Scripts Integration
- Add npm scripts to `expense-expert/package.json`:
  - `npm run test:browser` -> Runs all viewports (web + mobile).
  - `npm run test:browser:mobile` -> Runs mobile viewports (360x800, 375x667, 390x844).
  - `npm run test:browser:web` -> Runs desktop viewports (1280x800, 1536x864, 1920x1080).
  - `npm run test:browser:quick` -> Runs single mobile + single desktop viewport for fast smoke testing.

### 3. Antigravity Skill (`.agents/skills/browser-testing/`)
- Create `SKILL.md` with YAML frontmatter (`name: browser-testing`).
- Teach Antigravity agents when and how to activate and execute browser tests.
- Provide step-by-step diagnostic workflows for debugging identified issues.

### 4. Custom Subagent (`browser-tester`)
- Register `browser-tester` subagent via `define_subagent` so long-running test suites can be executed autonomously in the background without blocking conversation turns.

### 5. Verification
- Start dev server.
- Run `npm run test:browser:quick` to verify both web and mobile passes cleanly with screenshots and report generated.
- Run full mobile and desktop verification.
