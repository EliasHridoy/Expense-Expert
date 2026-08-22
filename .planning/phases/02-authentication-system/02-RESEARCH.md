# Phase 2: Authentication System - Research

**Researched:** 2026-08-23
**Domain:** Firebase Authentication & Session Persistence for Universal React Native (Web & Mobile)
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

No user constraints - all decisions at the agent's discretion.

### Locked Decisions
- **Cross-Platform Parity:** User can securely log in, register, and manage sessions across both Web and Mobile (AUTH-01).
- **Session Persistence:** User session must securely persist across app restarts (mobile AsyncStorage) and browser refreshes (web localStorage/IndexedDB) (AUTH-02).
- **Backend Infrastructure:** Must continue using Firebase Auth and Cloud Firestore (`expense-expert-d155a`) with exact logic parity to the Angular application.
- **Logic & Schema Parity:** On registration or first login, a Firestore user document in `users/{uid}` with `{ email, displayName, createdAt, updatedAt }` must be synchronized matching the Angular implementation.
- **Testing & Quality:** Must include automated unit tests using Jest and `@testing-library/react-native` for all auth contexts, hooks, services, and UI components.

### The Agent's Discretion
- **Routing & Navigation Architecture:** Use Expo Router v4 group-based routing `app/(auth)/` and `app/(app)/` with root layout authentication gates (`useProtectedRoute` / layout redirect).
- **State Management:** React Context (`AuthContext` / `AuthProvider`) with custom hook `useAuth()` exposing `{ user, profile, isAuthenticated, isLoading, login, register, logout, signInWithGoogle }`.
- **Form Handling & Validation:** Form validation mirroring Angular rules (email syntax, password minimum length 6, password confirmation match).
- **Styling & UX:** NativeWind v4 / Tailwind CSS responsive card layout matching Angular design (centered responsive card, brand logo "EE", dark/light mode compatibility, `KeyboardAvoidingView` + `ScrollView` on mobile).

### Deferred Ideas (OUT OF SCOPE)
- Migrating away from Firebase — Out of scope.
- Biometric authentication (FaceID/Fingerprint) — Deferred to v2.
- Multi-factor authentication (SMS/TOTP MFA) — Deferred to v2.
- Social OAuth for Facebook / Apple native credentials — Email/Password is primary; Google Web Popup supported on web.
</user_constraints>

<architectural_responsibility_map>
## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Authentication State & Context | Frontend Client (React Context / State) | Firebase Auth SDK | Manages active user session token in React memory, provides `useAuth()` hook to UI components. |
| Session Persistence (Mobile) | Frontend Client (AsyncStorage) | Native OS Storage / SQLite | `getReactNativePersistence(AsyncStorage)` caches auth credentials securely on device disk across app restarts. |
| Session Persistence (Web) | Browser Storage (IndexedDB / LocalStorage) | Firebase Web SDK | Firebase JS SDK persists tokens in browser IndexedDB/LocalStorage across page reloads. |
| Route Protection & Navigation Gates | Presentation Layer (Expo Router v4) | Frontend Auth State | Intercepts navigation transitions; redirects unauthenticated users to `/login` and authenticated users to `/dashboard`. |
| User Profile Sync (`users/{uid}`) | Data Access Layer (`AuthService`) | Cloud Firestore (`users` collection) | Ensures user metadata (`email`, `displayName`, `createdAt`, `updatedAt`) exists in Firestore upon sign up / sign in. |
| Login & Registration UI | Presentation Layer (NativeWind + RN Components) | Mobile Viewport / Browser DOM | Renders responsive forms with input validation, loading spinners, and error feedback across mobile and desktop viewports. |
</architectural_responsibility_map>

<research_summary>
## Summary

Phase 2 implements end-to-end user authentication and session management for Expense Expert across Web, iOS, and Android. The primary goal is delivering a rock-solid, cross-platform authentication workflow that preserves exact logic parity with the existing Angular 18 application while taking advantage of modern React Native and Expo Router v4 paradigms.

The recommended architectural approach utilizes Firebase Auth modular SDK configured with platform-aware persistence (AsyncStorage on native mobile, IndexedDB/LocalStorage on web). A centralized `AuthContext` and `AuthProvider` tracks auth state changes via `onAuthStateChanged`, exposing reactive `user`, `isLoading`, and `isAuthenticated` states alongside core action methods (`login`, `register`, `logout`, `signInWithGoogle`). Route protection is handled declaratively in Expo Router using group-based layouts `(auth)` and `(app)` with an auth guard hook that eliminates visual flashing during initial hydration.

The UI layer matches the Angular application's Tailwind CSS design system using NativeWind v4. Components include responsive email/password forms, validation logic (e.g. password match, min length 6), error code translation (e.g. `auth/invalid-credential`, `auth/email-already-in-use`), brand identity badges ("EE"), and mobile-safe keyboard avoidance.

**Primary recommendation:** Build a dedicated `src/features/auth/` domain module consisting of `AuthService` (Firebase Auth + Firestore user document sync), `AuthContext` / `useAuth` hook, responsive `LoginForm` / `RegisterForm` components, and route them via `app/(auth)/login.tsx`, `app/(auth)/register.tsx`, and `app/(app)/_layout.tsx` protected layout gates.
</research_summary>

<standard_stack>
## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `firebase` (Auth & Firestore) | ^11.0.0 | Authentication & Database | Modular tree-shakable SDK providing `signInWithEmailAndPassword`, `createUserWithEmailAndPassword`, `signOut`, `updateProfile`, and Firestore `doc`/`setDoc`. |
| `@react-native-async-storage/async-storage` | 1.23.1 | Mobile Auth Token Storage | Official React Native community storage module required by `getReactNativePersistence(AsyncStorage)` for native session persistence. |
| `expo-router` | ~4.0.0 | Universal File-Based Routing | Enables group layouts `(auth)` and `(app)` with automatic deep linking, URL synchronization on web, and native stack transitions. |
| `react-native-safe-area-context` | 4.12.0 | Layout Inset Protection | Manages safe areas, notches, and status bars across iOS, Android, and web. |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `nativewind` | ^4.1.23 | Tailwind CSS for React Native | Rapid styling of login cards, inputs, buttons, and responsive breakpoints (`md:w-96`, `max-w-md`). |
| `tailwindcss` | ^3.4.17 | CSS Engine | Compiles utility classes for React Native and Web builds. |
| `react-native-screens` | ~4.4.0 | Native Screen Optimization | Underpins Expo Router screen transitions and memory disposal. |

### Development & Testing
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `jest` | ^29.7.0 | Test Runner | Executes unit and integration test suites. |
| `jest-expo` | ~52.0.0 | Expo Test Preset | Provides standard mocks for React Native and Expo runtime environments. |
| `@testing-library/react-native` | ^13.0.0 | Component Testing | Tests login and register forms, user interactions, validation messages, and loading states. |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `AuthContext` + `AuthProvider` | Zustand / Redux | Redux is excessive boilerplate for authentication state. React Context is built-in, lightweight, and cleanly integrates with React component lifecycle and `onAuthStateChanged`. |
| Expo Router Group Gates `(auth)` / `(app)` | Manual `router.push` in components | Manual navigation leads to race conditions, missed edge cases on browser refresh, and deep link security vulnerabilities. Group layout gates enforce route security globally. |
| Modular Firebase JS SDK | `@react-native-firebase/auth` | `@react-native-firebase` does not work on Web. The modular JS SDK with `getReactNativePersistence` provides a unified universal codebase for both Web and Mobile. |

**Installation:**
All core libraries (`firebase`, `@react-native-async-storage/async-storage`, `expo-router`, `nativewind`, `@testing-library/react-native`) are already configured in `expense-expert-rn/package.json`. No additional external npm packages are required for Phase 2.
</standard_stack>

<architecture_patterns>
## Architecture Patterns

### System Architecture Diagram

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                               Presentation Layer (UI)                                  │
│                                                                                        │
│   app/(auth)/login.tsx    app/(auth)/register.tsx    app/(app)/dashboard.tsx          │
│            │                        │                          ▲                       │
│            ▼                        ▼                          │                       │
│     [ LoginForm ]            [ RegisterForm ]           [ Protected Layout ]           │
└────────────┬────────────────────────┬──────────────────────────┼───────────────────────┘
             │                        │                          │
             ▼                        ▼                          │
┌────────────────────────────────────────────────────────────────┴───────────────────────┐
│                        Authentication Context & Hook Layer                             │
│                                                                                        │
│                                    useAuth()                                           │
│                                        ▲                                               │
│                                        │                                               │
│                            [ AuthProvider (Context) ]                                  │
│                                        ▲                                               │
│                   onAuthStateChanged() │                                               │
└────────────────────────────────────────┼───────────────────────────────────────────────┘
                                         │
┌────────────────────────────────────────┴───────────────────────────────────────────────┐
│                             Data Access Layer (Services)                              │
│                                                                                        │
│                                   AuthService                                          │
│         ┌──────────────────────────────┴──────────────────────────────┐                │
│         ▼                                                             ▼                │
│   [ Firebase Auth ]                                         [ Firestore DB ]           │
│   - signInWithEmailAndPassword                              - doc(db, 'users', uid)    │
│   - createUserWithEmailAndPassword                          - getDoc / setDoc          │
│   - signOut                                                 - ensureUserDocument()     │
│   - updateProfile                                                                      │
└─────────┬─────────────────────────────────────────────────────────────┬────────────────┘
          │                                                             │
          ▼                                                             ▼
┌──────────────────────────────────────┐              ┌──────────────────────────────────┐
│   Session Storage Tier               │              │   Cloud Backend                  │
│   - Mobile: AsyncStorage             │              │   - Firebase Auth Service        │
│   - Web: IndexedDB / LocalStorage    │              │   - Cloud Firestore Collection   │
└──────────────────────────────────────┘              └──────────────────────────────────┘
```

### Recommended Project Structure

```
expense-expert-rn/
├── app/
│   ├── (auth)/                   # Unauthenticated route group
│   │   ├── _layout.tsx           # Auth group layout (redirects if already logged in)
│   │   ├── login.tsx             # Login screen route
│   │   └── register.tsx          # Registration screen route
│   ├── (app)/                    # Authenticated route group
│   │   ├── _layout.tsx           # Protected layout gate (redirects to /login if unauthenticated)
│   │   └── index.tsx             # Main dashboard placeholder / entry
│   ├── _layout.tsx               # Root layout: mounts AuthProvider, StatusBar, SafeAreaProvider
│   ├── index.tsx                 # Root router gate: redirects to (app) or (auth)/login
│   └── +not-found.tsx            # 404 handler
├── src/
│   ├── config/
│   │   └── firebase.ts           # Initialized Firebase app, auth with persistence, db
│   ├── features/
│   │   └── auth/
│   │       ├── components/
│   │       │   ├── AuthLayout.tsx      # Centered card layout, logo badge, gradient backdrop
│   │       │   ├── LoginForm.tsx       # Email/password form with loading & error feedback
│   │       │   ├── RegisterForm.tsx    # Display name, email, password, confirm password form
│   │       │   └── SocialAuthButton.tsx# Google OAuth button
│   │       ├── context/
│   │       │   ├── AuthContext.tsx     # React Context definition & types
│   │       │   └── AuthProvider.tsx    # AuthProvider listening to onAuthStateChanged
│   │       ├── hooks/
│   │       │   └── useAuth.ts          # Custom hook to consume AuthContext
│   │       ├── services/
│   │       │   └── auth.service.ts     # Firebase Auth API calls + Firestore user profile sync
│   │       ├── types/
│   │       │   └── auth.types.ts       # User, AuthState, LoginCredentials, RegisterCredentials
│   │       └── utils/
│   │           └── auth-errors.ts      # Firebase error code to user-friendly message mapping
│   ├── components/
│   │   └── ui/                   # Reusable UI primitives (Button, Input, LoadingSpinner)
│   └── types/                    # Global shared TypeScript interfaces
└── __tests__/
    └── features/
        └── auth/
            ├── auth.service.test.ts    # Service unit tests
            ├── AuthProvider.test.tsx   # AuthContext & Provider lifecycle tests
            ├── LoginForm.test.tsx      # Login form UI interaction tests
            └── RegisterForm.test.tsx   # Register form validation tests
```

### Pattern 1: Platform-Aware Firebase Auth Initialization & Persistence

**What:** Initialize Firebase Auth with `getReactNativePersistence(AsyncStorage)` on native platforms and default `browserLocalPersistence` on web.
**When to use:** In `src/config/firebase.ts` at application bootstrap.
**Implementation Example:**

```typescript
// src/config/firebase.ts
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  initializeAuth,
  getReactNativePersistence,
  getAuth,
  Auth,
} from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

export const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || 'YOUR_API_KEY',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || 'expense-expert-d155a.firebaseapp.com',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'expense-expert-d155a',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || 'expense-expert-d155a.firebasestorage.app',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '324719342364',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '1:324719342364:web:ebc95f68dc800dede140d9',
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID || 'G-7FG0N551WW',
};

export const app: FirebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

let authInstance: Auth;
if (Platform.OS === 'web') {
  authInstance = getAuth(app);
} else {
  try {
    authInstance = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch (_error) {
    authInstance = getAuth(app);
  }
}

export const auth: Auth = authInstance;
export const db: Firestore = getFirestore(app);
```

### Pattern 2: AuthContext, AuthProvider, and useAuth Hook

**What:** Encapsulate Firebase auth listener, current user state, profile sync, and action methods in a unified React Context.
**When to use:** Root level provider wrapping the entire app.
**Implementation Example:**

```typescript
// src/features/auth/context/AuthProvider.tsx
import React, { createContext, useEffect, useState, useMemo } from 'react';
import { User } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../../config/firebase';
import { AuthService } from '../services/auth.service';
import { AuthContextValue, UserProfile } from '../types/auth.types';

export const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          const userDoc = await AuthService.ensureUserDocument(firebaseUser);
          setProfile(userDoc);
        } catch (err) {
          console.error('Error ensuring user document:', err);
        }
      } else {
        setProfile(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    profile,
    isAuthenticated: !!user,
    isLoading,
    login: AuthService.login,
    register: AuthService.register,
    logout: AuthService.logout,
    signInWithGoogle: AuthService.signInWithGoogle,
  }), [user, profile, isLoading]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
```

### Pattern 3: Declarative Expo Router Route Protection

**What:** Use layout-level navigation gates that listen to `useAuth()` to smoothly navigate between unauthenticated routes `(auth)` and authenticated routes `(app)` without flashes.
**When to use:** In `app/_layout.tsx` or group layouts `app/(auth)/_layout.tsx` and `app/(app)/_layout.tsx`.
**Implementation Example:**

```typescript
// app/_layout.tsx
import '../global.css';
import React, { useEffect } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';
import { AuthProvider } from '../src/features/auth/context/AuthProvider';
import { useAuth } from '../src/features/auth/hooks/useAuth';

function NavigationGate() {
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!user && !inAuthGroup) {
      // Redirect to login if user is not authenticated and not in auth screens
      router.replace('/(auth)/login');
    } else if (user && inAuthGroup) {
      // Redirect to app if user is already authenticated and visits auth screens
      router.replace('/(app)');
    }
  }, [user, isLoading, segments]);

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-slate-50 dark:bg-slate-900">
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  return <Slot />;
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="auto" />
      <AuthProvider>
        <NavigationGate />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
```

### Anti-Patterns to Avoid

- **Direct Firebase Auth Calls in UI Components:** Invoking `signInWithEmailAndPassword` directly in JSX buttons without going through `AuthService` / `useAuth` scatters error handling and prevents uniform test mocking.
- **Navigating Before Auth State Settles:** Executing `router.replace('/(app)')` imperatively inside the login button handler instead of waiting for `onAuthStateChanged` to resolve causes stale state navigation bugs.
- **Ignoring Firestore User Document Synchronization:** Skipping `ensureUserDocument(user)` on login creates missing user records in Firestore, breaking downstream expense query filters (`where('userId', '==', user.uid)`).
- **Hardcoding Firebase Error Strings in Components:** Directly displaying `error.message` from Firebase leaks raw internal strings (e.g. `Firebase: Error (auth/invalid-credential).`). Map codes to human-readable text via `getAuthErrorMessage(code)`.
</architecture_patterns>

<dont_hand_roll>
## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Authentication Token Refresh & Session Storage | Custom JWT refresh timers & AsyncStorage token caches | Firebase Auth SDK (`onAuthStateChanged` + persistence) | Firebase automatically manages token refresh, expiry, multi-tab broadcast, and secure storage. Custom token logic causes auth desync and security flaws. |
| Cross-Platform Secure Session Persistence | Custom file-based token writers or cookies | `getReactNativePersistence(AsyncStorage)` (Mobile) + standard Web SDK persistence | Handles platform serialization, race conditions during app reboots, and storage migration across OS updates. |
| Deep Linking & Protected Route Navigation | Custom URL parsers & manual React state navigators | Expo Router v4 file-based routing with group gates `(auth)` / `(app)` | Expo Router handles browser URL history, back buttons, mobile deep links, and screen unmounting natively. |
| Keyboard Avoidance & View Resizing | Custom keyboard event listeners (`Keyboard.addListener`) adjusting padding | `KeyboardAvoidingView` with `Platform.select({ ios: 'padding', default: undefined })` wrapped in `ScrollView` | Custom listeners cause screen jitter, incorrect scroll offsets, and broken web layouts. |

**Key insight:** Firebase Auth and Expo Router provide battle-tested implementations for session lifecycle, token rotation, and navigation gating. Hand-rolling token management or routing guards introduces security vulnerabilities and cross-platform edge-case regressions.
</dont_hand_roll>

<common_pitfalls>
## Common Pitfalls

### Pitfall 1: Session Hydration Race & Unauthenticated Route Flashing
**What goes wrong:** When the user refreshes the browser or opens the mobile app while already logged in, the app briefly flashes the login screen before suddenly jumping to the dashboard.
**Why it happens:** `onAuthStateChanged` is asynchronous. Initially, `user` is `null` and `isLoading` is true. If navigation decisions are made before `isLoading` transitions to `false`, the router assumes the user is logged out.
**How to avoid:** Guard route transitions with `isLoading`. Render a clean full-screen loading spinner (or splash screen) until `onAuthStateChanged` fires its first event.
**Warning signs:** Visual flickers during page refresh on web or app startup on mobile.

### Pitfall 2: AsyncStorage Double-Initialization / Fast Refresh Errors
**What goes wrong:** During React Native Fast Refresh or hot reload in development, Firebase throws: `Firebase: Error (auth/already-initialized)`.
**Why it happens:** `initializeAuth` is called more than once on the same Firebase app instance when modules re-evaluate during hot reloading.
**How to avoid:** Use a `try/catch` block wrapping `initializeAuth`, falling back to `getAuth(app)` if already initialized (as configured in `src/config/firebase.ts`).
**Warning signs:** Redbox errors during hot reload: `Auth instance has already been initialized`.

### Pitfall 3: Platform Incompatibilities with Popup Social Auth on Native
**What goes wrong:** Calling `signInWithPopup(auth, provider)` on native iOS/Android crashes the app because `window.open` does not exist in native JavaScript runtimes.
**Why it happens:** Firebase JS SDK `signInWithPopup` and `signInWithRedirect` are web-only DOM APIs.
**How to avoid:** Restrict `signInWithPopup` to `Platform.OS === 'web'`. On native mobile, either use email/password authentication or native OAuth flows via Expo AuthSession.
**Warning signs:** `window is not defined` or `signInWithPopup is not supported in this environment` runtime exceptions on mobile.

### Pitfall 4: Mobile Virtual Keyboard Covering Form Inputs
**What goes wrong:** Tapping the password or confirmation input on mobile opens the soft keyboard, which obscures the input field and submit button, trapping the user.
**Why it happens:** React Native views do not automatically adjust layout height when the on-screen keyboard appears on mobile devices.
**How to avoid:** Wrap the auth form in a `KeyboardAvoidingView` with `behavior={Platform.OS === 'ios' ? 'padding' : undefined}` and wrap content inside a `ScrollView` with `keyboardShouldPersistTaps="handled"`.
**Warning signs:** Users cannot see what they are typing on smaller mobile screens.

### Pitfall 5: Missing Firestore User Profile Document on New Registration
**What goes wrong:** User is created in Firebase Auth, but subsequent queries to `users/{uid}` return `undefined`, causing dashboard crashes or missing display names.
**Why it happens:** `createUserWithEmailAndPassword` only creates the Auth credential; it does not automatically populate the Firestore database.
**How to avoid:** Execute `ensureUserDocument(user)` immediately upon successful registration or initial auth state detection in `AuthService`.
**Warning signs:** Firestore `users` collection remains empty despite multiple registered users.
</common_pitfalls>

<code_examples>
## Code Examples

### 1. AuthService (Parity with Angular Service)
```typescript
// src/features/auth/services/auth.service.ts
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
  signInWithPopup,
  GoogleAuthProvider,
  User,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Platform } from 'react-native';
import { auth, db } from '../../../config/firebase';
import { UserProfile, LoginCredentials, RegisterCredentials } from '../types/auth.types';

export const AuthService = {
  /** Sign in with email and password */
  async login({ email, password }: LoginCredentials): Promise<User> {
    const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
    await AuthService.ensureUserDocument(credential.user);
    return credential.user;
  },

  /** Register with email, password, and display name */
  async register({ email, password, displayName }: RegisterCredentials): Promise<User> {
    const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
    if (displayName) {
      await updateProfile(credential.user, { displayName: displayName.trim() });
    }
    await AuthService.ensureUserDocument(credential.user, displayName);
    return credential.user;
  },

  /** Web Google Sign In */
  async signInWithGoogle(): Promise<User> {
    if (Platform.OS !== 'web') {
      throw new Error('Google Sign-In via popup is only supported on web');
    }
    const provider = new GoogleAuthProvider();
    const credential = await signInWithPopup(auth, provider);
    await AuthService.ensureUserDocument(credential.user);
    return credential.user;
  },

  /** Sign out */
  async logout(): Promise<void> {
    await signOut(auth);
  },

  /** Synchronize user document in Firestore users/{uid} */
  async ensureUserDocument(user: User, customDisplayName?: string): Promise<UserProfile> {
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);

    const displayName =
      customDisplayName ||
      user.displayName ||
      user.email?.split('@')[0] ||
      'User';

    if (!userSnap.exists()) {
      const newProfile: Omit<UserProfile, 'createdAt' | 'updatedAt'> & {
        createdAt: any;
        updatedAt: any;
      } = {
        uid: user.uid,
        email: user.email || '',
        displayName,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      await setDoc(userRef, newProfile);
      return {
        uid: user.uid,
        email: user.email || '',
        displayName,
      };
    }

    const data = userSnap.data();
    return {
      uid: user.uid,
      email: data.email || user.email || '',
      displayName: data.displayName || displayName,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  },
};
```

### 2. Firebase Error Code Translator
```typescript
// src/features/auth/utils/auth-errors.ts
export function getAuthErrorMessage(code: string): string {
  switch (code) {
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Invalid email or password';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists';
    case 'auth/weak-password':
      return 'Password must be at least 6 characters';
    case 'auth/invalid-email':
      return 'Invalid email address';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please try again later.';
    case 'auth/user-disabled':
      return 'This account has been disabled';
    case 'auth/network-request-failed':
      return 'Network error. Please check your internet connection.';
    case 'auth/popup-closed-by-user':
      return 'Sign-in cancelled';
    default:
      return 'Authentication failed. Please try again.';
  }
}
```

### 3. Responsive AuthLayout & Keyboard Avoiding Wrapper
```typescript
// src/features/auth/components/AuthLayout.tsx
import React from 'react';
import {
  View,
  Text,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ title, subtitle, children }) => {
  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-900">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center' }}
          className="p-4 sm:p-6"
          keyboardShouldPersistTaps="handled"
        >
          <View className="w-full max-w-md">
            {/* Header Brand */}
            <View className="items-center mb-6">
              <View className="w-14 h-14 rounded-2xl bg-indigo-600 items-center justify-center mb-3 shadow-md">
                <Text className="text-white font-black text-xl tracking-wider">EE</Text>
              </View>
              <Text className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                Expense Expert
              </Text>
              <Text className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Track your expenses smarter
              </Text>
            </View>

            {/* Card Body */}
            <View className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 p-6 sm:p-8">
              <Text className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-1">
                {title}
              </Text>
              <Text className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                {subtitle}
              </Text>

              {children}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};
```
</code_examples>

<sota_updates>
## State of the Art (2024-2026)

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| React Navigation `createSwitchNavigator` with manual auth token checking | Expo Router v4 layout groups `(auth)` / `(app)` with `useSegments()` layout gates | Expo Router v3/v4 (2024-2025) | Removes imperative navigation logic from components; handles web deep links and browser history natively. |
| Firebase Namespaced SDK (`firebase.auth().signInWithEmailAndPassword`) | Firebase v10/v11 Modular SDK (`signInWithEmailAndPassword(auth, email, pass)`) | Firebase v9+ | Tree-shakable bundle, ~40% smaller JavaScript bundle on web and mobile. |
| Manual cookie or AsyncStorage JWT header injection for client DB queries | Firebase Security Rules with `request.auth.uid` + `onAuthStateChanged` | Firebase 2024+ | Cloud Firestore security rules directly validate Firebase Auth session without maintaining custom backend token verification middleware. |
| `StyleSheet.create` responsive hacks for desktop web vs mobile | NativeWind v4 with Tailwind responsive modifiers (`sm:`, `md:`, `lg:`) | NativeWind v4 (2024-2025) | Unified Tailwind CSS markup compiles seamlessly across native flexbox and web CSS grid/flexbox. |
</sota_updates>

<open_questions>
## Open Questions

1. **Social Login on Native Mobile:**
   - What we know: `signInWithPopup` is web-only in the Firebase JS SDK.
   - What's unclear: If native Google Sign-In is required on physical mobile devices in future phases, it requires native configuration plugins (`@react-native-google-signin/google-signin` with EAS prebuild).
   - Recommendation: For Phase 2, provide full Email/Password authentication across Web and Mobile, and enable Google popup authentication on Web (matching the Angular web app). Keep social auth pluggable.
</open_questions>

<sources>
## Sources

### Primary (HIGH confidence)
- `expense-expert/src/app/core/services/auth.service.ts` — Verified exact Angular auth methods, signals, and Firestore user profile synchronization.
- `expense-expert/src/app/features/auth/` — Verified login/register component templates, error codes, and Tailwind UI designs.
- `expense-expert-rn/src/config/firebase.ts` — Verified modular Firebase v11 app initialization and AsyncStorage platform-aware persistence setup.
- Official Expo Router v4 Documentation (Authentication & Protected Routes) — Verified `useSegments`, `useRouter`, and route group patterns.

### Secondary (MEDIUM confidence)
- Firebase JS SDK v11 Reference — Verified modular Auth and Firestore API signatures.
- NativeWind v4 Documentation — Verified Tailwind styling patterns for React Native cross-platform cards.

### Tertiary (LOW confidence - needs validation)
- None — all patterns verified against existing codebase and official specifications.
</sources>

## Validation Architecture

### 1. Test Framework & Setup
- **Test Runner:** Jest (`jest-expo` universal preset configured in `expense-expert-rn/package.json`).
- **UI Testing:** `@testing-library/react-native` for component and hook rendering.
- **Execution Command:** `npm test` or `npm run test` inside `expense-expert-rn/`.

### 2. Unit & Integration Test Matrix

| Component / Unit | Test File | Test Scenarios |
|------------------|-----------|----------------|
| `AuthService` | `__tests__/features/auth/auth.service.test.ts` | 1. Successful `login` calls `signInWithEmailAndPassword` and syncs Firestore.<br>2. Successful `register` calls `createUserWithEmailAndPassword`, updates profile, and creates Firestore user document.<br>3. `ensureUserDocument` creates user document if not exists, or returns existing.<br>4. `logout` calls `signOut`.<br>5. `signInWithGoogle` works on web and rejects on non-web. |
| `auth-errors` | `__tests__/features/auth/auth-errors.test.ts` | 1. Maps all Firebase error codes (`auth/invalid-credential`, `auth/email-already-in-use`, `auth/weak-password`, etc.) to user-friendly messages.<br>2. Returns fallback message for unknown error codes. |
| `AuthProvider` & `useAuth` | `__tests__/features/auth/AuthProvider.test.tsx` | 1. Provides initial `isLoading: true` while waiting for auth state.<br>2. Updates `user`, `profile`, and `isAuthenticated: true` when `onAuthStateChanged` emits user.<br>3. Updates `user: null`, `profile: null`, and `isAuthenticated: false` when `onAuthStateChanged` emits null.<br>4. Throws error if `useAuth` is called outside `AuthProvider`. |
| `LoginForm` | `__tests__/features/auth/LoginForm.test.tsx` | 1. Renders email and password fields, submit button, and brand header.<br>2. Disables submit button when inputs are empty or when loading.<br>3. Triggers `login` with input values on submit.<br>4. Displays error banner when login fails. |
| `RegisterForm` | `__tests__/features/auth/RegisterForm.test.tsx` | 1. Renders display name, email, password, and confirm password fields.<br>2. Disables submit button when passwords do not match or password is < 6 chars.<br>3. Shows validation error when passwords do not match.<br>4. Calls `register` with valid credentials on submit. |

### 3. Verification Scenarios & Manual Checks
- **AUTH-01 (Login/Register on Web & Mobile):**
  1. Open app on Web (`npm run web` / `http://localhost:8081`).
  2. Navigate to Register screen, create a test account (e.g. `testuser@example.com` / `password123`).
  3. Verify Firestore receives document in `users/{uid}` with `email` and `displayName`.
  4. Log out and log back in with the created credentials.
- **AUTH-02 (Session Persistence across restarts):**
  1. Refresh the web browser — verify the user remains authenticated and stays on the dashboard without flashing the login screen.
  2. Restart the Metro development server / app bundle — verify session persists from AsyncStorage.

<metadata>
## Metadata

**Research scope:**
- Core technology: Firebase Authentication, Cloud Firestore, Expo Router v4, React Native Web
- Ecosystem: `@react-native-async-storage/async-storage`, NativeWind v4, `@testing-library/react-native`
- Patterns: AuthContext/AuthProvider, Protected Route Groups, Service-Layer Firestore Profile Sync, Responsive Auth Layout
- Pitfalls: Session hydration flashing, Fast Refresh re-init, Web/Native popup incompatibility, Keyboard occlusion

**Confidence breakdown:**
- Standard stack: HIGH - all libraries locked and tested in Phase 1
- Architecture: HIGH - matches Angular domain architecture and Expo Router best practices
- Pitfalls: HIGH - verified solutions for cross-platform hydration and persistence
- Code examples: HIGH - TypeScript implementations compatible with project codebase

**Research date:** 2026-08-23
**Valid until:** 2026-09-23 (30 days)
</metadata>

---

*Phase: 02-authentication-system*
*Research completed: 2026-08-23*
*Ready for planning: yes*
