export interface EmailPasswordCredentials {
  email: string;
  password: string;
}

export function initializePlatformAuth(
  app: unknown,
  platform: "web" | "ios" | "android" = "web",
  deps: {
    getAuth?: (app: unknown) => unknown;
    initializeAuth?: (app: unknown, options: { persistence: unknown }) => unknown;
    getReactNativePersistence?: (storage: unknown) => unknown;
    asyncStorage?: unknown;
  } = {}
) {
  const getAuth = deps.getAuth ?? ((value: unknown) => ({ app: value }));
  const initializeAuth = deps.initializeAuth ?? ((value: unknown) => ({ app: value }));
  const getReactNativePersistence = deps.getReactNativePersistence ?? ((storage: unknown) => storage);
  return platform === "web"
    ? getAuth(app)
    : initializeAuth(app, {
        persistence: getReactNativePersistence(deps.asyncStorage)
      });
}

export async function signInWithEmail(auth: unknown, credentials: EmailPasswordCredentials, signInImpl?: (auth: unknown, email: string, password: string) => Promise<unknown>) {
  const impl = signInImpl ?? (async () => ({ user: { uid: "demo" } }));
  return impl(auth, credentials.email, credentials.password);
}

export async function registerWithEmail(
  auth: unknown,
  credentials: EmailPasswordCredentials,
  registerImpl?: (auth: unknown, email: string, password: string) => Promise<unknown>
) {
  const impl = registerImpl ?? (async () => ({ user: { uid: "demo" } }));
  return impl(auth, credentials.email, credentials.password);
}
