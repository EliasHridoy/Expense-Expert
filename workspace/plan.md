## Goal
The goal is to modernize and migrate the existing Angular 18 Expense Expert application into a unified React Native cross-platform application supporting Web, iOS, and Android. This modernization will leverage Expo, Docker, and Firebase to introduce mobile-native features like offline caching, biometric security, and push notifications while preserving the existing Firestore data schemas and ensuring zero data loss. Docker containerization will provide an isolated, reproducible environment for local development and testing.

## Tech Stack
- **React Native (Expo SDK 51+)**: 
  - **Choice**: React Native with Expo.
  - **Rationale**: Enables a universal cross-platform engine targeting iOS, Android, and Web from a single codebase, reducing development overhead. Swift/Kotlin or plain React were rejected as they require multiple disjointed codebases.
- **Expo Router (v3.5+)**: 
  - **Choice**: Expo Router.
  - **Rationale**: Provides file-based routing with deep linking and clean web URLs out-of-the-box. React Navigation without Expo Router was rejected due to manual routing overhead on Web.
- **Zustand**: 
  - **Choice**: Zustand with AsyncStorage persistence.
  - **Rationale**: Offers lightweight global state management that easily integrates with AsyncStorage for offline data persistence. Redux was rejected due to excessive boilerplate.
- **Firebase JS SDK (v10+)**: 
  - **Choice**: Firebase Auth and Firestore.
  - **Rationale**: Required to match the existing Angular app's document schema and authentication to ensure full data compatibility and zero data loss for existing users. Alternative BaaS options were rejected to avoid backend migration.
- **NativeWind (v4)**: 
  - **Choice**: NativeWind (Tailwind CSS for RN).
  - **Rationale**: Allows consistent visual design and utility class styling shared between Web and Mobile views, including seamless dark mode support. Styled-components was rejected due to runtime overhead.
- **react-native-gifted-charts**: 
  - **Choice**: react-native-gifted-charts.
  - **Rationale**: Uses `react-native-svg` for reliable cross-platform SVG vector rendering on Web and Mobile. `victory-native-xl` was rejected because Skia requires CanvasKit WebAssembly, which frequently causes load failures and crashes on Web.
- **Docker & Docker Compose**: 
  - **Choice**: `node:20-bullseye-slim` based Docker environment.
  - **Rationale**: Provides isolated container environment for reproducible builds. Alpine Linux was rejected because musl libc causes runtime segmentation faults and binary incompatibility with native bundling dependencies.

## Tasks
- [ ] **Task 1: Setup Docker Containerized Environment**
  - Create `Dockerfile` using `node:20-bullseye-slim` as the base image.
  - Create `docker-compose.yml` exposing port `8081:8081` for the Metro packager and Web server.
  - Define an anonymous volume for `/app/node_modules` in `docker-compose.yml`.
  - Set environment variables: `EXPO_DEVTOOLS_LISTEN_ADDRESS=0.0.0.0`, `CHOKIDAR_USEPOLLING=true`, `METRO_ENABLE_POLLING=true`, and `CI=1`.
  - Acceptance: Running `docker-compose up` starts the Expo server, and modifying a local file successfully triggers hot reloading.
- [ ] **Task 2: Initialize Expo Project & Configure Firebase Auth**
  - Initialize the Expo project with Expo Router and TypeScript.
  - Install Firebase JS SDK.
  - Implement platform-conditional Auth initialization: use `Platform.OS === 'web' ? getAuth(app) : initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) })`.
  - Acceptance: Application compiles on both web and mobile platforms without crashes; users can log in via Email/Password.
- [ ] **Task 3: Configure Metro for Firebase and NativeWind**
  - Install NativeWind v4 and Tailwind CSS v3.4+.
  - Update `metro.config.js` to combine `withNativeWind` and Firebase fixes: push `'cjs'` to `config.resolver.sourceExts` and set `config.resolver.unstable_enablePackageExports = false`.
  - Configure `babel.config.js` for NativeWind and import `global.css` at the top of `app/_layout.tsx`.
  - Acceptance: No runtime errors regarding `.cjs` exports; Tailwind utility classes render accurately on Web and Mobile.
- [ ] **Task 4: Implement Expo Router & Auth Navigation Flow**
  - Organize routes into `(auth)` and `(app)` groups for clean browser URLs.
  - In `app/_layout.tsx`, guard route redirects by checking `useRootNavigationState()?.key` before invoking `router.replace()`.
  - Acceptance: Unauthenticated users are redirected to `/login` and authenticated users to `/dashboard` without "Attempted to navigate before mounting" console errors.
- [ ] **Task 5: Setup Zustand Stores with Offline Persistence**
  - Create domain stores (e.g., `useExpenseStore`) using Zustand.
  - Use `persist` middleware with `createJSONStorage(() => AsyncStorage)`.
  - Track hydration lifecycle by adding `_hasHydrated` boolean state and toggling it via `onRehydrateStorage` callback.
  - Acceptance: Data persists across application reloads, and the UI waits for hydration to complete before rendering to prevent flickering.
- [ ] **Task 6: Implement Secure Storage Platform Adapter**
  - Create a `secureStorage` helper module that conditionally routes storage operations.
  - On `Platform.OS === 'web'`, delegate to `sessionStorage`. On native mobile, use `expo-secure-store` methods.
  - Acceptance: Calling `secureStorage.setItem` and `secureStorage.getItem` functions flawlessly on both Web and Mobile without throwing Web-specific unsupported errors.
- [ ] **Task 7: Implement Biometric AppState Lifecycle & Security**
  - Integrate `expo-local-authentication` for Face ID / Touch ID.
  - Add an `AppState` event listener in `app/_layout.tsx` to automatically prompt for biometric/PIN authentication when the app transitions from `background` to `active`.
  - Acceptance: The mobile application locks when backgrounded and successfully authenticates the user upon returning to the foreground.
- [ ] **Task 8: Build Expense CRUD with Atomic Firebase Operations**
  - Implement views for adding, editing, and deleting expenses mapped to the `users/{userId}/expenses/{expenseId}` schema.
  - For operations impacting multiple documents (e.g., creating a loan repayment), use Firestore `writeBatch()` with `increment()` to update parent totals atomically.
  - Acceptance: Logging a loan repayment expense reliably and transactionally updates the associated loan's repaid balance without race conditions.
- [ ] **Task 9: Implement Dashboard Analytics with Offline Fallbacks**
  - Build Dashboard analytics UI using `react-native-gifted-charts`.
  - Fetch aggregated metrics (Total Income, Total Expenses) using Firestore `getAggregateFromServer()`.
  - Wrap aggregation queries in a `try/catch` block that falls back to computing the sum/count locally from the hydrated Zustand cache if the network request fails.
  - Acceptance: Charts render correctly on all platforms; dashboard metrics calculate accurately even when the device is disconnected from the network.
- [ ] **Task 10: Implement Drafts, Savings, and Loan Modules**
  - Implement CRUD and synchronization logic for Draft Templates, Monthly Draft Applications, Bank Accounts, Saving Goals, and Loan Tracking.
  - Acceptance: Users can perform all operations, and the generated Firestore documents perfectly match the legacy application's expected schema and structure.
- [ ] **Task 11: Implement Cross-Platform PDF Export**
  - Develop PDF generation for monthly statements using `expo-print` (`printToFileAsync({ html })`).
  - Check `Sharing.isAvailableAsync()`. On Web, route the export to `Print.printAsync({ html })` or trigger a Base64 Blob file download. On mobile, use `Sharing.shareAsync()`.
  - Acceptance: PDF statements are generated and shareable on iOS/Android; Web triggers a print dialog or file download successfully.

## Risks
| Risk | Severity | Mitigation |
|------|----------|------------|
| Web crash on `getReactNativePersistence` | HIGH | Use `Platform.OS === 'web' ? getAuth() : initializeAuth(...)` with AsyncStorage persistence exclusively for mobile. |
| Dashboard analytics failure when offline | HIGH | Wrap `getAggregateFromServer()` in a try/catch block with a client-side fallback to compute totals from the local Zustand cache. |
| `expo-secure-store` throwing on Web | HIGH | Create a platform storage adapter routing `expo-secure-store` calls to `sessionStorage` when running on Web. |
| Firebase JS SDK lacks persistent disk cache on RN | HIGH | Utilize Zustand's `persist` middleware with `AsyncStorage` and robust hydration state tracking to cache data locally. |
| Skia WebAssembly rendering failure on Web | HIGH | Use `react-native-gifted-charts` with `react-native-svg` to provide reliable cross-platform SVG rendering without WebAssembly. |
| Metro bundler failure on Firebase modular `.cjs` exports | MED | Inject `sourceExts.push('cjs')` and `unstable_enablePackageExports = false` into the `metro.config.js` configuration. |
| Docker file watching drops across volume mounts | MED | Define an anonymous `/app/node_modules` volume and enforce `CHOKIDAR_USEPOLLING=true` and `METRO_ENABLE_POLLING=true`. |
| Unencrypted financial data in `AsyncStorage` | MED | Store sensitive biometric states, tokens, and PINs strictly via the `secureStorage` wrapper using `expo-secure-store`. |
| `expo-sharing` failing on Web | MED | Branch logic on Web to invoke `Print.printAsync()` or fallback to a standard Blob download instead of `Sharing.shareAsync()`. |
| Expo Router auth redirect loops | LOW | Guard programmatic redirects by verifying `useRootNavigationState()?.key` before calling `router.replace()`. |

## Open Questions
None — plan is ready for implementation.
