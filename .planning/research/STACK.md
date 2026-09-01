# Stack Research

**Domain:** React Native (Web & Mobile) Expense Tracking Application
**Researched:** 2026-08-23
**Confidence:** HIGH

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| expo | ~52.0.0 | Universal App Framework | Expo is the de facto standard for building React Native apps in 2025/2026. It provides first-class support for Web, iOS, and Android out of the box, which is critical since the goal is a seamless cross-platform experience. It also uses the New Architecture by default. |
| react-native | 0.76.0+ | Core Framework | Enables building native apps using React. Version 0.76+ enables the New Architecture (Fabric/TurboModules) by default, significantly improving performance. |
| expo-router | ~4.0.0 | File-based Routing | Built on React Navigation, Expo Router provides universal file-based routing. It ensures deep linking on mobile and standard URL paths on the web behave identically without maintaining separate routing trees. |
| firebase | ^11.0.0 | Backend SDK (Web) | Required backend constraint. The JS SDK works seamlessly on Expo Web. |
| @react-native-firebase/app | ^22.0.0 | Backend SDK (Mobile) | Provides native Firebase SDK bindings for iOS and Android, offering significantly better performance, background execution, and offline persistence compared to the JS SDK on mobile. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| nativewind | ^4.1.0 | Styling | Since the existing Angular app uses Tailwind CSS, NativeWind allows you to reuse much of your existing mental model and utility classes across React Native and Web. |
| zustand | ^5.0.0 | Client State Management | For lightweight global state (e.g., UI toggles, theme) not handled by Firebase. Much simpler and less boilerplate than Redux. |
| victory-native | ^4.0.0 | Data Visualization | Essential for the dashboard and reporting features required by the app. Victory Native XL provides high-performance, customizable charts that work well in modern React Native. |
| react-hook-form | ^7.54.0 | Form Handling | Use for all expense entry forms. It minimizes re-renders and provides excellent performance for complex data entry. |
| zod | ^3.24.0 | Schema Validation | Pair with `react-hook-form` to ensure expense data matches expected types before sending to Firebase. |
| date-fns | ^4.1.0 | Date Manipulation | Essential for expense tracking (filtering by month, week, grouping expenses). Lighter than Moment.js. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| typescript | ^5.7.0 | Type Safety | Enforces strict typing, reducing runtime errors and improving developer experience, especially when defining Firebase document schemas. |
| jest / @testing-library/react-native | ^29.0 / ^13.0 | Unit Testing | Fulfills the requirement for module/component testing. Use `@testing-library/react-native` for behavior-driven component tests. |
| eslint-config-expo | ~8.0.0 | Linting | Standard linting for Expo universal apps to catch cross-platform issues early. |

## Installation

```bash
# Core Expo setup
npx create-expo-app@latest expense-expert-rn -t expo-template-blank-typescript

# Firebase and Routing
npx expo install expo-router firebase @react-native-firebase/app @react-native-firebase/auth @react-native-firebase/firestore

# Styling (NativeWind v4)
npm install nativewind tailwindcss react-native-reanimated

# Forms & State
npm install react-hook-form @hookform/resolvers zod zustand

# Visualization & Utils
npm install victory-native date-fns

# Dev dependencies
npm install -D @testing-library/react-native jest typescript
```

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| expo | React Native CLI (Bare) | Only if the project requires extensive custom native code that Expo config plugins cannot handle. (Not applicable here, Expo is heavily preferred). |
| expo-router | react-navigation | If you are migrating a legacy app and cannot refactor to file-based routing. For a new rewrite, `expo-router` is vastly superior. |
| nativewind | StyleSheet / Tamagui | Use standard `StyleSheet` if you want zero external styling dependencies. Use `Tamagui` if you want a complete UI kit instead of utility classes, though `nativewind` is closer to the original Tailwind usage. |
| victory-native | react-native-chart-kit | If you only need very basic, non-interactive charts. `victory-native` is generally much more robust for financial dashboards. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Redux | Overkill for this application. Firebase will handle the majority of your server state and data synchronization. | `zustand` for simple client state, or standard React context. |
| Moment.js | Deprecated, heavy bundle size, mutable API which leads to bugs in date math (critical for expense tracking). | `date-fns` or `dayjs`. |
| React Native Web (Directly) | Configuring webpack/metro for React Native Web manually is extremely fragile and difficult to maintain. | `expo` and `expo-router`, which configure universal Web support automatically. |
| JS Firebase SDK on Mobile | The standard `firebase` npm package works on React Native, but lacks native background capabilities and robust offline persistence on mobile. | `@react-native-firebase/*` for iOS/Android builds. |

## Stack Patterns by Variant

**If building for Web:**
- Use the standard `firebase` JS SDK.
- Because `@react-native-firebase` only provides native bindings and does not work on the web. You will need to create wrapper services (e.g., `auth.ts`, `auth.web.ts`) to abstract the Firebase initialization.

**If writing tests for components:**
- Use `@testing-library/react-native`.
- Because it encourages testing the application the way a user interacts with it (finding elements by text/role) rather than testing implementation details.

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| expo@~52.0.0 | react-native@0.76.x | Always use the React Native version strictly bundled/recommended by the Expo SDK version to avoid native build crashes. |
| nativewind@^4.1.0 | tailwindcss@^3.4.0 | NativeWind v4 does not fully support Tailwind v4 yet. Stick to Tailwind v3.x until explicitly supported. |
| @react-native-firebase/* | expo@~52.0.0 | Requires setting up Expo prebuild or using EAS to build custom development clients, as these are native modules not included in Expo Go. |

## Sources

- React Native 0.76 Release Notes — Verified New Architecture by default
- Expo Documentation (SDK 52) — Verified universal app patterns and React Native Web integration
- NativeWind Documentation — Verified Tailwind compatibility for React Native
- React Native Firebase Documentation — Verified necessity for native module performance vs Web SDK

---
*Stack research for: React Native (Web & Mobile) Expense Tracking Application*
*Researched: 2026-08-23*
