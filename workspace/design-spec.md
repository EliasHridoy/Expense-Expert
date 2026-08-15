## Aesthetic Direction
**Visual Identity:** *Tactical Quartz & Kinetic Emerald Ledger*

**The Aesthetic Risk:** We reject the soft, bubbly "consumer fintech" aesthetic in favor of high-density financial telemetry. By pairing hyper-precise monospace numerical columns with chiseled obsidian surfaces, crisp single-pixel container divides, and vivid kinetic emerald indicators, the UI presents financial metrics with the authority of an institutional trading desk while remaining effortlessly usable on mobile devices.

## Palette
| Role | Value | Notes |
|------|-------|-------|
| Background | `#0B0F17` | Deep Obsidian Ink — high-contrast dark foundation |
| Surface | `#141A24` | Elevated Mineral Slate — primary container surface |
| Surface Alt | `#1C2433` | Interactive highlight surface for hover/active states |
| Primary | `#10B981` | Kinetic Emerald — positive cashflow, primary actions, active status |
| Secondary | `#3B82F6` | Alpine Cobalt — secondary metrics, navigation accents |
| Accent | `#F59E0B` | Luminous Amber — loan metrics, warnings, pending drafts |
| Danger | `#F43F5E` | Crisp Coral — expenses, deficit indicators, delete triggers |
| Text Primary | `#F8FAFC` | Pure Starlight White — maximum legibility headlines and values |
| Text Secondary | `#94A3B8` | Cool Mineral Gray — captions, labels, non-critical telemetry |

## Typography
- **Display:** `Plus Jakarta Sans` — 800 (ExtraBold) — 32px to 20px — tracking `-0.025em`
- **Body:** `Plus Jakarta Sans` — 500 (Medium) / 600 (SemiBold) — 14px to 12px — line-height `1.5`
- **Numbers / Metrics:** `JetBrains Mono` — 600 (SemiBold) / 700 (Bold) — 24px to 13px — tabular figures (`font-variant-numeric: tabular-nums`)
- **Source:** `https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap`

## Layout
The screen follows a structured, responsive 3-zone layout:
1. **Top Telemetry Header:** Persistent app status displaying connection state (`OFFLINE CACHED` vs `ONLINE SYNC`), Biometric Lock toggle, account selector, and global quick-action triggers (`+ Expense`, `Apply Draft`, `PDF Export`).
2. **Key Financial Scoreboard:** A 4-column metric grid displaying Total Income, Net Cashflow, Total Expenses, and Active Loan Liabilities with real-time recalculation indicators.
3. **Dual-Pane Workstation (Responsive Stack):**
   - **Left Pane (Analytics & Drafts):** Interactive SVG chart showing cashflow trends, spending by category breakdown, active monthly draft templates, and savings goal progress bars.
   - **Right Pane (Live Ledger & Transaction Operations):** Real-time expense feed with atomic CRUD action triggers, category tags, offline sync badges, and loan repayment quick-log buttons.

## Components
- **Telemetry Bar:** Top status header encoding real-time offline hydration status, biometric security toggle, and sync health.
- **Scoreboard Metric Tile:** Structured stat container with crisp monospaced numerical figures, micro percentage badges, and subtle emerald/coral directional indicators.
- **Kinetic Cashflow Chart:** Custom pure SVG cross-platform line and bar telemetry graph featuring interactive period selectors (Monthly / Quarterly).
- **Expense Data Grid:** Clean ledger table featuring inline category tags, payment badges, offline storage indicators, and quick context actions.
- **Draft Application Card:** Tactical template card for applying recurring monthly budget drafts in a single atomic batch.
- **Loan Repayment Drawer/Modal:** Modal overlay for logging loan repayments that updates total balances atomically.
- **Biometric Security Overlay:** Simulated Face ID / Touch ID lock screen with biometric challenge prompt.
- **PDF Export Generator Modal:** Live preview dialog simulating cross-platform HTML-to-PDF statement rendering and download.

## Motion
- **Hydration Fade:** 250ms smooth opacity transition on initial load to reflect offline Zustand cache hydration without screen flash.
- **Scoreboard Number Count-Up:** Subtle numeric counter transition on metric recalculations to highlight transactional impact.
- **Ledger Item Entry:** Slide-in and background pulse (300ms cubic-bezier) when adding a new expense item.
- **Biometric Lock Shielding:** Blur backdrop filter (`backdrop-filter: blur(12px)`) with instant scale transition on app lock/unlock.
- **Tab/Modal Transitions:** Clean 180ms ease-out modal backdrop reveals and drawer slides.
