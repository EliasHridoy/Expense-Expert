# Pitfalls Research

**Domain:** Expense Tracking Application (React Native Cross-Platform with Firebase)
**Researched:** 2026-08-23
**Confidence:** HIGH

## Critical Pitfalls

### Pitfall 1: Floating-Point Math for Currency

**What goes wrong:**
Expense totals, summaries, and splits do not add up correctly (e.g., 0.1 + 0.2 = 0.30000000000000004).

**Why it happens:**
JavaScript uses IEEE 754 double-precision floats, which cannot precisely represent decimal fractions.

**How to avoid:**
Use a specialized library like `currency.js` or `decimal.js`, or store all monetary values as integers (e.g., cents) and format them only for display.

**Warning signs:**
UI shows values like "$10.4999999" or unit tests for calculations start failing randomly on specific values.

**Phase to address:**
Core Logic & Data Models Phase

---

### Pitfall 2: React Native Web Layout Disconnect

**What goes wrong:**
The web application looks like a blown-up mobile app instead of a native web dashboard, wasting screen real estate.

**Why it happens:**
React Native uses Flexbox for everything natively, which behaves slightly differently than web CSS. Developers often forget to implement responsive breakpoints for React Native Web.

**How to avoid:**
Use responsive hooks (like `useWindowDimensions`) or a UI library that supports web breakpoints to adapt layouts for large screens.

**Warning signs:**
Tables and charts in the web dashboard stretch across the entire screen without margins, or touch targets are massive on desktop.

**Phase to address:**
UI/UX Migration Phase

---

### Pitfall 3: Angular to React Asynchronous Logic Mismatch (RxJS vs. Hooks)

**What goes wrong:**
Data sync and real-time updates behave erratically, causing race conditions or stale data.

**Why it happens:**
Angular heavily relies on RxJS Observables, while React typically uses Promises and useEffect hooks. A 1:1 direct translation often leads to memory leaks or multiple Firebase listeners if hooks aren't cleaned up correctly.

**How to avoid:**
Do not attempt a direct syntax translation. Rethink the data flow using React-friendly state management or properly structured custom hooks for Firebase real-time listeners with explicit cleanup.

**Warning signs:**
The app slows down over time (memory leak from unclosed listeners) or multiple identical reads appear in the Firebase console.

**Phase to address:**
State Management & API Integration Phase

---

### Pitfall 4: Dockerizing React Native Development

**What goes wrong:**
Hot reloading fails, or the local emulator/device cannot connect to the Metro bundler running inside the Docker container.

**Why it happens:**
Docker isolates network interfaces. Metro bundler and mobile emulators require specific ports and host network bridging which are complex to configure in Docker.

**How to avoid:**
Ensure Docker `docker-compose.yml` properly maps all Metro bundler ports (typically 8081). Use host networking mode on Linux, or specific proxy configurations so the Android/iOS emulator can reach the Docker container's IP.

**Warning signs:**
App launches but fails to load the bundle with a "Could not connect to development server" error.

**Phase to address:**
Environment Setup Phase

---


## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Using `any` type for Firebase payloads | Faster migration of models | Runtime crashes when data schema evolves | Prototyping only |
| Skipping offline persistence testing | Quicker delivery | Data loss if user goes offline during an expense entry | Never |
| Hardcoding currency symbols | Faster UI development | Impossible to support multi-currency | Only in MVP if single region |

## Integration Gotchas

Common mistakes when connecting to external services.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Firebase Auth | Relying on web-only auth patterns (e.g., popups) in React Native | Use native-compatible authentication methods and proper deep linking |
| Firestore Realtime | Leaving listeners open across screen transitions | Unsubscribe from `onSnapshot` in `useEffect` cleanup function |
| Firebase Analytics | Firing generic events without platform context | Append platform (web/mobile) metadata to all events |

## Performance Traps

Patterns that work at small scale but fail as usage grows.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Fetching all expenses for dashboard | Long load times and high Firebase billing | Paginate queries and use Firestore aggregations (`count`, `sum`) | > 1000 expenses per user |
| Heavy charting libraries | UI thread stutters during chart animations | Use lightweight or native-optimized chart libraries for React Native | Complex dashboards |
| Inline functions in FlatList | Jerky scrolling in mobile | Memoize render items using `useCallback` and `React.memo` | Lists > 50 items |

## Security Mistakes

Domain-specific security issues beyond general web security.

| Mistake | Risk | Prevention |
|---------|------|------------|
| Incomplete Firestore Security Rules | Unauthorized access to other users' financial data | Write strict rules enforcing `request.auth.uid == resource.data.userId` |
| Logging sensitive expense data | Exposing user financial details in crash reports | Sanitize inputs and filter out amounts/notes before sending to Crashlytics |
| Hardcoding Firebase config | Exposing API keys in source control | Use `.env` files and Docker environment variables |

## UX Pitfalls

Common user experience mistakes in this domain.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Complex date pickers for simple entries | Frustration when logging a coffee | Default to "Today" and provide quick-select buttons |
| No offline mode indicator | Confusion when an entry silently fails | Show an offline banner and queue actions for background sync |
| Web-style navigation on Mobile | Awkward UX (e.g., reaching top left for back) | Use native-feeling bottom tabs and swipe-to-go-back gestures |

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **Data Entry:** Often missing offline queueing — verify expenses can be logged in airplane mode.
- [ ] **Cross-Platform Parity:** Often missing web responsive layout — verify dashboard on a 1080p desktop monitor.
- [ ] **Firebase Limits:** Often missing query limitations — verify dashboard loading doesn't query the entire collection history.
- [ ] **Environment:** Often missing Metro bundler network config — verify hot-reloading works on a physical device connected to the Docker host.

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Floating-point data corruption | HIGH | Write a Firestore migration script to convert all existing float amounts to integer cents. |
| Firebase listener memory leak | MEDIUM | Audit all `useEffect` hooks, add cleanups, and deploy hotfix. |
| Docker Metro connection failure | LOW | Adjust `docker-compose.yml` port mappings and network mode. |

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Docker Networking | Environment Setup Phase | Start Metro in Docker, successfully load app on physical device |
| RxJS to Hooks logic mismatch | Core Logic Phase | Run unit tests asserting identical state behavior to Angular |
| Floating-point math errors | Data Models Phase | Run unit tests with specific decimal cases (e.g., 0.1 + 0.2) |
| Web Responsive Layouts | UI Implementation Phase | Visual regression tests on desktop vs mobile viewports |

## Sources

- Community discussions on React Native Web limitations
- Official Firebase documentation for React Native offline persistence
- Personal experience with financial application data modeling
- Docker networking documentation for React Native

---
*Pitfalls research for: Expense Tracking Application (React Native Cross-Platform with Firebase)*
*Researched: 2026-08-23*
