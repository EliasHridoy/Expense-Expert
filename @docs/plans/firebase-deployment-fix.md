# Plan: Fix Firebase Environment Configuration and Deploy to Firebase Hosting

## Problem
Visiting the deployed application at `https://expense-expert-d155a.firebaseapp.com/` causes a runtime error in the browser:
`Uncaught TypeError: Cannot read properties of undefined (reading 'NG_APP_FIREBASE_AUTH_DOMAIN')`

### Root Cause
1. In `environment.ts` and `environment.prod.ts`, Firebase configurations read directly from `import.meta.env['NG_APP_...']`.
2. When built with `@ngx-env/builder` (esbuild), only variables defined during build time (via environment or `.env`) are transformed. Any undefined variable is left as `import.meta.env['...']`.
3. In modern browsers, native ES modules have `import.meta` (which contains `url`), but `import.meta.env` is `undefined`.
4. Accessing `import.meta.env['...']` on `undefined` causes a fatal TypeError before any fallback values can take effect.
5. In addition, the local `.env` file only had `NG_APP_FIREBASE_API_KEY` defined, leaving the remaining variables unpopulated during local builds.

## Solution Steps
1. **Safely Access Environment Variables with Optional Chaining & Robust Fallbacks:**
   - Update `src/env.d.ts` so `ImportMeta.env` is typed as optional `readonly env?: Env`.
   - Update `src/environments/environment.ts` and `src/environments/environment.prod.ts` to safely access variables using `import.meta.env?.['NG_APP_...']` with fallback defaults matching the production Firebase project (`expense-expert-d155a`).
2. **Update `.env`:**
   - Add all `NG_APP_FIREBASE_*` configuration keys to `expense-expert/.env`.
3. **Configure `angular.json`:**
   - Ensure `fileReplacements` replaces `environment.ts` with `environment.prod.ts` for production builds if needed.
4. **Build the Application:**
   - Run `npm run build` in `expense-expert/` and verify the generated output in `dist/expense-expert/browser` has no unresolved references that cause runtime crashes.
5. **Deploy to Firebase Hosting:**
   - Use `firebase deploy --only hosting` to deploy the built assets to `https://expense-expert-d155a.firebaseapp.com/`.
6. **Verify Deployment & Console Errors:**
   - Fetch the live site scripts and verify through headless browser / curl checks and simulated execution that the runtime error is gone.
