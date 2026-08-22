# Phase 1: Foundation & Environment Setup - Research

**Researched:** 2026-08-23
**Domain:** Dockerized React Native & Expo (Web & Mobile) with Firebase Integration
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

No user constraints - all decisions at the agent's discretion.

### Locked Decisions
- Must use React Native for both Web and Mobile (universal architecture).
- Must run the development environment inside an isolated Docker container while remaining testable on the local machine.
- Must use Firebase for backend services (Auth, Firestore) maintaining parity with existing project configuration (`expense-expert-d155a`).
- Must use TypeScript and provide unit testing setup.

### The Agent's Discretion
- Project structure and framework choice (Expo SDK 52 with Expo Router v4 selected for first-class universal web + mobile support).
- Container configuration (Node 20 Debian bookworm base with multi-port forwarding and polling watchers).
- Cross-platform Firebase initialization pattern (`firebase` modular JS SDK with platform-specific persistence).
- Styling framework (NativeWind v4 + Tailwind CSS v3 for parity with Angular Tailwind styles).

### Deferred Ideas (OUT OF SCOPE)
- Migrating away from Firebase — Out of scope.
- Full bank auto-sync / Plaid integration — Out of scope.
- Receipt OCR and multi-currency — Deferred to v2.
</user_constraints>

<architectural_responsibility_map>
## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Containerized Dev Environment | Infrastructure / Docker | Local Host OS | Isolates Node.js runtime, Expo CLI, Metro bundler, and dependencies while bridging network ports (8081) to the host. |
| Universal Application Shell | Frontend Client (Web & Mobile) | Metro Bundler | Expo SDK + Expo Router renders responsive web SPA in browser and native view hierarchy on iOS/Android. |
| Firebase SDK & Configuration | Frontend Client (Data Access Layer) | Firebase Cloud Services | Client SDK manages authentication tokens, local persistence, Firestore connection, and real-time syncing. |
| Unit Testing & Linting | Development / CI | — | Jest and React Native Testing Library run in Docker container or locally to enforce code correctness. |
</architectural_responsibility_map>

<research_summary>
## Summary

Phase 1 establishes the foundational infrastructure for transforming the Angular-based Expense Expert into a universal React Native application for Web, iOS, and Android. The primary goal is delivering an isolated Docker container where the Expo development server, Metro bundler, and testing suite run reliably, with full local host access for web browsers and mobile simulators/devices.

The standard modern approach (2025/2026) uses **Expo SDK 52** (React Native 0.76+ with the New Architecture enabled by default) and **Expo Router v4** for file-based universal routing. For Firebase, the modular Firebase v10/v11 JS SDK is configured with platform-aware authentication persistence (using `@react-native-async-storage/async-storage` for React Native mobile and browser local storage for web). This architecture avoids fragile custom Webpack/Metro splits and ensures 100% code sharing for core business models and data access services.

**Primary recommendation:** Initialize the React Native project using Expo SDK 52 with Expo Router and TypeScript in `expense-expert-rn/`, containerize it via a `node:20-bookworm` Dockerfile and `docker-compose.yml` exposing port 8081 with `0.0.0.0` binding, and initialize a centralized `src/services/firebase.ts` client wrapper leveraging `EXPO_PUBLIC_` environment variables.
</research_summary>

<standard_stack>
## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `expo` | ~52.0.0 | Universal React Native Framework | De facto industry standard for cross-platform React Native. Configures Web, iOS, and Android targets out of the box with zero native build friction during early phases. |
| `react-native` | 0.76.x | Core Mobile Framework | Version 0.76 enables the React Native New Architecture (Fabric renderer and TurboModules) by default with enhanced performance. |
| `react-native-web` | ~0.19.13 | React Native for Web | Compiles React Native primitives (`<View>`, `<Text>`, `<Pressable>`) to high-performance semantic HTML5/CSS elements. |
| `expo-router` | ~4.0.0 | Universal File-Based Routing | Unifies web URLs, browser history, mobile navigation stacks, and deep linking under a single `app/` directory structure. |
| `firebase` | ^10.14.x / ^11.x | Backend SDK (Auth & Firestore) | Modular tree-shakable SDK providing real-time data sync, document storage, and user authentication across Web and Mobile. |
| `@react-native-async-storage/async-storage` | ~1.23.0 | Persistent Storage | Required for persisting Firebase Auth state on native platforms when using the JS SDK. |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `nativewind` | ^4.1.0 | Tailwind CSS for React Native | Bridges Tailwind utility classes to React Native StyleSheet objects. Reuses the mental model and styling of the existing Angular Tailwind app. |
| `tailwindcss` | ^3.4.17 | CSS Engine | NativeWind v4 requires Tailwind v3.x. Used for web compilation and class token generation. |
| `react-native-reanimated` | ~3.16.0 | Declarative Animation Engine | Required dependency for NativeWind v4 and smooth mobile interactions. |
| `react-native-safe-area-context` | ~4.12.0 | Safe Area Handling | Inset management across mobile notches, status bars, and desktop web layouts. |
| `react-native-screens` | ~4.0.0 | Native Screen Optimization | Underpins Expo Router / React Navigation native memory management. |

### Development & Testing
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `typescript` | ^5.7.0 | Static Typing | Strict type checking across feature models, API schemas, and UI props. |
| `jest` | ^29.7.0 | Test Runner | Unit testing of business logic, math utilities, and data services. |
| `jest-expo` | ~52.0.0 | Jest Universal Preset | Mocks Expo native modules across web, iOS, and Android test environments. |
| `@testing-library/react-native` | ^13.0.0 | Component Testing | Behavior-driven component testing matching user interactions. |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `expo` (SDK 52) | Bare React Native CLI | Bare CLI requires full native Xcode and Android Studio compilation chains, making isolated Dockerization significantly heavier (5GB+ images) and Web support difficult to maintain. Expo provides superior universal web support. |
| `expo-router` | Pure `react-navigation` | Standard `react-navigation` requires manual dual routing configurations for browser URLs vs native stacks. `expo-router` automates deep linking and web routing. |
| `firebase` JS SDK | `@react-native-firebase` | `@react-native-firebase` requires native compilation (EAS / Prebuild) and has no web support. The standard `firebase` JS SDK with `getReactNativePersistence` provides a unified cross-platform API across web and Expo Go / dev clients. |

**Installation Commands:**
```bash
# Initialize Expo app
npx create-expo-app@latest expense-expert-rn --template blank-typescript

# Install Web support and Expo Router dependencies
cd expense-expert-rn
npx expo install expo-router react-native-safe-area-context react-native-screens expo-linking expo-constants expo-status-bar react-dom react-native-web @expo/metro-runtime

# Install Firebase and persistence
npx expo install firebase @react-native-async-storage/async-storage

# Install NativeWind v4 and Tailwind
npm install nativewind tailwindcss react-native-reanimated
npx expo install react-native-reanimated

# Install Dev and Testing tools
npm install -D jest jest-expo @testing-library/react-native @testing-library/react-hooks @types/jest ts-node
```
</standard_stack>

<architecture_patterns>
## Architecture Patterns

### System Architecture Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│                          Local Host Machine                            │
│  ┌─────────────────────────┐          ┌─────────────────────────────┐  │
│  │   Web Browser (Client)  │          │   Mobile Device / Simulator │  │
│  │   http://localhost:8081 │          │   Expo Go / Dev Client      │  │
│  └────────────▲────────────┘          └──────────────▲──────────────┘  │
└───────────────┼──────────────────────────────────────┼─────────────────┘
                │ Port 8081 (HTTP / WebSocket)         │ Port 8081 (Metro / LAN)
┌───────────────▼──────────────────────────────────────▼─────────────────┐
│                      Docker Container (Node 20)                        │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │             Metro Bundler / Expo Dev Server (0.0.0.0:8081)        │  │
│  │  - Universal bundling (Web JS bundle / Native Hermes bytecode)   │  │
│  │  - Fast Refresh & Hot Reloading over WebSockets                  │  │
│  │  - Environment Injection (EXPO_PUBLIC_*)                         │  │
│  └──────────────────────────────────┬───────────────────────────────┘  │
│                                     │                                  │
│  ┌──────────────────────────────────▼───────────────────────────────┐  │
│  │                   React Native Application Shell                 │  │
│  │  ┌─────────────────┐ ┌──────────────────┐ ┌───────────────────┐  │  │
│  │  │   Expo Router   │ │  Platform Layout │ │  NativeWind Style │  │  │
│  │  │   (app/ routes) │ │  (Web / Native)  │ │  (Tailwind v3)    │  │  │
│  │  └────────┬────────┘ └────────┬─────────┘ └─────────┬─────────┘  │  │
│  │           └───────────────────┼─────────────────────┘            │  │
│  │                               ▼                                  │  │
│  │               Firebase Client Service Layer                      │  │
│  │          (src/services/firebase.ts & auth / firestore)            │  │
│  └───────────────────────────────┬──────────────────────────────────┘  │
└──────────────────────────────────┼─────────────────────────────────────┘
                                   │ HTTPS / WSS API calls
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                      Firebase Cloud Infrastructure                     │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  Project: expense-expert-d155a                                   │  │
│  │  - Firebase Authentication (Email/Password, Google OAuth)        │  │
│  │  - Cloud Firestore (Users, Expenses, Categories, Budgets)        │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

### Recommended Project Structure

```
expense-expert-rn/
├── .dockerignore
├── Dockerfile                  # Container definition with Node 20
├── docker-compose.yml          # Container orchestration & port mappings
├── app.json                    # Expo configuration & scheme
├── metro.config.js             # Metro config with NativeWind wrapper
├── tailwind.config.js          # Tailwind CSS configuration
├── tsconfig.json               # TypeScript configuration extending expo/tsconfig.base
├── package.json                # Project dependencies and scripts
├── .env                        # Local environment variables (EXPO_PUBLIC_*)
├── .env.example                # Template for environment variables
├── app/                        # Expo Router Universal Routes
│   ├── _layout.tsx             # Root layout with Providers & SafeAreaProvider
│   ├── index.tsx               # Entry redirect / Landing screen
│   ├── +not-found.tsx          # 404 handler
│   ├── (auth)/                 # Auth route group (Login, Register)
│   │   ├── _layout.tsx
│   │   ├── login.tsx
│   │   └── register.tsx
│   └── (app)/                  # Authenticated app route group
│       ├── _layout.tsx         # Responsive tabs / drawer navigation
│       ├── dashboard.tsx
│       ├── expenses.tsx
│       ├── categories.tsx
│       └── profile.tsx
├── src/                        # Core Application Code
│   ├── config/
│   │   └── firebase.ts         # Universal Firebase initialization & exports
│   ├── services/               # Data access abstraction
│   │   ├── auth.service.ts
│   │   └── firestore.service.ts
│   ├── types/                  # TypeScript interfaces matching Angular schemas
│   │   ├── user.model.ts
│   │   ├── expense.model.ts
│   │   └── category.model.ts
│   ├── components/             # Reusable UI components
│   │   ├── ui/                 # Atoms (Button, Input, Card, Modal)
│   │   └── layout/             # Responsive container, Sidebar, Header
│   └── utils/                  # Shared formatting & math utilities
│       └── currency.ts
└── __tests__/                  # Unit and integration test suites
    └── services/
        └── firebase.test.ts
```

### Pattern 1: Universal Firebase Client Initialization

**What:** Initialize Firebase SDK with platform-aware authentication persistence. On native mobile platforms, pass `getReactNativePersistence(AsyncStorage)` to `initializeAuth()`; on Web, fallback to standard browser persistence.
**When to use:** In any universal Expo application to prevent session loss on mobile restarts and ensure browser refresh preservation on Web.
**Example:**
```typescript
// src/config/firebase.ts
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  initializeAuth,
  getReactNativePersistence,
  browserLocalPersistence,
  getAuth,
  Auth,
} from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Singleton Firebase App instance
const app: FirebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Platform-aware Auth persistence initialization
let auth: Auth;
if (Platform.OS === 'web') {
  auth = getAuth(app);
} else {
  try {
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch (_e) {
    // Fallback if already initialized (e.g. during fast refresh)
    auth = getAuth(app);
  }
}

const db: Firestore = getFirestore(app);

export { app, auth, db };
```

### Pattern 2: Docker Environment Configuration for Metro Bundler

**What:** Containerized Node.js environment configured with host binding, polling file watchers, and port forwarding for seamless local browser and emulator access.
**When to use:** For developing React Native apps inside Docker.
**Example:**
```dockerfile
# Dockerfile
FROM node:20-bookworm-slim

WORKDIR /app

# Install basic OS utilities
RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Copy dependency manifests
COPY package.json package-lock.json ./

# Install project dependencies
RUN npm ci

# Copy application source
COPY . .

# Expose Metro bundler and web server port
EXPOSE 8081 19000 19001 19002

# Environment defaults for containerized Metro
ENV CI=1 \
    EXPO_DEVTOOLS_LISTEN_ADDRESS=0.0.0.0 \
    REACT_NATIVE_PACKAGER_HOSTNAME=localhost \
    CHOKIDAR_USEPOLLING=true \
    WATCHPACK_POLLING=true

CMD ["npx", "expo", "start", "--host", "lan"]
```

```yaml
# docker-compose.yml
services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: expense_expert_rn
    ports:
      - "8081:8081"
      - "19000:19000"
      - "19001:19001"
      - "19002:19002"
    volumes:
      - .:/app
      - /app/node_modules
    environment:
      - NODE_ENV=development
      - EXPO_DEVTOOLS_LISTEN_ADDRESS=0.0.0.0
      - REACT_NATIVE_PACKAGER_HOSTNAME=localhost
      - CHOKIDAR_USEPOLLING=true
      - WATCHPACK_POLLING=true
    stdin_open: true
    tty: true
```

### Anti-Patterns to Avoid
- **Hardcoding Localhost IP in Mobile Bundles:** Binding Metro only to `127.0.0.1` inside Docker prevents physical devices and emulators on the host machine from loading bundles. Always specify `0.0.0.0` inside Docker and configure `REACT_NATIVE_PACKAGER_HOSTNAME` with host LAN IP or `localhost`.
- **Mounting Host `node_modules` Over Container `node_modules`:** Direct host volume binding without a named or anonymous container volume for `/app/node_modules` causes architecture/binary mismatches (e.g. host binaries vs Linux container binaries).
- **Direct Webpack Customization for React Native Web:** Avoid manually configuring standalone Webpack/Babel pipelines for React Native Web. Expo CLI and Metro handle Web compilation natively with full Fast Refresh and tree-shaking.
</architecture_patterns>

<dont_hand_roll>
## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Cross-Platform Routing | Custom URL parsers + state machine | `expo-router` | Handles HTML5 history, deep linking, native navigation stacks, modals, and screen lifecycle automatically. |
| Auth State Persistence | Custom LocalStorage / AsyncStorage token sync | `getReactNativePersistence` with Firebase Auth | Managing token refresh cycles, encryption, and race conditions manually leads to security flaws and session dropouts. |
| Responsive Layout Primitives | Custom window resize listeners in every component | `react-native-safe-area-context` + NativeWind responsive variants (`md:`, `lg:`) | Window listeners cause unnecessary re-renders; NativeWind translates breakpoints cleanly at build/render time. |
| Styling Abstraction | Handcrafted dual CSS / StyleSheet bridge | `nativewind` (v4) | Eliminates duplicating style definitions between web stylesheets and React Native `StyleSheet.create`. |

**Key insight:** React Native's universal web/mobile ecosystem is mature in 2026. Hand-rolling routing, auth persistence, or style bridges creates maintenance liabilities and breaks hot reloading.
</dont_hand_roll>

<common_pitfalls>
## Common Pitfalls

### Pitfall 1: Metro Bundler Connection Refusal in Docker
**What goes wrong:** Local browser or mobile emulator cannot connect to `http://localhost:8081`, resulting in "Could not connect to development server" errors.
**Why it happens:** Metro inside Docker defaults to listening on `127.0.0.1` (container loopback), which rejects connections forwarded from the host network.
**How to avoid:** Set `EXPO_DEVTOOLS_LISTEN_ADDRESS=0.0.0.0` and start Expo with `--host lan` or ensure the Docker entrypoint binds to all interfaces.
**Warning signs:** Container logs indicate server is running, but `curl http://localhost:8081` from the host fails or hangs.

### Pitfall 2: AsyncStorage Initialization Race with Firebase Auth
**What goes wrong:** On mobile, calling `getAuth()` before `initializeAuth()` or calling `initializeAuth()` multiple times during Fast Refresh throws `FirebaseError: Firebase: Auth instance already initialized`.
**Why it happens:** Metro hot module replacement re-executes module scripts while the in-memory Firebase app instance persists.
**How to avoid:** Wrap `initializeAuth` with an existing instance check (`getApps().length` and a try/catch fallback to `getAuth(app)`).
**Warning signs:** Fast refresh causes the app screen to turn red with "Auth instance already initialized".

### Pitfall 3: Inotify File Watcher Limits Inside Docker
**What goes wrong:** Editing code on the host machine does not trigger hot-reloading inside the Docker container.
**Why it happens:** Linux file system events (inotify) do not reliably propagate across Docker volume mounts from non-Linux hosts or across certain file systems.
**How to avoid:** Enable polling in file watchers by exporting `CHOKIDAR_USEPOLLING=true` and `WATCHPACK_POLLING=true`.
**Warning signs:** Code changes in VS Code require manual server restarts in Docker.

### Pitfall 4: Missing `EXPO_PUBLIC_` Prefix for Client Env Variables
**What goes wrong:** Firebase config values resolve to `undefined` at runtime in the React Native application.
**Why it happens:** Expo CLI only embeds environment variables into client bundles if they are prefixed with `EXPO_PUBLIC_` (e.g. `EXPO_PUBLIC_FIREBASE_API_KEY`).
**How to avoid:** Define all public client Firebase environment variables using the `EXPO_PUBLIC_` prefix in `.env` and `.env.example`.
**Warning signs:** `firebase.ts` logs `undefined` for `apiKey` and Firebase initialization fails with invalid configuration errors.
</common_pitfalls>

<code_examples>
## Code Examples

### 1. Metro Configuration with NativeWind (`metro.config.js`)
```javascript
// Source: Expo & NativeWind Official Docs
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

module.exports = withNativeWind(config, { input: './global.css' });
```

### 2. Root Application Layout (`app/_layout.tsx`)
```typescript
// Source: Expo Router Official Documentation
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import '../global.css';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(app)" />
      </Stack>
    </SafeAreaProvider>
  );
}
```

### 3. Tailwind Configuration (`tailwind.config.js`)
```javascript
// Source: NativeWind v4 Setup
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eef2ff',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
        },
      },
    },
  },
  plugins: [],
};
```

### 4. Firebase Configuration Unit Test (`__tests__/services/firebase.test.ts`)
```typescript
import { app, auth, db } from '../../src/config/firebase';

describe('Firebase Service Initialization', () => {
  it('initializes Firebase app with project credentials', () => {
    expect(app).toBeDefined();
    expect(app.options.projectId).toBe('expense-expert-d155a');
  });

  it('initializes Auth service instance', () => {
    expect(auth).toBeDefined();
    expect(typeof auth.onAuthStateChanged).toBe('function');
  });

  it('initializes Firestore database instance', () => {
    expect(db).toBeDefined();
    expect(db.type).toBe('firestore');
  });
});
```
</code_examples>

<sota_updates>
## State of the Art (2024-2026)

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Webpack + `react-app-rewired` for RN Web | Metro Web Bundling (`expo export --platform web`) | Expo SDK 50+ | Native Metro bundler compiles both Web and Mobile bundles with unified config, faster builds, and uniform tree-shaking. |
| React Navigation manual URL linking | Expo Router (v3/v4 file-based) | 2023-2025 | Standardized web routes matching Next.js paradigms (`app/` folder), auto-generating deep links and universal layouts. |
| NativeWind v2 Babel plugin | NativeWind v4 with Tailwind Preset & Metro plugin | 2024 | Seamless TypeScript integration, CSS variables support, faster compiler performance, and full web parity. |
| `react-native-dotenv` / `babel-plugin-inline-dotenv` | Native `EXPO_PUBLIC_` environment variables | Expo SDK 49+ | No Babel cache clearing bugs; public variables are automatically embedded into the bundle at build time. |

**Deprecated/outdated:**
- `expo-cli` global npm package: Deprecated in favor of local `npx expo`.
- Manual `@expo/webpack-config`: Deprecated; Metro is now the sole universal bundler for Expo Web and Mobile.
</sota_updates>

<open_questions>
## Open Questions

1. **Physical Device Debugging over Docker Bridge**
   - What we know: On Linux host, Docker can use `--net=host` or forwarded ports for Metro. On macOS/Windows host, LAN IP bridging via `REACT_NATIVE_PACKAGER_HOSTNAME` is required for physical Expo Go app on the same Wi-Fi network.
   - Recommendation: Configure `docker-compose.yml` with port 8081 forwarded and set `REACT_NATIVE_PACKAGER_HOSTNAME` dynamically or default to `localhost` for local web browser testing and simulator access.

2. **Tailwind Version Compatibility with NativeWind v4**
   - What we know: NativeWind v4 strictly supports Tailwind CSS v3.4.x. Tailwind CSS v4 introduced breaking engine changes not yet universally adopted across React Native transformers.
   - Recommendation: Lock `tailwindcss` dependency to `^3.4.17` in `package.json`.
</open_questions>

## Validation Architecture

### Automated Verification Strategies

To ensure Phase 1 fulfills all success criteria autonomously and reliably, the following validation gates must be executed:

1. **Docker Container Build & Health Validation:**
   - Execute `docker compose build` to verify the Dockerfile compiles the Node 20 environment and installs all npm dependencies without errors.
   - Execute `docker compose up -d` and inspect `docker compose ps` to verify the container is running and healthy.

2. **Web Build & Export Validation:**
   - Run `npx expo export --platform web` (or `npm run build:web`) inside the environment to ensure all universal components, Expo Router layouts, and NativeWind styles compile into a valid production web bundle without React Native Web syntax errors.

3. **Firebase Initialization & Unit Testing Gate:**
   - Run `npm test` using Jest and `jest-expo` to execute the Firebase test suite (`__tests__/services/firebase.test.ts`).
   - Asserts that:
     - `app.options.projectId` matches `expense-expert-d155a`.
     - `auth` instance is initialized with `onAuthStateChanged` handler.
     - `db` Firestore instance is initialized and connected.

4. **Linting & Type Safety Validation:**
   - Run `npx tsc --noEmit` to verify 100% clean TypeScript typing with zero unresolved imports or type mismatch errors across `app/` and `src/`.

<sources>
## Sources

### Primary (HIGH confidence)
- Expo SDK 52 Documentation — Universal Metro web bundling, Expo Router v4 setup, environment variables (`EXPO_PUBLIC_`).
- Firebase JS SDK Documentation — Modular Web & React Native initialization, `initializeAuth`, `getReactNativePersistence`.
- React Native Documentation (0.76) — New Architecture defaults, Metro bundler configuration.
- NativeWind v4 Documentation — Tailwind CSS v3 integration with Expo Metro.

### Secondary (MEDIUM confidence)
- Existing Angular application (`expense-expert/`) configuration — Verified Firebase project credentials, project ID (`expense-expert-d155a`), and data models.
</sources>

<metadata>
## Metadata

**Research scope:**
- Core technology: Expo SDK 52, React Native 0.76, Expo Router v4, Firebase v10/v11 JS SDK.
- Ecosystem: Docker (Node 20), NativeWind v4, Tailwind CSS v3, Jest, Jest-Expo.
- Patterns: Universal Web/Mobile project architecture, platform-aware Firebase persistence, containerized Metro bundling.
- Pitfalls: Docker port binding (`0.0.0.0`), Fast Refresh auth reinitialization, inotify file watching.

**Confidence breakdown:**
- Standard stack: HIGH — Expo SDK 52 is the verified standard for universal React Native in 2025/2026.
- Architecture: HIGH — Follows official Expo Router and Firebase modular patterns.
- Pitfalls: HIGH — Docker and Firebase React Native integration edge cases well understood and documented.
- Validation Architecture: HIGH — Concrete automated CLI verification scripts defined.

**Research date:** 2026-08-23
**Valid until:** 2026-09-23 (30 days)
</metadata>

---

*Phase: 01-foundation-environment-setup*
*Research completed: 2026-08-23*
*Ready for planning: yes*
