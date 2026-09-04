---
name: browser-testing
description: >-
  Automated browser testing across Web (Desktop) and Mobile viewports for Expense Expert.
  Use this skill whenever the user asks to test the application in a browser, check responsiveness,
  detect mobile or desktop layout issues, audit horizontal scroll overflow glitches, or run e2e UI tests.
---

# Browser Testing Skill (Web & Mobile)

This skill provides an automated, reusable browser test harness using Chrome and Puppeteer to inspect the Expense Expert application across both desktop and mobile viewports.

## When to Use This Skill
- The user requests to test the UI/UX or responsiveness of the app.
- Before submitting a pull request or after completing layout changes.
- To detect horizontal scroll overflows (`scrollWidth > clientWidth`).
- To verify touch targets (>= 32-44px) on mobile viewports.
- To verify interactive UI elements (modals, dialogs, tab switchers, bottom navigation).

---

## Test Runner Options & Viewports

### 1. Viewports Covered
| Category | Viewport | Preset Key | Target Device Reference |
|---|---|---|---|
| **Mobile** | `360x800` | `360x800` | Samsung Galaxy / Common Android |
| **Mobile** | `375x667` | `375x667` | iPhone SE / Compact Mobile |
| **Mobile** | `390x844` | `390x844` | iPhone 12/13/14/15 |
| **Desktop** | `1280x800` | `1280x800` | Laptop / Tablet Landscape |
| **Desktop** | `1536x864` | `1536x864` | Standard Desktop Display |
| **Desktop** | `1920x1080`| `1920x1080`| Full HD Large Desktop Monitor |

---

## How to Execute Tests

### Option A: Via NPM Scripts (from `expense-expert/`)
```bash
# Fast smoke test (1 mobile + 1 desktop viewport):
npm run test:browser:quick

# Mobile viewports only (360x800, 375x667, 390x844):
npm run test:browser:mobile

# Desktop viewports only (1280x800, 1536x864, 1920x1080):
npm run test:browser:web

# Full suite (All 6 viewports across all 16 routes):
npm run test:browser
```

### Option B: Via Skill Helper Script (from workspace root)
```bash
# Auto-starts dev server if down, then runs quick smoke test
.agents/skills/browser-testing/scripts/run.sh --mode=quick

# Run mobile suite with custom base URL
.agents/skills/browser-testing/scripts/run.sh --mode=mobile --url=http://localhost:4200

# Test specific routes only
.agents/skills/browser-testing/scripts/run.sh --routes=/expenses,/savings/loans
```

### Option C: Direct Node.js Runner
```bash
node expense-expert/scripts/browser-test-runner.js --mode=quick
```

---

## Output & Reports

Every run generates:
1. **Console Output**: Real-time colored indicators per route (`[PASS]`, `[FAIL]`, `[ERROR]`) with details on overflowing elements.
2. **Markdown Report**: `test-results/browser/REPORT.md` summarizing pass/fail metrics and offending DOM elements.
3. **Structured JSON**: `test-results/browser/summary.json` for programmatic analysis or CI pipelines.
4. **Visual Screenshots**: `test-results/browser/screenshots/<viewport>/<route>.png` for immediate visual inspection.

---

## Automated Checks Performed

1. **Horizontal Overflow Check**:
   - Compares `document.documentElement.scrollWidth` and `document.body.scrollWidth` against `window.innerWidth`.
   - Flags elements where `boundingClientRect.right > window.innerWidth + 1px`.
2. **Interactive UI Elements**:
   - Loan tab switching (`💸 Loan Taken` vs `🤝 Loan Given`).
   - Shopping list filter tabs (`All`, `Planned`, `Completed`).
   - Expense detail modal opening and dismissal.
3. **Mobile Accessibility**:
   - Audits interactive clickable elements (`button`, `a`, `input`) for touch target height/width under 28px.
4. **Runtime Exceptions**:
   - Catches unhandled browser console errors and page crashes.

---

## Recommended Agent Workflow

1. Ensure the Angular dev server is running on port 4200 (`curl -s http://localhost:4200`).
2. Run `npm run test:browser:quick` in `expense-expert/` for fast feedback.
3. If issues are found, read `test-results/browser/REPORT.md` and check the affected component.
4. Fix the CSS / HTML layout (e.g., add `flex-wrap`, adjust padding, or change fixed positions to sticky/responsive flow).
5. Re-run `npm run test:browser:mobile` or `npm run test:browser:web` to verify the fix.
