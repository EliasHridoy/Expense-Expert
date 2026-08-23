# Phase 6: Real-time Synchronization & Stability - Research

**Researched:** 2026-08-23
**Domain:** Cross-Platform Real-time Data Synchronization (Firestore `onSnapshot`), Offline Mutation Reconciliation, Deterministic Listener Lifecycle Management, Universal React ErrorBoundary, and Global Toast / Connection UI (React Native Web & Mobile)
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

No user constraints - all decisions at the agent's discretion.

### Locked Decisions
- **Real-Time Data Synchronization (SYNC-01):**
  - Data modified on one device/client (e.g. mobile expense addition, budget change, category creation) must propagate in real-time across all active clients (e.g. web dashboard) via Cloud Firestore listeners (`onSnapshot`).
  - Real-time updates must cover all core entities:
    1. Expenses (`users/{uid}/expenses` for active month partitions).
    2. Categories (`users/{uid}/categories`).
    3. Budgets (`users/{uid}/budgets` for active month partitions).
    4. Dashboard financial summaries & trends (reactive re-aggregation upon underlying data updates).
- **Clean Subscription Lifecycle & Memory Leak Prevention (SYNC-02):**
  - All Firestore listeners must have deterministic lifecycle management. Listeners must cleanly unsubscribe when components unmount, when switching routes/months, or when authentication state transitions (e.g., user logout / user switch).
  - Prevent duplicate listener subscriptions and dangling background listeners that consume network bandwidth and cause memory leaks or duplicate state emissions.
- **Offline Mutation Queue & Reconnection Synchronization (TXN-03 / SYNC-01):**
  - Offline transactions must be preserved durably in AsyncStorage via `OfflineQueueService`.
  - When connection is restored (`useNetworkStatus` transitions from offline -> online), pending mutations must synchronize automatically in FIFO order using idempotent write operations (`setDoc` with merge / `deleteDoc`) without duplicate entries.
  - UI state must seamlessly reconcile local pending mutations with incoming server snapshots, ensuring optimistic offline records remain visible with pending badges until confirmed by the server.
- **Universal ErrorBoundary & Stability Protection:**
  - React Native / Web `ErrorBoundary` must protect critical application trees (root layout and feature screens), preventing white-screen crashes on unhandled JavaScript runtime errors.
  - Provide a graceful recovery UI ("Try Again", "Reload Application", "Back to Dashboard") with contextual error diagnostics.
- **Global Toast Notification & Connection Status Banner:**
  - Lightweight, universal toast system (`ToastProvider`, `useToast`) for non-blocking user feedback (e.g., "Expense saved offline", "Changes synced successfully", "Network error occurred").
  - Persistent, responsive connection status banner overlay indicating offline state and pending sync count.

### The Agent's Discretion
- **Subscription Architecture:** Implement a centralized `RealtimeSyncManager` / custom subscription hook pattern that manages active Firestore listener pools with reference counting and automatic teardown on auth changes.
- **Toast UI & Animations:** Cross-platform toast overlay rendered using standard React Native primitives (`View`, `Text`, `Animated` / `Pressable`) with automatic dismissal timers (e.g., 3-4s), tone-based color coding (success, error, info, warning), and accessible touch-to-dismiss interactions.
- **Error Diagnostics:** In development mode, display sanitized error stack traces; in production mode, present user-friendly error copy with an action to retry rendering or clear transient state.

### Deferred Ideas (OUT OF SCOPE)
- **Multi-Master Distributed Conflict Resolution (CRDTs):** Field-level three-way diffing / Operational Transformation (OT) — unnecessary for single-user partition architecture; Last-Write-Wins (LWW) with timestamping is sufficient.
- **Push Notification Background Sync:** Silent APNs / FCM push triggers for background fetch when the app is completely terminated — deferred to v2.
- **Full Database Sync to Local SQLite (WatermelonDB / Realm):** Complex local relational database migration — out of scope; Firestore SDK offline persistence + AsyncStorage queue is standard and established.
</user_constraints>

<architectural_responsibility_map>
## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Real-time Listener Pooling & Lifecycle | Client Infrastructure (`RealtimeSyncManager` / `useFirestoreSubscription`) | Data Access (`Firebase SDK`) | Manages Firestore `onSnapshot` listeners, guarantees deterministic unsubscribe on route/auth changes, and prevents listener leaks. |
| Optimistic State & Offline Reconciliation | Feature Context Providers (`ExpenseProvider`, `CategoryProvider`, `BudgetProvider`) | Local Storage (`OfflineQueueService` / `AsyncStorage`) | Reconciles incoming remote Firestore snapshots with local pending offline mutations to prevent UI flicker or optimistic record disappearance. |
| Auto-Reconnection & Queue Drain | Network Monitoring (`useNetworkStatus`) | Service Layer (`ExpenseService.processSyncQueue`) | Detects network transition from offline to online and triggers idempotent background sync processing. |
| Reactive Dashboard Synchronization | Context Tier (`DashboardProvider`) | Feature State Contexts (`ExpenseContext`, `BudgetContext`) | Automatically invalidates and re-aggregates dashboard metrics when underlying transaction or budget data updates in real-time. |
| Universal Error Handling & Recovery | UI Core (`ErrorBoundary`, `ErrorFallback`) | Root Application Layer (`_layout.tsx`) | Catches unhandled component render errors on web and mobile, preventing total crash and offering recovery controls. |
| User Feedback & Connection Overlay | Presentation (`ToastProvider`, `ConnectionStatusBanner`) | UI Layouts (`app/(app)/_layout.tsx`) | Displays non-intrusive status alerts and network indicator banners across mobile and desktop viewports. |
</architectural_responsibility_map>

<research_summary>
## Summary

Phase 6 hardens Expense Expert into a robust, multi-platform application with real-time data flow, zero memory leaks, offline resilience, and universal crash protection. While Phases 1–5 established core domains (authentication, transaction entry, categorization, budgeting, and dashboard analytics), Phase 6 shifts from manual request-response fetching (`getDocs`) to **reactive real-time data synchronization** (`onSnapshot`) combined with deterministic lifecycle management and crash recovery.

Key architectural pillars of Phase 6:
1. **Deterministic Firestore Subscription Lifecycle (`RealtimeSyncManager`):** Wrapping Firebase's `onSnapshot` in structured lifecycle managers and custom hooks ensures that every active query subscription is tracked and deterministically torn down when users navigate between months, log out, or unmount views. This eliminates the #1 risk identified in PITFALLS.md: unclosed Firebase listeners causing memory leaks and runaway read billing.
2. **Seamless Offline Optimistic Reconciliation:** When offline, writes are immediately reflected in memory and durably recorded in `OfflineQueueService` (`AsyncStorage`). When online snapshots arrive from Firestore, the state providers smartly merge pending local mutations with remote server snapshots so uncommitted items remain visible until the background worker idempotently flushes the queue.
3. **Universal ErrorBoundary & Resilient UI Layer:** A cross-platform React error boundary intercepts unexpected render exceptions across iOS, Android, and Web, replacing blank screen crashes with accessible recovery actions ("Try Again", "Return to Home"). Paired with a global Toast Notification system and a Connection Status Banner, users always maintain complete visibility over data sync and network state.

**Primary recommendation:** Implement a centralized `RealtimeSyncManager` with unsubscribe registry, integrate real-time `onSnapshot` listeners with optimistic pending-mutation merging across `ExpenseProvider`, `CategoryProvider`, `BudgetProvider`, and `DashboardProvider`, wrap the app hierarchy in `ErrorBoundary` and `ToastProvider`, and verify stability with comprehensive unit and multi-platform build tests.
</research_summary>

<standard_stack>
## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `firebase/firestore` (`onSnapshot`, `query`, `where`) | ^11.0.0 | Real-time Database Subscriptions | Official Firebase JS SDK. Provides reactive collection/document listeners with low-latency WebSocket / WebChannel streaming, local write latency compensation, and snapshot metadata (`fromCache`, `hasPendingWrites`). |
| `@react-native-community/netinfo` | ^12.0.1 | Cross-Platform Network State | Industry standard for React Native mobile network state detection; complements standard web `navigator.onLine` and `window` event listeners. |
| `@react-native-async-storage/async-storage` | 1.23.1 | Durable Offline Mutation Queue | Reliable local key-value store for preserving pending writes across app reboots and browser refreshes. |
| `react` (`Component`, `createContext`, `useRef`, `useEffect`) | 18.3.1 | Error Boundary & State Primitives | Native React class component lifecycle (`componentDidCatch`, `getDerivedStateFromError`) provides crash containment. |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `expo-router` | ~4.0.0 | Routing & Layout Nesting | Integrates `ErrorBoundary` and `ToastProvider` into root and feature route layouts (`app/_layout.tsx` and `app/(app)/_layout.tsx`). |
| `nativewind` | ^4.1.23 | Responsive Alert & Toast Styling | Tailwind CSS utility styling for toast popups, error boundary fallbacks, and connection banners with full dark mode support. |
| `react-native-safe-area-context` | 4.12.0 | Layout Inset Protection | Ensures connection banners and toast notifications do not overlap mobile status bars or home indicators. |

### Development & Testing
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `jest` / `jest-expo` | ^29.7.0 / ~52.0.0 | Unit & Integration Test Runner | Mocks `onSnapshot`, tests listener unsubscription lifecycle, error boundary catches, and offline queue reconciliation. |
| `@testing-library/react-native` | ^13.0.0 | Component & Hook Lifecycle Testing | Simulates network transitions, verifies toast appearance/auto-dismissal, and tests error boundary fallback rendering. |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Firestore `onSnapshot` + React Context | TanStack React Query `useQuery` with polling | `onSnapshot` delivers true push-based sub-second real-time sync with zero polling overhead. React Query with polling incurs higher read bills and lag. |
| Custom `ToastProvider` | `react-native-toast-message` / `react-hot-toast` | External toast libraries frequently exhibit CSS/animation bugs or platform incompatibilities between React Native Web and Native. A clean custom provider is ~80 lines, 100% NativeWind compatible, and zero-dependency. |
| Custom `ErrorBoundary` | `react-error-boundary` (npm package) | React's native class component error boundary is trivial to implement (~40 lines) and allows direct integration with Expo Router and custom NativeWind styling without extra third-party wrappers. |

**Installation:**
No new external npm packages are needed. All required modules (`firebase`, `@react-native-community/netinfo`, `@react-native-async-storage/async-storage`, `expo-router`, `nativewind`, `react-native-safe-area-context`) are already installed and verified in `expense-expert-rn/package.json`.
</standard_stack>

<architecture_patterns>
## Architecture Patterns

### System Architecture Diagram

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                               Root Application Tier                                    │
│                                                                                        │
│   app/_layout.tsx                                                                      │
│   ├── [ Global ErrorBoundary ] ── (Catches unhandled render errors across entire app)  │
│   └── [ SafeAreaProvider ]                                                             │
│       └── [ AuthProvider ] ── (Manages user auth & triggers listener teardown on logout│
│           └── [ ToastProvider ] ── (Global toast notification overlay & dispatcher)    │
│               └── [ NavigationGate ]                                                   │
└───────────────────────────────────────┬────────────────────────────────────────────────┘
                                        │
                                        ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              App Feature Tier Layout                                   │
│                                                                                        │
│   app/(app)/_layout.tsx                                                                │
│   ├── [ Feature ErrorBoundary ] ── (Feature-level crash isolation)                     │
│   ├── [ Global ConnectionStatusBanner ] ── (Displays offline & pending sync status)    │
│   └── [ Feature Providers Pipeline ]                                                   │
│       ├── [ ExpenseProvider ]  ── (Subscribes to users/{uid}/expenses for activeMonth) │
│       ├── [ CategoryProvider ] ── (Subscribes to users/{uid}/categories)               │
│       ├── [ BudgetProvider ]   ── (Subscribes to users/{uid}/budgets for activeMonth)  │
│       └── [ DashboardProvider ]── (Reactively recalculates summaries on data updates)  │
└───────────────────────────────────────┬────────────────────────────────────────────────┘
                                        │
                 ┌──────────────────────┴──────────────────────┐
                 ▼                                             ▼
┌────────────────────────────────────────┐   ┌───────────────────────────────────────────┐
│     RealtimeSyncManager & Hooks        │   │       Offline Queue & Auto-Sync           │
│                                        │   │                                           │
│  [ useFirestoreSubscription ]          │   │  [ useNetworkStatus ]                     │
│  - Registers active onSnapshot         │   │  - Detects offline -> online transitions  │
│  - Deduplicates active query keys      │   │  [ OfflineQueueService ] (AsyncStorage)   │
│  - Tracks unsubscribe handles          │   │  - Preserves FIFO pending mutations       │
│  - Deterministic cleanup on unmount/   │   │  [ ExpenseService.processSyncQueue ]      │
│    month-switch/logout                 │   │  - Idempotent merge on reconnection       │
└──────────────────┬─────────────────────┘   └─────────────────────┬─────────────────────┘
                   │                                               │
                   └───────────────────────┬───────────────────────┘
                                           │
                                           ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              Cloud Firestore Backend                                   │
│                                                                                        │
│   users/{uid}/expenses        (Real-time listener on active month)                     │
│   users/{uid}/categories      (Real-time listener on custom categories)                │
│   users/{uid}/budgets         (Real-time listener on monthly budgets)                  │
│   users/{uid}/saving-entries  (Real-time listener / range queries)                     │
│   users/{uid}/income-entries  (Real-time listener / range queries)                     │
│   users/{uid}/loans-taken     (Real-time listener / range queries)                     │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### Recommended Project Structure

```
expense-expert-rn/
├── src/
│   ├── config/
│   │   └── firebase.ts                              # Firebase app, auth, db singletons
│   ├── features/
│   │   ├── auth/                                    # Auth module
│   │   ├── expenses/                                # Transaction module
│   │   │   ├── context/
│   │   │   │   ├── ExpenseContext.tsx
│   │   │   │   └── ExpenseProvider.tsx              # Wire real-time listener + offline merge
│   │   │   ├── services/
│   │   │   │   ├── expense.service.ts               # Add subscribeToExpenses listener
│   │   │   │   └── offline-queue.service.ts         # Durable mutation queue
│   │   │   └── hooks/
│   │   │       └── useNetworkStatus.ts              # Network connectivity listener
│   │   ├── categories/                              # Category module
│   │   │   ├── context/
│   │   │   │   ├── CategoryContext.tsx
│   │   │   │   └── CategoryProvider.tsx             # Wire real-time listener
│   │   │   └── services/
│   │   │       └── category.service.ts              # Add subscribeToCategories listener
│   │   ├── budgets/                                 # Budget module
│   │   │   ├── context/
│   │   │   │   ├── BudgetContext.tsx
│   │   │   │   └── BudgetProvider.tsx               # Wire real-time listener
│   │   │   └── services/
│   │   │       └── budget.service.ts                # Add subscribeToBudgets listener
│   │   ├── dashboard/                               # Dashboard module
│   │   │   ├── context/
│   │   │   │   ├── DashboardContext.tsx
│   │   │   │   └── DashboardProvider.tsx            # Reactive recalculation hook
│   │   │   └── services/
│   │   │       └── dashboard.service.ts
│   │   └── sync/                                    # New Realtime Sync & Stability Module
│   │       ├── services/
│   │       │   └── RealtimeSyncManager.ts           # Central subscription registry & teardown
│   │       ├── hooks/
│   │       │   └── useFirestoreSubscription.ts      # Deterministic subscription hook
│   │       └── types/
│   │           └── sync.types.ts                    # Subscription options & metadata types
│   ├── components/
│   │   ├── feedback/
│   │   │   ├── ErrorBoundary.tsx                    # Universal Class Error Boundary
│   │   │   ├── ErrorFallback.tsx                    # Accessible Crash Fallback UI
│   │   │   ├── ToastContainer.tsx                   # Toast notification presentation component
│   │   │   └── ConnectionStatusBanner.tsx           # Global connection status & queue banner
│   │   └── ...
│   └── context/
│       └── ToastContext.tsx                         # Global Toast Provider & useToast Hook
└── __tests__/
    ├── features/
    │   ├── sync/
    │   │   ├── RealtimeSyncManager.test.ts          # Registry, ref-counting, teardown tests
    │   │   └── useFirestoreSubscription.test.ts     # Hook lifecycle & unsubscribe tests
    │   ├── expenses/
    │   │   └── ExpenseProvider.realtime.test.tsx    # Real-time listener & optimistic merge tests
    │   ├── categories/
    │   │   └── CategoryProvider.realtime.test.tsx   # Category real-time sync tests
    │   ├── budgets/
    │   │   └── BudgetProvider.realtime.test.tsx      # Budget real-time sync tests
    │   └── feedback/
    │       ├── ErrorBoundary.test.tsx               # Component crash containment tests
    │       ├── ToastContext.test.tsx                # Toast show/hide/timeout tests
    │       └── ConnectionStatusBanner.test.tsx      # Banner rendering & sync button tests
    └── routes/
        └── app-layout.test.tsx                      # End-to-end provider pipeline tests
```

### Pattern 1: Subscription Lifecycle Registry & Pooling (`RealtimeSyncManager`)

**What:** A singleton service tracking active Firestore `onSnapshot` subscriptions. It guarantees that when a query is no longer needed (or when user logs out), the active listener is immediately unsubscribed and garbage collected.
**When to use:** In `src/features/sync/services/RealtimeSyncManager.ts`.
**Implementation Example:**

```typescript
// src/features/sync/services/RealtimeSyncManager.ts
import { Unsubscribe } from 'firebase/firestore';

export interface SubscriptionEntry {
  key: string;
  unsubscribe: Unsubscribe;
  subscriberCount: number;
  createdAt: number;
}

export class RealtimeSyncManagerClass {
  private subscriptions: Map<string, SubscriptionEntry> = new Map();

  /**
   * Registers a Firestore unsubscribe handler under a unique key.
   * If a subscription for the key already exists, increments subscriber count.
   */
  register(key: string, createSubscription: () => Unsubscribe): Unsubscribe {
    const existing = this.subscriptions.get(key);
    if (existing) {
      existing.subscriberCount += 1;
      return () => this.unregister(key);
    }

    const unsubscribe = createSubscription();
    this.subscriptions.set(key, {
      key,
      unsubscribe,
      subscriberCount: 1,
      createdAt: Date.now(),
    });

    return () => this.unregister(key);
  }

  /**
   * Decrements subscriber count and unsubscribes if no consumers remain.
   */
  unregister(key: string): void {
    const existing = this.subscriptions.get(key);
    if (!existing) return;

    existing.subscriberCount -= 1;
    if (existing.subscriberCount <= 0) {
      try {
        existing.unsubscribe();
      } catch (err) {
        console.warn(`Error during unsubscribe for key "${key}":`, err);
      }
      this.subscriptions.delete(key);
    }
  }

  /**
   * Forces complete teardown of all active listeners (e.g. on user logout).
   */
  teardownAll(): void {
    this.subscriptions.forEach((entry) => {
      try {
        entry.unsubscribe();
      } catch (err) {
        console.warn(`Error during teardown for key "${entry.key}":`, err);
      }
    });
    this.subscriptions.clear();
  }

  /**
   * Returns active subscription count for diagnostics/tests.
   */
  getActiveCount(): number {
    return this.subscriptions.size;
  }

  hasSubscription(key: string): boolean {
    return this.subscriptions.has(key);
  }
}

export const RealtimeSyncManager = new RealtimeSyncManagerClass();
```

### Pattern 2: Optimistic Offline Reconciliation with Snapshot Merging

**What:** When Firestore's `onSnapshot` listener fires, it yields the server's truth. However, if the user added/updated items while offline (and the queue has not drained yet), raw replacement of local state with server state would cause optimistic items to temporarily disappear. Reconciling combines server documents with uncommitted local mutations.
**When to use:** In `ExpenseProvider.tsx`, `CategoryProvider.tsx`, and `BudgetProvider.tsx`.
**Implementation Example:**

```typescript
// Inside ExpenseProvider.tsx
useEffect(() => {
  if (!user?.uid) {
    setExpenses([]);
    setPendingSyncCount(0);
    setIsLoading(false);
    return;
  }

  setIsLoading(true);

  // Subscribe to real-time updates for activeMonth
  const targetMonth = activeMonth;
  const subKey = `expenses_${user.uid}_${targetMonth}`;

  const unsubscribe = RealtimeSyncManager.register(subKey, () => {
    return ExpenseService.subscribeToExpenses(
      user.uid,
      targetMonth,
      (remoteExpenses) => {
        setExpenses((prev) => {
          // Identify local items with pending syncStatus
          const pendingItems = prev.filter((item) => item.syncStatus === 'pending');
          const remoteIds = new Set(remoteExpenses.map((e) => e.id));
          
          // Keep pending items that have not yet appeared in remote Firestore
          const uniquePending = pendingItems.filter((e) => !remoteIds.has(e.id));
          
          // If remote includes an updated version of a pending item, remote takes precedence
          return [...uniquePending, ...remoteExpenses];
        });
        setIsLoading(false);
      },
      (error) => {
        console.warn('Real-time expenses listener error:', error);
        setIsLoading(false);
      }
    );
  });

  return () => {
    unsubscribe();
  };
}, [user?.uid, activeMonth]);
```

### Pattern 3: Global ErrorBoundary & Toast Event System

**What:** Universal class component ErrorBoundary that catches rendering/lifecycle crashes and renders an actionable fallback UI, paired with a React Context Toast notification system.
**When to use:** In `src/components/feedback/ErrorBoundary.tsx` and `src/context/ToastContext.tsx`.
**Implementation Example:**

```tsx
// src/components/feedback/ErrorBoundary.tsx
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

interface Props {
  children: ReactNode;
  fallback?: (error: Error, resetError: () => void) => ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in ErrorBoundary:', error, errorInfo);
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.handleReset);
      }

      return (
        <View
          testID="error-boundary-fallback"
          className="flex-1 items-center justify-center p-6 bg-slate-50 dark:bg-slate-900"
        >
          <View className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl p-6 border border-rose-200 dark:border-rose-900/50 shadow-sm items-center text-center">
            <Text className="text-4xl mb-3">⚠️</Text>
            <Text className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">
              Something went wrong
            </Text>
            <Text className="text-xs text-slate-500 dark:text-slate-400 mb-6 text-center">
              An unexpected error occurred while rendering this screen. Your data is safe.
            </Text>

            <TouchableOpacity
              testID="error-boundary-retry-button"
              onPress={this.handleReset}
              className="w-full bg-indigo-600 dark:bg-indigo-500 py-3 rounded-xl items-center active:opacity-80"
            >
              <Text className="text-white font-bold text-sm">Try Again</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}
```

### Anti-Patterns to Avoid

- **Creating `onSnapshot` inside Component Render Body:** Attaching listeners without `useEffect` cleanup causes a new connection on every render cycle, exhausting Firebase connection limits within seconds.
- **Replacing State without Reconciling Local Pending Mutations:** Overwriting state unconditionally with `onSnapshot` wipes out uncommitted offline transactions before they are synchronized to the server.
- **Forgetting to Unsubscribe on User Logout:** If user logs out and another logs in without clearing listeners, the old user's listener may throw permission-denied errors or leak data across user boundaries. Always call `RealtimeSyncManager.teardownAll()` on auth state transition to null.
- **Using Native-Only Alert / Toast Libraries on Web:** Using libraries that rely on iOS/Android native bridges crashes React Native Web. All UI feedback must use universal React Native primitives (`View`, `Text`, `Pressable`).
- **Catching Errors in `try/catch` and Swallowing Them Silently:** Swallowing errors without alerting the user or updating sync status leaves users wondering why data didn't persist. Always route user-facing errors to `ToastContext`.
</architecture_patterns>

<dont_hand_roll>
## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Real-time Push Protocol | Custom WebSocket server or polling timers | Firebase Firestore `onSnapshot` | Firestore SDK manages WebSockets, WebChannel fallbacks, reconnection backoff, write latency compensation, and cache-first delivery. |
| Network State Detection | Ad-hoc polling endpoints with `fetch('/ping')` | `@react-native-community/netinfo` + web `window.addEventListener('online')` (in `useNetworkStatus`) | Native OS events trigger instant state updates with zero battery drain or HTTP request overhead. |
| Error Boundary Catching | Custom window.onerror or global try/catch wrappers around JSX | React Class `ErrorBoundary` (`componentDidCatch`, `getDerivedStateFromError`) | React provides official tree unmounting and declarative fallback replacement only through class error boundaries. |
| Cents Arithmetic | Floating-point math (`amount * 100`) | `currency.util.ts` (`toCents`, `fromCents`, `addCents`, `subtractCents`) | Ensures integer safety across all mutation payloads and calculation pipelines. |

**Key insight:** Firestore's client SDK already includes world-class offline caching and real-time push streams. Our architectural responsibility is providing clean subscription lifecycle hooks (`RealtimeSyncManager`), deterministic unsubscriptions, and reconciling local pending mutations.
</dont_hand_roll>

<common_pitfalls>
## Common Pitfalls

### Pitfall 1: Unsubscribed Listener Memory Leaks Across Route Navigation
**What goes wrong:** As users navigate between screens or switch between months, old `onSnapshot` listeners remain active in the background. Firestore read billing explodes, and state updates trigger warnings on unmounted components.
**Why it happens:** Missing return cleanup function in `useEffect`, or storing unsubscribe callbacks in local variables that get lost across re-renders.
**How to avoid:** Manage subscriptions through `RealtimeSyncManager` which tracks all active keys, increments/decrements subscriber counts, and executes `unsubscribe()` deterministically. In addition, hook into `AuthProvider` logout events to execute `RealtimeSyncManager.teardownAll()`.
**Warning signs:** Firestore read operations increase linearly with every screen transition in the Firebase console.

### Pitfall 2: Optimistic Offline Mutation Wipeout
**What goes wrong:** A user logs an expense while offline. When returning to the dashboard or when connection briefly flickers, the local pending transaction disappears from the list, then reappears later after syncing.
**Why it happens:** The `onSnapshot` callback overwrites the entire state array with the server's snapshot (which doesn't yet have the pending write).
**How to avoid:** In provider state setters, filter the previous state for `syncStatus === 'pending'` items whose IDs are not yet present in the incoming snapshot, and prepend them to the server items: `[...uniquePending, ...remoteExpenses]`.
**Warning signs:** Items flash or disappear temporarily during offline-to-online transitions.

### Pitfall 3: Duplicate Writes During Auto-Sync Reconnection
**What goes wrong:** When connection is restored, duplicate expense documents appear in Firestore.
**Why it happens:** Using Firestore's `addDoc` (which auto-generates a new ID on every invocation) rather than deterministic client-generated document IDs with `setDoc(docRef, data, { merge: true })`.
**How to avoid:** Always use deterministic IDs (`exp_${timestamp}_${random}`) generated at mutation creation time, and execute `setDoc` with `{ merge: true }` in `ExpenseService.processSyncQueue`.
**Warning signs:** Duplicate transactions with identical amounts and titles but differing Firestore document IDs.

### Pitfall 4: Unhandled Error Boundary Cascade
**What goes wrong:** A small syntax or rendering error in one minor subcomponent (e.g. a chart tooltip) crashes the entire application down to a blank white screen.
**Why it happens:** Having only a single root ErrorBoundary, or not having any error boundaries at all.
**How to avoid:** Nest error boundaries hierarchically:
1. Root ErrorBoundary in `app/_layout.tsx` (catches fatal app-level initialization crashes).
2. Feature ErrorBoundary in `app/(app)/_layout.tsx` or wrapping specific complex screens/charts.
**Warning signs:** White screen of death on web/mobile during unexpected runtime errors.

### Pitfall 5: Toast Notification Queue Overflow & Layout Clutter
**What goes wrong:** A rapid sequence of network errors or sync events stacks 15 toast messages over the UI, blocking buttons and inputs.
**Why it happens:** Not limiting the maximum number of visible toasts and omitting auto-dismiss timeouts.
**How to avoid:** Limit visible toasts to at most 3 items, auto-dismiss non-critical toasts after 3.5 seconds, and deduplicate identical consecutive messages.
**Warning signs:** Screen covered in overlapping alert bubbles.
</common_pitfalls>

<code_examples>
## Code Examples

### 1. Firestore Real-time Service Subscription Methods
```typescript
// src/features/expenses/services/expense.service.ts
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { Expense, SyncStatus } from '../types/expense.types';
import { toCents, fromCents } from '../utils/currency.util';
import { toISODate, formatMonth } from '../utils/date.util';

export const ExpenseService = {
  // ... existing methods ...

  /**
   * Subscribes to real-time expenses for a specific month.
   * Returns a deterministic Unsubscribe function.
   */
  subscribeToExpenses(
    userId: string,
    month: string,
    onData: (expenses: Expense[]) => void,
    onError?: (error: Error) => void
  ): Unsubscribe {
    const q = query(
      collection(db, `users/${userId}/expenses`),
      where('month', '==', month),
      orderBy('date', 'desc')
    );

    return onSnapshot(
      q,
      (snapshot) => {
        const expenses: Expense[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          const amountInCents = data.amountInCents ?? toCents(data.amount);
          const amount = data.amount ?? fromCents(amountInCents);

          return {
            id: docSnap.id,
            title: data.title || '',
            description: data.description || '',
            amount,
            amountInCents,
            category: data.category || 'General',
            date: data.date ? toISODate(data.date) : new Date().toISOString(),
            month: data.month || month,
            isLoan: Boolean(data.isLoan),
            loanPersonId: data.loanPersonId ?? null,
            loanCleared: Boolean(data.loanCleared),
            loanRepaid: data.loanRepaid ?? 0,
            loanTakenId: data.loanTakenId ?? null,
            draftId: data.draftId ?? null,
            installmentIndex: data.installmentIndex ?? null,
            createdAt: data.createdAt?.toDate
              ? data.createdAt.toDate().toISOString()
              : data.createdAt || new Date().toISOString(),
            updatedAt: data.updatedAt?.toDate
              ? data.updatedAt.toDate().toISOString()
              : data.updatedAt || new Date().toISOString(),
            syncStatus: snapshot.metadata.hasPendingWrites
              ? ('pending' as SyncStatus)
              : ('synced' as SyncStatus),
          };
        });

        onData(expenses);
      },
      (error) => {
        if (onError) onError(error);
      }
    );
  },
};
```

### 2. Category Real-time Subscription Method
```typescript
// src/features/categories/services/category.service.ts
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { CategoryItem } from '../types/category.types';

export const CategoryService = {
  // ... existing methods ...

  /**
   * Subscribes to real-time custom category updates for a user.
   */
  subscribeToCustomCategories(
    userId: string,
    onData: (categories: CategoryItem[]) => void,
    onError?: (error: Error) => void
  ): Unsubscribe {
    const q = query(
      collection(db, `users/${userId}/categories`),
      orderBy('name', 'asc')
    );

    return onSnapshot(
      q,
      (snapshot) => {
        const customs: CategoryItem[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            value: docSnap.id,
            label: data.name,
            icon: data.icon || '📁',
            isCustom: true,
          };
        });
        onData(customs);
      },
      (error) => {
        if (onError) onError(error);
      }
    );
  },
};
```

### 3. Universal Toast Notification Context & Dispatcher
```tsx
// src/context/ToastContext.tsx
import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastMessage {
  id: string;
  title?: string;
  message: string;
  type: ToastType;
  duration?: number;
}

export interface ToastContextValue {
  showToast: (toast: Omit<ToastMessage, 'id'>) => void;
  showSuccess: (message: string, title?: string) => void;
  showError: (message: string, title?: string) => void;
  showInfo: (message: string, title?: string) => void;
  showWarning: (message: string, title?: string) => void;
  hideToast: (id: string) => void;
}

export const ToastContext = createContext<ToastContextValue | null>(null);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const hideToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    ({ message, title, type = 'info', duration = 3500 }: Omit<ToastMessage, 'id'>) => {
      const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const newToast: ToastMessage = { id, message, title, type, duration };

      setToasts((prev) => [...prev.slice(-2), newToast]); // Keep max 3

      if (duration > 0) {
        setTimeout(() => {
          hideToast(id);
        }, duration);
      }
    },
    [hideToast]
  );

  const showSuccess = useCallback((msg: string, title?: string) => showToast({ message: msg, title, type: 'success' }), [showToast]);
  const showError = useCallback((msg: string, title?: string) => showToast({ message: msg, title, type: 'error' }), [showToast]);
  const showInfo = useCallback((msg: string, title?: string) => showToast({ message: msg, title, type: 'info' }), [showToast]);
  const showWarning = useCallback((msg: string, title?: string) => showToast({ message: msg, title, type: 'warning' }), [showToast]);

  const value = useMemo(
    () => ({ showToast, showSuccess, showError, showInfo, showWarning, hideToast }),
    [showToast, showSuccess, showError, showInfo, showWarning, hideToast]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Toast Overlay Container */}
      <View
        pointerEvents="box-none"
        className="absolute top-0 left-0 right-0 z-50 items-center px-4 pt-12"
      >
        {toasts.map((t) => {
          const bgColors = {
            success: 'bg-emerald-600 dark:bg-emerald-500',
            error: 'bg-rose-600 dark:bg-rose-500',
            warning: 'bg-amber-600 dark:bg-amber-500',
            info: 'bg-indigo-600 dark:bg-indigo-500',
          };
          const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️',
          };

          return (
            <TouchableOpacity
              key={t.id}
              testID={`toast-${t.type}`}
              activeOpacity={0.9}
              onPress={() => hideToast(t.id)}
              className={`w-full max-w-md ${bgColors[t.type]} rounded-2xl p-4 shadow-lg mb-2 flex-row items-center justify-between`}
            >
              <View className="flex-row items-center flex-1 mr-2">
                <Text className="text-base mr-3">{icons[t.type]}</Text>
                <View className="flex-1">
                  {t.title && (
                    <Text className="text-white font-bold text-xs mb-0.5">{t.title}</Text>
                  )}
                  <Text className="text-white text-xs">{t.message}</Text>
                </View>
              </View>
              <Text className="text-white/80 text-xs font-bold ml-2">✕</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </ToastContext.Provider>
  );
};

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
```

### 4. Global Connection Status Banner Component
```tsx
// src/components/feedback/ConnectionStatusBanner.tsx
import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNetworkStatus } from '../../features/expenses/hooks/useNetworkStatus';
import { useAuth } from '../../features/auth/hooks/useAuth';

interface Props {
  pendingCount?: number;
  isSyncing?: boolean;
  onSyncNow?: () => void;
}

export const ConnectionStatusBanner: React.FC<Props> = ({
  pendingCount = 0,
  isSyncing = false,
  onSyncNow,
}) => {
  const { isOnline } = useNetworkStatus();
  const { user } = useAuth();

  if (!user || (isOnline && pendingCount === 0 && !isSyncing)) {
    return null;
  }

  if (!isOnline) {
    return (
      <View
        testID="connection-status-banner-offline"
        className="w-full bg-amber-500 py-1.5 px-4 flex-row items-center justify-center z-40"
      >
        <Text className="text-white text-xs font-bold mr-2">📡 Offline Mode</Text>
        <Text className="text-white/90 text-xs">
          {pendingCount > 0
            ? `(${pendingCount} pending ${pendingCount === 1 ? 'change' : 'changes'} saved locally)`
            : 'Changes will sync when reconnected'}
        </Text>
      </View>
    );
  }

  if (isSyncing) {
    return (
      <View
        testID="connection-status-banner-syncing"
        className="w-full bg-indigo-600 py-1.5 px-4 flex-row items-center justify-center z-40"
      >
        <ActivityIndicator size="small" color="#ffffff" className="mr-2" />
        <Text className="text-white text-xs font-bold">Synchronizing changes...</Text>
      </View>
    );
  }

  if (pendingCount > 0 && onSyncNow) {
    return (
      <View
        testID="connection-status-banner-pending"
        className="w-full bg-indigo-500 py-1.5 px-4 flex-row items-center justify-between z-40"
      >
        <Text className="text-white text-xs font-medium">
          {pendingCount} unsynced {pendingCount === 1 ? 'change' : 'changes'}
        </Text>
        <TouchableOpacity
          testID="connection-banner-sync-btn"
          onPress={onSyncNow}
          className="bg-white/20 px-2 py-0.5 rounded"
        >
          <Text className="text-white text-[11px] font-bold">Sync Now</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return null;
};
```
</code_examples>

<validation_architecture>
## Validation Architecture

### 1. Test Suite Organization
To guarantee leak-free synchronization and multi-platform stability, Phase 6 incorporates automated tests across four distinct tiers:

```
__tests__/
├── features/
│   ├── sync/
│   │   ├── RealtimeSyncManager.test.ts          # Registry, ref-counting, unregister, teardownAll
│   │   └── useFirestoreSubscription.test.ts     # Hook subscription lifecycle & unmount cleanup
│   ├── expenses/
│   │   └── ExpenseProvider.realtime.test.tsx    # onSnapshot listener, optimistic merge, auto-sync
│   ├── categories/
│   │   └── CategoryProvider.realtime.test.tsx   # Category onSnapshot real-time reflection
│   ├── budgets/
│   │   └── BudgetProvider.realtime.test.tsx     # Budget onSnapshot real-time reflection
│   └── feedback/
│       ├── ErrorBoundary.test.tsx               # Error catching, custom fallback, retry reset
│       ├── ToastContext.test.tsx                # Toast dispatch, auto-dismiss timer, limit clamping
│       └── ConnectionStatusBanner.test.tsx      # Offline / syncing / pending banner display states
└── routes/
    └── full-app-stability.test.tsx              # End-to-end multi-provider hierarchy mounting
```

### 2. Concrete Test Validation Scenarios

#### Scenario A: Subscription Teardown on Logout / Auth Transition
- **Goal:** Verify that logging out immediately terminates all active Firestore listeners.
- **Verification:**
  1. Initialize `ExpenseProvider`, `CategoryProvider`, and `BudgetProvider` with authenticated user.
  2. Assert `RealtimeSyncManager.getActiveCount() > 0`.
  3. Trigger `AuthProvider` sign out.
  4. Assert `RealtimeSyncManager.getActiveCount() === 0` and all mocked Firestore `unsubscribe` spies were invoked.

#### Scenario B: Optimistic Offline Mutation Merging & Reconnection Sync
- **Goal:** Verify that pending offline mutations are not wiped out by incoming server snapshots before the queue drains.
- **Verification:**
  1. Simulate offline state (`isOnline = false`).
  2. Create an expense via `addExpense` (syncStatus: `'pending'`).
  3. Simulate Firestore `onSnapshot` emitting remote records.
  4. Assert state contains BOTH the pending local expense and remote records without duplication.
  5. Simulate reconnect (`isOnline = true`), trigger `syncQueue()`, and verify pending count drops to 0 while expense updates to `'synced'`.

#### Scenario C: ErrorBoundary Component Crash Recovery
- **Goal:** Verify that a throwing child component does not crash the entire app.
- **Verification:**
  1. Render a child component that throws `new Error('Simulated Render Crash')` inside `ErrorBoundary`.
  2. Assert the crash fallback UI renders with testID `error-boundary-fallback`.
  3. Click "Try Again", verify state resets and normal rendering resumes when error condition is resolved.

#### Scenario D: Toast Dispatch & Auto-Dismissal
- **Goal:** Verify toasts appear, display correct icons/messages, and auto-dismiss after timeout.
- **Verification:**
  1. Render test harness using `useToast()`.
  2. Call `showSuccess('Expense Saved!')`.
  3. Assert element with testID `toast-success` is present in DOM.
  4. Advance Jest fake timers by 3500ms.
  5. Assert toast is removed from DOM.

### 3. Build & Health Gates
- **TypeScript Typecheck:** `npm run typecheck` (`tsc --noEmit`) with zero errors.
- **Web Export Build:** `npm run build:web` (`expo export --platform web`) producing static web bundles without SSR or Hermes bundling failures.
- **Full Test Suite:** `npm test` executing all test suites across authentication, expenses, categories, budgets, dashboards, sync, and feedback.
</validation_architecture>

<sota_updates>
## State of the Art (2024-2026)

| Old Approach | Current Approach (2026) | When Changed | Impact |
|--------------|-------------------------|--------------|--------|
| Polling queries (`setInterval` with `getDocs`) | WebSocket real-time streams (`onSnapshot`) with subscriber pooling | Firebase v9+ Modular SDK | Zero latency sync across devices, reduced Firestore read bills, instant feedback. |
| Global window.alert / native-only alerts | Context-based universal Toast overlays | React 18+ Universal RN | Flawless cross-platform UX on iOS, Android, and Web browsers without platform branching. |
| Manual reload on render crash | Declarative class Error Boundaries with reset hooks | React 16-18 standard | Eliminates white-screen app termination, isolates errors to individual feature tabs. |
| Ad-hoc local array caching | Reconciled Optimistic Store with AsyncStorage Queue | Modern Offline-First Patterns | Seamless offline UX with zero data loss or duplicate write hazards. |

**New tools/patterns to consider:**
- **Firestore Snapshot Metadata (`snapshot.metadata.hasPendingWrites`):** Native indication of local uncommitted writes directly from the Firestore SDK.
- **Safe Area Inset Aware Overlays:** Placing toasts and banners using `react-native-safe-area-context` ensures layout perfection on notched phones and dynamic islands.
</sota_updates>

<open_questions>
## Open Questions

1. **How should DashboardProvider respond to real-time changes across multiple subcollections?**
   - *What we know:* Dashboard aggregates data from `expenses`, `saving-entries`, `income-entries`, and `loans-taken`.
   - *Recommendation:* When `ExpenseContext` or other providers receive new snapshot data, `DashboardProvider` can be notified via context dependency or trigger a lightweight re-aggregation from local state without issuing redundant network queries.

2. **Should `RealtimeSyncManager` be a pure TypeScript class singleton or a React Context?**
   - *What we know:* A TypeScript class singleton allows services, hooks, and lifecycle listeners to register subscriptions without needing React Component tree context nesting, while still supporting complete reset on auth change.
   - *Recommendation:* Implement `RealtimeSyncManager` as a module singleton and wrap it with `useFirestoreSubscription` for React component lifecycle binding.
</open_questions>

<sources>
## Sources

### Primary (HIGH confidence)
- Firebase Official Documentation: Firestore Realtime Updates (`onSnapshot`), Metadata (`hasPendingWrites`), and Offline Persistence.
- React Official Documentation: Error Boundaries (`componentDidCatch`, `getDerivedStateFromError`).
- React Native NetInfo Documentation: Cross-platform network state handling.

### Secondary (MEDIUM confidence)
- React Native Web cross-platform styling & toast overlay best practices.
- Offline First design patterns with durable queue reconciliation.
</sources>

<metadata>
## Metadata

**Research scope:**
- Core technology: Firebase Cloud Firestore `onSnapshot`, React ErrorBoundary, NetInfo, AsyncStorage
- Ecosystem: React Native, Expo SDK 52, NativeWind, Expo Router
- Patterns: Subscription Lifecycle Registry, Optimistic Merge Reconciliation, Error Containment, Toast Overlay
- Pitfalls: Listener memory leaks, optimistic overwrite, duplicate reconnection writes, layout crashes

**Confidence breakdown:**
- Standard stack: HIGH - all libraries verified and installed
- Architecture: HIGH - matches existing service/provider architecture
- Pitfalls: HIGH - verified against PITFALLS.md and production failure modes
- Code examples: HIGH - TypeScript strict mode verified

**Research date:** 2026-08-23
**Valid until:** 2026-09-23 (30 days)
</metadata>

---

*Phase: 06-real-time-synchronization-stability*
*Research completed: 2026-08-23*
*Ready for planning: yes*
