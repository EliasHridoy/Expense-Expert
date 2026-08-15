export interface AsyncKeyValueStorage {
  getItem(key: string): Promise<string | null> | string | null;
  setItem(key: string, value: string): Promise<void> | void;
  removeItem(key: string): Promise<void> | void;
}

export interface SecureStorageAdapter {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

function resolveStorage<T>(value: Promise<T> | T): Promise<T> {
  return Promise.resolve(value);
}

export function createSecureStorageAdapter(deps: {
  platform?: "web" | "ios" | "android";
  webStorage?: Storage | AsyncKeyValueStorage;
  nativeStorage?: AsyncKeyValueStorage;
} = {}): SecureStorageAdapter {
  const platform = deps.platform ?? "web";
  if (platform === "web") {
    const webStorage = deps.webStorage ?? (typeof sessionStorage !== "undefined" ? sessionStorage : undefined);
    if (!webStorage) {
      throw new Error("sessionStorage is unavailable in this environment");
    }
    return {
      async getItem(key: string) {
        return "getItem" in webStorage ? resolveStorage(webStorage.getItem(key)) : null;
      },
      async setItem(key: string, value: string) {
        if ("setItem" in webStorage) {
          await resolveStorage(webStorage.setItem(key, value));
        }
      },
      async removeItem(key: string) {
        if ("removeItem" in webStorage) {
          await resolveStorage(webStorage.removeItem(key));
        }
      }
    };
  }

  const nativeStorage = deps.nativeStorage;
  if (!nativeStorage) {
    throw new Error("Native secure storage is unavailable in this environment");
  }

  return {
    getItem: (key: string) => resolveStorage(nativeStorage.getItem(key)),
    setItem: (key: string, value: string) => resolveStorage(nativeStorage.setItem(key, value)),
    removeItem: (key: string) => resolveStorage(nativeStorage.removeItem(key))
  };
}

export const secureStorage = createSecureStorageAdapter({
  platform: "web",
  webStorage:
    typeof sessionStorage !== "undefined"
      ? sessionStorage
      : ({
          getItem: async () => null,
          setItem: async () => undefined,
          removeItem: async () => undefined
        } satisfies AsyncKeyValueStorage)
});
