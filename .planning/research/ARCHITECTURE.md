# Architecture Research

**Domain:** Expense Tracking Mobile and Web Application (React Native + Firebase)
**Researched:** 2026-08-23
**Confidence:** HIGH

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Presentation Layer                        │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐        │
│  │ Dashboard │  │ Expenses │  │ Reports  │  │ Settings │        │
│  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘        │
│       │            │            │            │              │
├───────┴────────────┴────────────┴────────────┴──────────────┤
│                   State Management Layer                     │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐    │
│  │    Server State (React Query) / UI State (Zustand)   │    │
│  └─────────────────────────────────────────────────────┘    │
├─────────────────────────────────────────────────────────────┤
│                     Data Access Layer                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                   │
│  │ Auth Svc │  │  Db Svc  │  │ Func Svc │                   │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘                   │
├───────┴─────────────┴─────────────┴─────────────────────────┤
│                   Backend (Firebase)                         │
└─────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| Presentation Layer | UI rendering, user interactions, and navigation. | React Native components, React Navigation, Expo router. |
| State Management Layer | Managing server state caching, optimistic updates, and global UI state. | TanStack React Query (server), Context API or Zustand (UI). |
| Data Access Layer | Abstracting database queries, authentication logic, and API calls. | Firebase JS SDK wrapped in custom services/hooks. |

## Recommended Project Structure

```
src/
├── app/                  # App initialization, providers, global styles
├── components/           # Reusable cross-feature UI components (Buttons, Inputs)
├── features/             # Feature-based domain modules
│   ├── auth/             # Authentication feature
│   ├── expenses/         # Expense tracking feature
│   │   ├── components/   # Feature-specific UI components
│   │   ├── hooks/        # React Query hooks for fetching/mutating
│   │   ├── services/     # Firebase SDK calls specific to expenses
│   │   └── types/        # TypeScript interfaces
│   └── dashboard/        # Dashboard feature
├── navigation/           # React Navigation configuration and types
├── services/             # Core services (Firebase init, HTTP clients)
├── store/                # Global UI state (if any)
└── utils/                # Helper functions, formatters, constants
```

### Structure Rationale

- **`features/`:** Groups logic by domain (e.g., expenses, auth), promoting scalability and reducing coupling. This perfectly mirrors the existing Angular application's domain-driven modules, ensuring parity.
- **`services/`:** Centralizes third-party (Firebase) integrations so UI components do not depend on Firebase directly, enabling easier testing and isolation.

## Architectural Patterns

### Pattern 1: Feature-Sliced Design (Domain-Driven)

**What:** Structuring the application around business features (domains) rather than technical roles (e.g., grouping all reducers together).
**When to use:** In medium to large applications to maintain strict boundaries. Essential here to match the existing Angular domain structure.
**Trade-offs:** Can lead to deeper folder nesting and requires strict adherence to not cross-import feature internals.

**Example:**
```typescript
// features/expenses/hooks/useExpenses.ts
import { useQuery } from '@tanstack/react-query';
import { ExpenseService } from '../services/expense.service';

export const useExpenses = (userId: string) => {
  return useQuery({
    queryKey: ['expenses', userId],
    queryFn: () => ExpenseService.getExpenses(userId),
  });
};
```

### Pattern 2: Repository / Service Pattern

**What:** Abstracting the database (Firestore) interactions behind service classes or functions.
**When to use:** To decouple UI components from the database querying logic and facilitate unit testing.
**Trade-offs:** Adds a layer of indirection but provides a clear boundary for business logic.

**Example:**
```typescript
// services/expense.service.ts
export const ExpenseService = {
  addExpense: async (expense: Expense) => {
    return await addDoc(collection(db, 'expenses'), expense);
  }
}
```

## Data Flow

### Request Flow

```
[User Action (Add Expense)]
    ↓
[Expense Form Component] → [useMutation Hook] → [ExpenseService.addExpense()]
    ↓                                                    ↓
[UI updates optimistically] ← [React Query Cache] ← [Firestore Add Document]
```

### State Management

```
[Firebase Firestore]
    ↓ (onSnapshot / fetch)
[React Query Cache (Server State)] ←→ [Components]
    ↓
[Zustand/Context (UI State - Theme, Modals)]
```

### Key Data Flows

1. **Real-time Expense Sync:** A Firebase `onSnapshot` listener wrapped in a React Query hook feeds into the application cache. This ensures the dashboard charts and expense lists reflect changes instantly across multiple devices.
2. **Authentication Flow:** User logs in via Firebase Auth. The auth state listener updates the global user context, triggering a navigation state change from the Auth stack to the Main App stack.

## Security Considerations

### Security & Authentication
- **Authentication:** Utilize Firebase Authentication for secure identity management. Enforce session management and secure token storage.
- **Authorization & Data Security:** Implement strict Firestore Security Rules. Ensure users can only read/write documents where `userId == request.auth.uid`.
- **App Check:** Enforce Firebase App Check (using Play Integrity for Android, DeviceCheck for iOS, and reCAPTCHA for Web) to prevent abuse and ensure requests come from the legitimate app.
- **Sensitive Variables:** Store sensitive API keys and configuration in environment variables (`.env`), and never hardcode them in the source.

### API Design Patterns
- **Direct Backend vs Serverless:** Most operations will interact directly with Firestore from the client. However, complex, aggregate, or high-privilege operations (like bulk deletes or admin actions) should be offloaded to Firebase Cloud Functions to act as a secure middle tier.

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0-1k users | Client-side aggregations for reports, direct Firestore reads. |
| 1k-100k users | Move aggregations to Firebase Cloud Functions (e.g., maintain a monthly summary document rather than aggregating raw expenses on the client). |
| 100k+ users | Implement cursor-based pagination, aggressive caching, and optimize Firestore indexes. |

### Scaling Priorities

1. **First bottleneck (Firestore Reads):** Dashboards aggregating thousands of expense documents will cause high read costs and slow performance. Fix by using Cloud Functions to maintain pre-calculated summary documents.
2. **Second bottleneck (App Bundle Size):** As features grow, the React Native app size increases. Fix by code-splitting for the web build and deferring non-essential module imports on mobile.

## Anti-Patterns

### Anti-Pattern 1: Direct Firebase Calls in Components

**What people do:** Calling `addDoc` or `getDocs` directly inside a React component's `useEffect` or `onPress`.
**Why it's wrong:** Tightly couples the UI to the database, makes the component untestable, and scatters business logic.
**Do this instead:** Extract database interactions into a Service layer and consume them via custom hooks.

### Anti-Pattern 2: Over-using Global State for Server Data

**What people do:** Fetching data from Firestore and manually storing it in Redux/Zustand, manually handling loading and error flags.
**Why it's wrong:** Leads to massive boilerplate, stale data, and complex state synchronization bugs.
**Do this instead:** Use a dedicated server-state library like TanStack React Query to handle caching, background fetching, and loading states automatically.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Firebase Auth | SDK integration in Auth Service | Listen to `onAuthStateChanged` at the root of the app. |
| Firestore DB | SDK integration in Data Services | Use offline persistence (enabled by default in Firebase JS SDK for web/mobile). |
| Firebase Storage | SDK integration for file uploads | Handle receipt images; ensure security rules restrict uploads by size and type. |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Expenses ↔ Reports | React Query Cache sharing | The Reports feature depends on expenses data; they can share a common React Query key so data fetched by expenses is instantly available to reports. |

## Sources

- React Native Architecture best practices
- Firebase Official Documentation & Security Rules guide
- TanStack React Query Documentation
- Domain-Driven Design for Frontend Applications

---
*Architecture research for: Expense Tracking Mobile and Web Application (React Native + Firebase)*
*Researched: 2026-08-23*
