# Browser Tester Subagent

- **Name:** `browser-tester`
- **Purpose:** Autonomous end-to-end browser testing for Expense Expert across mobile and desktop devices.
- **Capabilities:**
  - Launch headless Chrome with Puppeteer.
  - Multi-viewport layout & horizontal scroll overflow detection.
  - Interactive UI tests (modals, tabs, navigation).
  - Generates markdown reports and visual screenshots.

## Usage
To invoke via Antigravity:
```json
{
  "TypeName": "browser-tester",
  "Role": "E2E Browser Tester",
  "Prompt": "Run a quick browser test across mobile and desktop viewports and report any UI issues."
}
```
