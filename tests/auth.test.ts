import test from "node:test";
import { equal, ok } from "node:assert/strict";
import { initializePlatformAuth, registerWithEmail, signInWithEmail } from "../src/lib/auth";

test("chooses platform auth branch", () => {
  const web = initializePlatformAuth({ name: "app" }, "web", { getAuth: (app) => ({ app }) });
  ok(Boolean(web));
  const mobile = initializePlatformAuth({ name: "app" }, "ios", {
    initializeAuth: (app) => ({ app }),
    getReactNativePersistence: () => ({}),
    asyncStorage: {}
  });
  ok(Boolean(mobile));
});

test("signs in and registers with injected implementations", async () => {
  const signIn = await signInWithEmail({}, { email: "demo@expense.expert", password: "secret" }, async (_auth, email) => ({ user: { uid: email } }));
  equal((signIn as { user: { uid: string } }).user.uid, "demo@expense.expert");
  const register = await registerWithEmail({}, { email: "demo@expense.expert", password: "secret" }, async (_auth, email) => ({ user: { uid: email } }));
  equal((register as { user: { uid: string } }).user.uid, "demo@expense.expert");
});
