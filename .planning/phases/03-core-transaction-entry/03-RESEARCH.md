# Phase 3: Core Transaction Entry - Research

**Researched:** 2026-08-23
**Domain:** Cross-Platform Transaction Entry, Safe Currency Math, and Offline Queue Synchronization (React Native, Web, Firebase, AsyncStorage)
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

No user constraints - all decisions at the agent's discretion.

### Locked Decisions
- **Manual Expense Entry:** Users can enter expense amounts, categories, and dates quickly with complete validation (TXN-01).
- **Safe Currency Mathematics:** Monetary values must be processed using integer cents calculations to eliminate JavaScript floating-point errors (TXN-02).
- **Offline Storage & Synchronization:** Expenses recorded when the device is offline must be stored locally in AsyncStorage and automatically synchronized with Cloud Firestore upon network reconnection (TXN-03).
- **Schema & Business Logic Parity:** Match the data model and workflow of the existing Angular application (`Expense`, `CreateExpenseDto`, `UpdateExpenseDto`, `ExpenseCategory`, and `CategoryItem`).
- **Testing & Quality:** Comprehensive automated unit tests using Jest and `@testing-library/react-native` for math utilities, offline queueing logic, sync services, and form components.

### The Agent's Discretion
- **Form Architecture:** Multi-step wizard matching Angular's 3-step UX (Step 1: Amount & Category; Step 2: Title & Date with smart suggestions; Step 3: Notes, loan metadata, and summary confirmation).
- **Currency Math Architecture:** Dedicated immutable financial math utility module (`currency.util.ts`) handling string parsing, integer cents conversion, addition, subtraction, multiplication, division, and formatted display via `Intl.NumberFormat`.
- **Offline Queue Design:** Persistent FIFO mutation queue in `AsyncStorage` with optimistic UI updates, idempotency IDs, retry counters, and background reconciliation.
- **Connectivity Detection:** Universal connectivity listener integrating `@react-native-community/netinfo` with web fallback (`window.addEventListener('online')`), triggering queue processing on reconnect.
- **Form State & UI:** Built with React Native components styled with NativeWind v4 (Tailwind CSS) for responsive layouts across mobile viewports and desktop web.

### Deferred Ideas (OUT OF SCOPE)
- Receipt OCR scanning & image attachment (ADV-01) — Deferred to v2.
- Multi-currency conversions & foreign exchange rates (ADV-02) — Deferred to v2 (USD base currency for v1).
- Shared wallets & bill splitting (ADV-03) — Deferred to v2.
- Voice/NLP expense logging (ADV-04) — Deferred to v2.
- Full budget alerts & category limit enforcement — Phase 4 (Categorization & Budgeting).
</user_constraints>

<architectural_responsibility_map>
## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Financial Currency Math | Frontend Client (Pure Utilities) | Data Access Layer | Pure arithmetic functions operating strictly on integer cents eliminate floating-point drift before data touches persistence or UI. |
| Transaction Entry Form UI | Presentation Layer (NativeWind + RN) | Form Validation (State/Zod) | Manages multi-step user interaction, input masking, category selection, and instant feedback across mobile and web. |
| Offline Mutation Queue | Client Storage (AsyncStorage) | Local State (Zustand/Context) | Persists uncommitted transactions to durable device storage so no data is lost during app restarts or offline sessions. |
| Network State Detection | Client Environment (NetInfo / Web API) | Sync Queue Manager | Monitors active connectivity transitions (offline → online) to trigger synchronization cycles. |
| Remote Firestore Sync | Data Access Layer (`ExpenseService`) | Cloud Firestore (`users/{uid}/expenses`) | Commits validated transactions to the cloud database and updates local sync statuses. |
</architectural_responsibility_map>

<research_summary>
## Summary

Phase 3 delivers the core transaction entry engine for Expense Expert across Web, iOS, and Android. It equips users to record expenses rapidly and reliably—even in intermittent or offline network conditions—while ensuring zero financial inaccuracies through integer-based currency math.

The architecture solves three fundamental challenges:
1. **Precision Financial Math:** JavaScript's binary floating-point representation (`0.1 + 0.2 = 0.30000000000000004`) causes accumulation errors in accounting. All monetary values are ingested, manipulated, and queued as integer cents (e.g., `$19.99` → `1999` cents) with string-based parsing utilities, converting to decimal dollars only at display time or for Firestore document schema parity with the Angular app.
2. **Offline-First Resilience:** When the user records an expense without an active internet connection, the action is optimistically committed to local cache and appended to a persistent FIFO queue in `AsyncStorage`. A universal connectivity manager (`NetInfo` on native, `navigator.onLine` / `window` events on web) monitors connection status and flushes pending mutations to Cloud Firestore upon reconnection.
3. **Intuitive Multi-Step UX:** An interactive, responsive 3-step form UI (modeled after the Angular application) provides a dedicated large-format amount input, quick-tap category card picker with emoji icons, smart title suggestions, date selector, and summary review card.

**Primary recommendation:** Implement a standalone `currency.util.ts` math library, wrap Firestore writes with an `OfflineQueueService` backed by `AsyncStorage`, and construct a 3-step `ExpenseForm` component with NativeWind styling and universal date handling.
</research_summary>

<standard_stack>
## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `firebase/firestore` | ^11.0.0 | Cloud Database | Standard modular Firestore SDK for storing user transactions in `users/{uid}/expenses`. |
| `@react-native-async-storage/async-storage` | 1.23.1 | Durable Offline Queue Storage | Standard key-value storage across React Native platforms, persisting queued mutations and cached expense entries. |
| `@react-native-community/netinfo` | ^11.4.1 | Network Connectivity Listener | Universal network detection standard for React Native and Expo, providing reliable online/offline event hooks. |
| `nativewind` | ^4.1.23 | Universal Styling | Tailwind CSS utility classes ensuring pixel-perfect layout parity with the Angular web app across mobile and desktop. |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `date-fns` | ^4.1.0 | Date Manipulation & Formatting | Formatting transaction dates (`yyyy-MM-dd`), generating `YYYY-MM` month partition keys, and date arithmetic. |
| `expo-router` | ~4.0.0 | Navigation & Screen Transitions | Handling form navigation (`/(app)/expenses/new`, `/(app)/expenses/[id]`) and modal flows. |
| `react-native-safe-area-context` | 4.12.0 | Safe Area Insets | Protecting form inputs and bottom action bars against device notches and home indicators. |

### Development & Testing
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `jest` | ^29.7.0 | Test Framework | Executing math unit tests, queue synchronization suites, and service mocks. |
| `jest-expo` | ~52.0.0 | Expo Test Preset | Provides standard mocks for React Native, AsyncStorage, and NetInfo. |
| `@testing-library/react-native` | ^13.0.0 | Component Testing | Simulating user interactions across expense form steps, category selections, and submit handlers. |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom Integer Math (`currency.util.ts`) | `currency.js` or `decimal.js` | Custom integer cents utility is zero-dependency, lightweight (<1KB), fully type-safe, tailored specifically for 2-decimal USD currency, and avoids bundle bloat. |
| Custom AsyncStorage FIFO Queue | WatermelonDB / Redux-Offline | WatermelonDB requires native SQLite bridging and complex schema migrations. An AsyncStorage FIFO queue is lightweight, robust, universal for Web/Mobile, and matches the project's architecture. |
| Built-in Platform Date Inputs | Native DateTimePicker | Platform-aware date inputs (`<input type="date">` on web, modal/calendar date selector on mobile) ensure universal consistency without native build configuration hurdles. |

**Installation:**
```bash
# In expense-expert-rn/
npx expo install @react-native-community/netinfo
npm install date-fns
```
</standard_stack>

<architecture_patterns>
## Architecture Patterns

### System Architecture Diagram

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              Presentation Layer (UI)                                   │
│                                                                                        │
│   app/(app)/expenses/new.tsx               app/(app)/expenses/[id].tsx                │
│             │                                           │                              │
│             ▼                                           ▼                              │
│    [ ExpenseForm Wizard ] ──(Step 1: Amount & Cat, Step 2: Title/Date, Step 3: Review)  │
│             │                                                                          │
│             ▼                                                                          │
│    [ useExpenses Hook / UI State ]                                                     │
└─────────────┬──────────────────────────────────────────────────────────────────────────┘
              │
              ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                         Core Business & Math Utilities                                 │
│                                                                                        │
│   [ currency.util.ts ]                                                                 │
│   - toCents("19.99") ──> 1999 (integer)                                                │
│   - fromCents(1999)  ──> 19.99 (decimal)                                               │
│   - addCents / subtractCents / formatCurrency                                          │
└─────────────┬──────────────────────────────────────────────────────────────────────────┘
              │
              ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        Data Access & Offline Synchronization                           │
│                                                                                        │
│                              [ ExpenseService ]                                        │
│                                      │                                                 │
│                 ┌────────────────────┴────────────────────┐                            │
│                 │ (Device Online)                         │ (Device Offline)           │
│                 ▼                                         ▼                            │
│     [ Cloud Firestore DB ]                      [ OfflineQueueService ]                │
│     - addDoc('users/{uid}/expenses')            - Enqueue Mutation in AsyncStorage    │
│     - updateDoc / deleteDoc                     - Optimistic Local Cache Update       │
│                 ▲                                         │                            │
│                 │                                         │                            │
│                 └────────── [ Sync Processor ] ───────────┘                            │
│                       (Triggered by NetInfo 'online')                                  │
└──────────────────────────────────────┬─────────────────────────────────────────────────┘
                                       │
┌──────────────────────────────────────┴─────────────────────────────────────────────────┐
│                              Storage & Network Tier                                    │
│                                                                                        │
│    - Durable Storage: @react-native-async-storage/async-storage                        │
│    - Connectivity: @react-native-community/netinfo + window 'online'                   │
│    - Backend: Cloud Firestore (Collection: users/{uid}/expenses)                       │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### Recommended Project Structure

```
expense-expert-rn/
├── src/
│   ├── features/
│   │   ├── expenses/
│   │   │   ├── components/
│   │   │   │   ├── ExpenseForm.tsx             # 3-step wizard expense entry & edit form
│   │   │   │   ├── CategoryCardPicker.tsx      # Grid of categories with emojis & custom add
│   │   │   │   ├── AmountInput.tsx             # Large-format currency input with formatting
│   │   │   │   ├── DateSelector.tsx            # Universal cross-platform date selector
│   │   │   │   └── OfflineSyncBanner.tsx       # Visual indicator of pending offline sync items
│   │   │   ├── context/
│   │   │   │   ├── ExpenseContext.tsx          # Context definition for expense mutations & state
│   │   │   │   └── ExpenseProvider.tsx         # Provider managing expenses, queue, and sync
│   │   │   ├── hooks/
│   │   │   │   ├── useExpenses.ts              # Hook to read expenses and trigger add/edit/delete
│   │   │   │   └── useNetworkStatus.ts         # Hook to track online/offline connectivity
│   │   │   ├── services/
│   │   │   │   ├── expense.service.ts          # Firestore operations with offline fallback
│   │   │   │   ├── offline-queue.service.ts    # AsyncStorage FIFO queue management & sync processor
│   │   │   │   └── category.service.ts         # Built-in & custom category management
│   │   │   ├── types/
│   │   │   │   ├── expense.types.ts            # Expense, CreateExpenseDto, UpdateExpenseDto, QueuedMutation
│   │   │   │   └── category.types.ts           # CategoryItem, ExpenseCategory enum
│   │   │   └── utils/
│   │   │       ├── currency.util.ts            # Safe integer cents math & currency formatting
│   │   │       └── date.util.ts                # Date formatting & month partition helpers
│   ├── components/
│   │   └── ui/                                 # Button, Input, Card, Modal, Spinner
│   └── config/
│       └── firebase.ts                         # Firebase app, auth, firestore
└── __tests__/
    └── features/
        └── expenses/
            ├── currency.util.test.ts           # Integer cents arithmetic and parsing tests
            ├── offline-queue.service.test.ts   # Queueing, deduplication, retry, and sync tests
            ├── expense.service.test.ts         # Service operations and online/offline branching
            └── ExpenseForm.test.tsx            # Multi-step form rendering, validation, and submission
```

### Pattern 1: Safe Integer Currency Math & Conversion

**What:** Represent all monetary calculations as whole integer cents. Never perform arithmetic directly on floating-point numbers.
**When to use:** In `currency.util.ts` for all financial operations, validations, totals, and UI conversions.
**Implementation Example:**

```typescript
// src/features/expenses/utils/currency.util.ts

/**
 * Converts a decimal dollar input (number or string) to integer cents.
 * Handles edge cases like "12.34", 12.34, "0.1", ".5", "1,234.56" safely.
 */
export function toCents(amount: number | string | null | undefined): number {
  if (amount == null) return 0;

  if (typeof amount === 'number') {
    if (isNaN(amount) || !isFinite(amount)) return 0;
    // Use Math.round to avoid IEEE 754 float drift like 1.15 * 100 = 114.99999999999999
    return Math.round(amount * 100);
  }

  // Clean string: remove currency symbols, spaces, commas
  const cleaned = amount.replace(/[^0-9.-]/g, '').trim();
  if (!cleaned || cleaned === '-' || cleaned === '.') return 0;

  const isNegative = cleaned.startsWith('-');
  const unsigned = isNegative ? cleaned.slice(1) : cleaned;

  const parts = unsigned.split('.');
  const whole = parseInt(parts[0] || '0', 10);
  const fractionStr = (parts[1] || '').padEnd(2, '0').slice(0, 2);
  const fraction = parseInt(fractionStr, 10);

  const totalCents = whole * 100 + fraction;
  return isNegative ? -totalCents : totalCents;
}

/**
 * Converts integer cents back to decimal currency number (e.g. 1999 -> 19.99).
 */
export function fromCents(cents: number): number {
  if (!cents || isNaN(cents)) return 0;
  return Math.round(cents) / 100;
}

/**
 * Adds two monetary amounts in cents.
 */
export function addCents(a: number, b: number): number {
  return Math.round(a) + Math.round(b);
}

/**
 * Subtracts b from a in cents.
 */
export function subtractCents(a: number, b: number): number {
  return Math.round(a) - Math.round(b);
}

/**
 * Multiplies cents by a factor with rounding to nearest cent.
 */
export function multiplyCents(cents: number, factor: number): number {
  return Math.round(cents * factor);
}

/**
 * Divides cents by a divisor with rounding to nearest cent.
 */
export function divideCents(cents: number, divisor: number): number {
  if (divisor === 0) throw new Error('Division by zero in currency math');
  return Math.round(cents / divisor);
}

/**
 * Formats integer cents into a localized currency string (e.g. 1250 -> "$12.50").
 */
export function formatCents(
  cents: number,
  currency: string = 'USD',
  locale: string = 'en-US'
): string {
  const dollars = fromCents(cents);
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(dollars);
}
```

### Pattern 2: Multi-Step Responsive Expense Entry Form UI

**What:** 3-step progressive disclosure form matching Angular UI/UX with smooth transitions and keyboard avoidance.
**When to use:** In `src/features/expenses/components/ExpenseForm.tsx`.
**Implementation Strategy:**
- **Step 1 (Amount & Category):** Large numeric input (`$0.00`) and grid category picker with emojis.
- **Step 2 (Title & Date):** Title field with quick-select suggestion pills ("Grocery", "Coffee", "Transport", "Utilities", "Shopping") and date input defaulting to today.
- **Step 3 (Details & Summary):** Optional description/note textarea, loan toggle (person selector), and a summary breakdown card before saving.
- **Sticky Bottom Action Bar:** Consistent Next/Back and Save buttons with mobile-safe padding.

### Pattern 3: Offline Mutation Queueing with AsyncStorage

**What:** Persistent mutation log storing pending actions (`CREATE_EXPENSE`, `UPDATE_EXPENSE`, `DELETE_EXPENSE`) when network requests fail or when the device is disconnected.
**When to use:** In `src/features/expenses/services/offline-queue.service.ts`.
**Implementation Example:**

```typescript
// src/features/expenses/services/offline-queue.service.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { QueuedMutation } from '../types/expense.types';

const QUEUE_STORAGE_KEY = '@expense_expert_offline_queue';

export const OfflineQueueService = {
  /** Retrieve all pending mutations */
  async getQueue(): Promise<QueuedMutation[]> {
    try {
      const data = await AsyncStorage.getItem(QUEUE_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (err) {
      console.error('Failed to load offline queue from AsyncStorage:', err);
      return [];
    }
  },

  /** Enqueue a mutation */
  async enqueue(mutation: Omit<QueuedMutation, 'id' | 'timestamp' | 'retryCount'>): Promise<QueuedMutation> {
    const queue = await this.getQueue();
    const newEntry: QueuedMutation = {
      ...mutation,
      id: `mut_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      retryCount: 0,
    };
    queue.push(newEntry);
    await AsyncStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));
    return newEntry;
  },

  /** Remove a processed mutation by ID */
  async remove(id: string): Promise<void> {
    const queue = await this.getQueue();
    const filtered = queue.filter((item) => item.id !== id);
    await AsyncStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(filtered));
  },

  /** Increment retry count on failure */
  async markFailed(id: string, error: string): Promise<void> {
    const queue = await this.getQueue();
    const updated = queue.map((item) => {
      if (item.id === id) {
        return {
          ...item,
          retryCount: item.retryCount + 1,
          lastError: error,
        };
      }
      return item;
    });
    await AsyncStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(updated));
  },

  /** Clear entire queue (e.g. on user logout) */
  async clearQueue(): Promise<void> {
    await AsyncStorage.removeItem(QUEUE_STORAGE_KEY);
  },
};
```

### Pattern 4: Universal Network Connectivity Listener & Automatic Sync Processor

**What:** Detect network state changes universally across Web and Native, executing queued mutations in FIFO order upon reconnect.
**When to use:** In `src/features/expenses/hooks/useNetworkStatus.ts` and `ExpenseProvider`.
**Implementation Example:**

```typescript
// src/features/expenses/hooks/useNetworkStatus.ts
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState<boolean>(true);

  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);

      setIsOnline(navigator.onLine);
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }

    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      const connected = state.isConnected ?? true;
      const reachable = state.isInternetReachable ?? true;
      setIsOnline(connected && reachable);
    });

    return () => unsubscribe();
  }, []);

  return { isOnline };
}
```

### Anti-Patterns to Avoid

- **Direct Floating-Point Storage Without Conversion:** Writing raw user text (`"10.999"`) directly to arithmetic totals causes floating-point corruption in sums and balances. Always sanitize and operate in integer cents.
- **Dropping Offline Mutations on Network Error:** Failing an offline request immediately instead of persisting to `AsyncStorage` causes permanent data loss when users enter expenses in elevators, subways, or poor reception.
- **Unbounded Queue Retries Blocking Sync:** If a corrupted payload or permission error rejects a document, repeating it infinitely blocks the entire queue. Cap retries (e.g. 3 attempts) and quarantine failing items.
- **Date/Timestamp Deserialization Mismatches:** Firestore `Timestamp` objects do not serialize directly to JSON in `AsyncStorage`. Serialize dates as ISO strings (`date.toISOString()`) and convert back upon hydration.
</architecture_patterns>

<dont_hand_roll>
## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Currency Formatting Across Locales | Custom regex string replacers (`'$' + val.toFixed(2)`) | `Intl.NumberFormat` with specified currency & locale | Handles negative values (`-$10.00` vs `($10.00)`), decimal commas (Europe), currency symbols, and internationalization standards natively. |
| Date Formatting & Parsing | Custom date regex slicing and manual leap year math | `date-fns` (`format`, `parseISO`, `isValid`) | Handles timezone offsets, leap years, month boundaries, and edge cases consistently across web and native. |
| Network State Monitoring | Custom ping intervals with `fetch('https://google.com')` | `@react-native-community/netinfo` + web events | Custom polling drains mobile battery and network bandwidth. NetInfo uses native OS network hooks and event-driven web listeners. |
| Unique ID Generation for Offline Items | `Math.random().toString()` alone | UUID or timestamp + entropy `mut_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` | Prevents ID collisions when multiple offline entries are logged in the same millisecond. |

**Key insight:** Financial data integrity and network state management require strict guarantees. Relying on browser/OS native capabilities (`Intl`, NetInfo events) and tested primitives prevents silent math errors and battery drain.
</dont_hand_roll>

<common_pitfalls>
## Common Pitfalls

### Pitfall 1: Binary Floating-Point Rounding in JavaScript
**What goes wrong:** Adding `$0.10` and `$0.20` results in `$0.30000000000000004`, or calculating a 15% tip on `$1.15` drops a cent due to `1.15 * 100 = 114.99999999999999`.
**Why it happens:** Standard IEEE 754 double-precision floats cannot accurately represent base-10 fractional numbers.
**How to avoid:** Convert all user inputs to integer cents (`Math.round(amount * 100)` or string-split parser) immediately at the input boundary. Store and calculate strictly with integer cents.
**Warning signs:** Summary cards showing values with 10+ decimal digits or calculation unit tests failing on specific cent amounts.

### Pitfall 2: Firestore Timestamps vs Date Serialization across AsyncStorage
**What goes wrong:** Queued mutations stored in `AsyncStorage` fail when JSON-parsed because Firestore `serverTimestamp()` or JavaScript `Date` instances turn into strings or empty objects `{}`.
**Why it happens:** `JSON.stringify` does not preserve class prototypes or non-enumerable methods of `Date` and `FieldValue` objects.
**How to avoid:** In offline queue payloads, store dates as ISO 8601 strings (`date.toISOString()`). The sync processor reconstructs `new Date(isoString)` or applies `serverTimestamp()` when constructing the Firestore document.
**Warning signs:** Firestore records created with `date: null` or `NaN` timestamps when synced from offline mode.

### Pitfall 3: Duplicate Submission / Idempotency in Offline Sync Queue
**What goes wrong:** An expense submitted offline is written twice to Firestore if the user taps save multiple times or if a sync attempt is interrupted mid-flight.
**Why it happens:** Lack of unique client-generated document IDs or mutation idempotency keys.
**How to avoid:** Assign a client-side UUID to each created expense. When syncing, use Firestore `setDoc(doc(db, path, clientExpenseId), data)` rather than `addDoc`, guaranteeing idempotent writes even if retried.
**Warning signs:** Duplicate expense records appearing in Firestore with identical amounts and timestamps.

### Pitfall 4: Form Re-renders on High-Frequency Currency Input
**What goes wrong:** Tapping digits rapidly in the amount input causes cursor jumping, lag, or misplaced decimals.
**Why it happens:** Formatting the input value on every keystroke with a naive controlled input.
**How to avoid:** Keep raw numeric/string state in the form, and apply currency mask formatting cleanly without interfering with the cursor or user typing flow.
**Warning signs:** Inability to backspace easily in the amount field on mobile devices.

### Pitfall 5: Unhandled Offline Queue Race Conditions During App Reload
**What goes wrong:** The user creates an expense offline, closes the app, reopens it while still offline, and the transaction list is empty.
**Why it happens:** Local cache was stored only in component memory (`useState`) rather than hydrated from persistent storage.
**How to avoid:** Hydrate the local expenses cache from `AsyncStorage` on app mount, merging pending offline queue items into the displayed list with an optimistic `syncStatus: 'pending'` badge.
**Warning signs:** Offline entries disappear after restarting the app.
</common_pitfalls>

<code_examples>
## Code Examples

### 1. Complete Expense Service with Offline Queueing & Firestore Sync
```typescript
// src/features/expenses/services/expense.service.ts
import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../../../config/firebase';
import {
  Expense,
  CreateExpenseDto,
  UpdateExpenseDto,
  QueuedMutation,
} from '../types/expense.types';
import { OfflineQueueService } from './offline-queue.service';
import { toCents, fromCents } from '../utils/currency.util';
import { formatMonth } from '../utils/date.util';

export const ExpenseService = {
  getExpensesPath(userId: string): string {
    return `users/${userId}/expenses`;
  },

  /** Generate client-side unique ID for idempotent writes */
  generateExpenseId(): string {
    return `exp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  },

  /** Add expense with offline queue support */
  async addExpense(
    userId: string,
    dto: CreateExpenseDto,
    isOnline: boolean
  ): Promise<Expense> {
    const expenseId = this.generateExpenseId();
    const dateObj = dto.date instanceof Date ? dto.date : new Date(dto.date);
    const month = formatMonth(dateObj);
    const amountInCents = toCents(dto.amount);
    const amount = fromCents(amountInCents);

    const newExpense: Expense = {
      id: expenseId,
      title: dto.title.trim(),
      description: (dto.description || '').trim(),
      amount,
      amountInCents,
      category: dto.category,
      date: dateObj.toISOString(),
      month,
      isLoan: dto.isLoan || false,
      loanPersonId: dto.isLoan ? dto.loanPersonId || null : null,
      loanCleared: false,
      loanRepaid: 0,
      loanTakenId: dto.loanTakenId || null,
      draftId: dto.draftId || null,
      installmentIndex: dto.installmentIndex ?? null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      syncStatus: isOnline ? 'synced' : 'pending',
    };

    if (isOnline) {
      try {
        const docRef = doc(db, this.getExpensesPath(userId), expenseId);
        await setDoc(docRef, {
          ...newExpense,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        return { ...newExpense, syncStatus: 'synced' };
      } catch (err) {
        console.warn('Online write failed, fallback to offline queue:', err);
      }
    }

    // Offline or network error: enqueue mutation
    await OfflineQueueService.enqueue({
      type: 'CREATE_EXPENSE',
      userId,
      expenseId,
      payload: newExpense,
    });

    return { ...newExpense, syncStatus: 'pending' };
  },

  /** Process pending offline mutations */
  async processSyncQueue(userId: string): Promise<number> {
    const queue = await OfflineQueueService.getQueue();
    const userMutations = queue.filter((m) => m.userId === userId);
    let syncedCount = 0;

    for (const mutation of userMutations) {
      try {
        const path = this.getExpensesPath(userId);
        if (mutation.type === 'CREATE_EXPENSE') {
          const docRef = doc(db, path, mutation.expenseId);
          await setDoc(docRef, {
            ...mutation.payload,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        } else if (mutation.type === 'UPDATE_EXPENSE') {
          const docRef = doc(db, path, mutation.expenseId);
          await updateDoc(docRef, {
            ...mutation.payload,
            updatedAt: serverTimestamp(),
          });
        } else if (mutation.type === 'DELETE_EXPENSE') {
          const docRef = doc(db, path, mutation.expenseId);
          await deleteDoc(docRef);
        }

        await OfflineQueueService.remove(mutation.id);
        syncedCount++;
      } catch (err: any) {
        console.error(`Failed to sync mutation ${mutation.id}:`, err);
        await OfflineQueueService.markFailed(mutation.id, err?.message || 'Sync failed');
        // Stop sequential queue on network error
        if (err?.code === 'unavailable' || err?.message?.includes('network')) {
          break;
        }
      }
    }

    return syncedCount;
  },
};
```

### 2. Category Card Picker Component (Universal Web & Mobile)
```typescript
// src/features/expenses/components/CategoryCardPicker.tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { ExpenseCategory, EXPENSE_CATEGORIES } from '../types/category.types';

interface CategoryCardPickerProps {
  selectedValue: string;
  onSelect: (category: string) => void;
  customCategories?: Array<{ id: string; name: string; icon: string; value: string }>;
  onAddCustomCategory?: (name: string, icon: string) => Promise<void>;
}

const BUILTIN_ICONS: Record<string, string> = {
  [ExpenseCategory.Food]: '🍔',
  [ExpenseCategory.Transport]: '🚌',
  [ExpenseCategory.Entertainment]: '🎮',
  [ExpenseCategory.Utilities]: '💡',
  [ExpenseCategory.Savings]: '💰',
  [ExpenseCategory.LoanRepayment]: '💳',
  [ExpenseCategory.Other]: '📁',
};

export const CategoryCardPicker: React.FC<CategoryCardPickerProps> = ({
  selectedValue,
  onSelect,
  customCategories = [],
  onAddCustomCategory,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('🏷️');

  const allCategories = [
    ...EXPENSE_CATEGORIES.map((c) => ({
      value: c.value,
      label: c.label,
      icon: BUILTIN_ICONS[c.value] || '📁',
      isCustom: false,
    })),
    ...customCategories.map((c) => ({
      value: c.value,
      label: c.name,
      icon: c.icon || '📁',
      isCustom: true,
    })),
  ];

  return (
    <View className="w-full">
      <View className="flex-row flex-wrap justify-between gap-y-3">
        {allCategories.map((cat) => {
          const isSelected = selectedValue === cat.value;
          return (
            <TouchableOpacity
              key={cat.value}
              onPress={() => onSelect(cat.value)}
              activeOpacity={0.7}
              className={`w-[31%] sm:w-[23%] aspect-square rounded-2xl items-center justify-center p-2 border-2 transition-all ${
                isSelected
                  ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40'
                  : 'border-transparent bg-slate-100 dark:bg-slate-800'
              }`}
            >
              <Text className="text-2xl mb-1">{cat.icon}</Text>
              <Text
                numberOfLines={1}
                className={`text-xs font-semibold text-center ${
                  isSelected
                    ? 'text-indigo-600 dark:text-indigo-400'
                    : 'text-slate-700 dark:text-slate-300'
                }`}
              >
                {cat.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};
```
</code_examples>

<sota_updates>
## State of the Art (2024-2026)

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| IEEE-754 floating point in app logic (`0.1 + 0.2`) | Integer cents arithmetic domain boundary | Standard Best Practice | Completely eliminates rounding drift, invalid cents, and split anomalies. |
| Redux-Offline / complex SQL replication | Lightweight durable FIFO queue in AsyncStorage with idempotent Firestore writes | Modern RN Architecture | Zero native build config required; works reliably across Web, Android, iOS. |
| Imperative date strings with manual regex | `date-fns` modular functions with ISO 8601 persistence | date-fns v3/v4 (2024) | High performance, lightweight bundle footprint, and timezone-safe date parsing. |
| Monolithic giant forms | Progressive 3-step disclosure wizards | Modern Mobile UX | Lowers cognitive load, yields higher data completion rates, and cleanly separates amount entry from metadata. |
</sota_updates>

<open_questions>
## Open Questions

1. **Custom Categories Sync in Offline Mode:**
   - What we know: Custom categories are stored in `users/{uid}/categories` in Firestore.
   - What's unclear: If a user defines a new custom category while offline, should it also queue in the mutation log?
   - Recommendation: Yes, use the same `OfflineQueueService` to queue custom category creations so any newly assigned category is persisted seamlessly on sync.

2. **Cross-Tab Web Sync Queue Execution:**
   - What we know: On web, multiple browser tabs might be open simultaneously.
   - What's unclear: Could two tabs try to process the AsyncStorage queue at the same instant?
   - Recommendation: Use client-side UUID document IDs (`exp_...`) with Firestore `setDoc`. Even if two tabs flush concurrently, the write is idempotent.
</open_questions>

<sources>
## Sources

### Primary (HIGH confidence)
- `expense-expert/src/app/core/services/expense.service.ts` — Verified exact Angular expense methods, DTO structures, loan handling, and month partitioning.
- `expense-expert/src/app/core/models/expense.model.ts` — Verified `Expense`, `CreateExpenseDto`, `UpdateExpenseDto`, `ExpenseCategory`, and `EXPENSE_CATEGORIES`.
- `expense-expert/src/app/features/expenses/expense-form/expense-form.component.ts` — Verified 3-step wizard flow, category card picker, title suggestions, and summary card.
- `expense-expert/src/app/core/services/category.service.ts` — Verified category icons, built-in vs custom category models, and collection paths.
- `expense-expert-rn/src/config/firebase.ts` — Verified modular Firestore initialization and AsyncStorage integration.

### Secondary (MEDIUM confidence)
- React Native Community NetInfo Documentation — Verified listener lifecycle and web fallback patterns.
- Mozilla Developer Network (MDN) Intl.NumberFormat Documentation — Verified currency formatting rules.

### Tertiary (LOW confidence - needs validation)
- None — all patterns verified against existing codebase and official specifications.
</sources>

## Validation Architecture

### 1. Test Framework & Setup
- **Test Runner:** Jest (`jest-expo` preset in `expense-expert-rn/package.json`).
- **Component Testing:** `@testing-library/react-native` for simulating form step navigation, input changes, and button presses.
- **Execution Command:** `npm test` or `npm run test` inside `expense-expert-rn/`.

### 2. Unit & Integration Test Matrix

| Component / Unit | Test File | Test Scenarios |
|------------------|-----------|----------------|
| `currency.util` | `__tests__/features/expenses/currency.util.test.ts` | 1. `toCents` parses strings (`"12.34"`, `"0.1"`, `"$1,250.00"`, `"-5.50"`) and numbers accurately.<br>2. `toCents` eliminates floating point rounding (`1.15 * 100` returns `115`, not `114`).<br>3. `fromCents` returns accurate decimals (`1999` -> `19.99`).<br>4. `addCents`, `subtractCents`, `multiplyCents`, `divideCents` perform integer arithmetic.<br>5. `formatCents` formats localized USD strings correctly. |
| `date.util` | `__tests__/features/expenses/date.util.test.ts` | 1. `formatMonth` generates `YYYY-MM` strings correctly across leap years and year boundaries.<br>2. `formatDisplayDate` formats dates into human-readable strings.<br>3. `toDateInputValue` produces `YYYY-MM-DD` for inputs. |
| `offline-queue.service` | `__tests__/features/expenses/offline-queue.service.test.ts` | 1. `enqueue` adds mutation to AsyncStorage queue.<br>2. `getQueue` reads and parses persisted mutations.<br>3. `remove` deletes mutation by ID.<br>4. `markFailed` increments retry count and sets error string.<br>5. `clearQueue` purges storage. |
| `ExpenseService` | `__tests__/features/expenses/expense.service.test.ts` | 1. `addExpense` when online creates Firestore document and returns `syncStatus: 'synced'`.<br>2. `addExpense` when offline enqueues mutation in AsyncStorage and returns `syncStatus: 'pending'`.<br>3. `processSyncQueue` flushes queued mutations in FIFO order to Firestore and removes them from AsyncStorage upon success.<br>4. `processSyncQueue` handles network failures gracefully without losing uncommitted items. |
| `ExpenseForm` | `__tests__/features/expenses/ExpenseForm.test.tsx` | 1. Step 1: Validates amount > 0 and category selected before allowing "Continue".<br>2. Step 2: Allows title entry and suggestion pill click; validates date.<br>3. Step 3: Displays summary card with formatted amount, category, date; submits data.<br>4. Handles edit mode with prefilled values. |

### 3. Verification Scenarios & Manual Checks

- **TXN-01 (Manual Expense Entry):**
  1. Navigate to `/expenses/new`.
  2. Input `$45.50`, select `Food` category, tap Continue.
  3. Select suggestion `Grocery`, verify date defaults to today, tap Continue.
  4. Enter note `Weekly groceries`, review summary card, tap Save Expense.
  5. Verify transaction is recorded with correct category and date.
- **TXN-02 (Precise Currency Math):**
  1. Add an expense with `$1.15`.
  2. Verify stored `amountInCents` is exactly `115`.
  3. Add an expense with `$0.10` and `$0.20`.
  4. Verify sum calculations in tests and totals equal `$0.30` exactly with no `0.30000000000000004` float drift.
- **TXN-03 (Offline Entry & Reconnect Sync):**
  1. Toggle airplane mode / disconnect network on device/browser.
  2. Enter an expense for `$25.00` with category `Transport`.
  3. Verify expense is immediately saved locally with `syncStatus: 'pending'` and offline indicator displayed.
  4. Reconnect network (disable airplane mode).
  5. Verify sync processor triggers automatically, writes document to Firestore, and marks status as `synced`.

<metadata>
## Metadata

**Research scope:**
- Core technology: Financial Math Utilities, React Native Form UX, Cloud Firestore, AsyncStorage Offline Queue, NetInfo Network Detection
- Ecosystem: `@react-native-async-storage/async-storage`, `@react-native-community/netinfo`, `date-fns`, `nativewind`, `@testing-library/react-native`
- Patterns: Safe Integer Cents Math, FIFO Offline Mutation Queue, Multi-Step Form Wizard, Idempotent Firestore Writes
- Pitfalls: IEEE-754 float drift, AsyncStorage Timestamp serialization, duplicate sync submissions, controlled amount input lag

**Confidence breakdown:**
- Standard stack: HIGH - verified compatibility with Expo 52, Firebase 11, and AsyncStorage
- Architecture: HIGH - matches Angular domain models and robust offline-first patterns
- Pitfalls: HIGH - solutions established for all financial rounding and offline queue race conditions
- Code examples: HIGH - TypeScript implementations matching project specifications

**Research date:** 2026-08-23
**Valid until:** 2026-09-23 (30 days)
</metadata>

---

*Phase: 03-core-transaction-entry*
*Research completed: 2026-08-23*
*Ready for planning: yes*
