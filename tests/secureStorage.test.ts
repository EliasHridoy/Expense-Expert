import test from "node:test";
import { equal } from "node:assert/strict";
import { createSecureStorageAdapter } from "../src/lib/secureStorage";

test("uses web storage when platform is web", async () => {
  const memory = new Map<string, string>();
  const storage = createSecureStorageAdapter({
    platform: "web",
    webStorage: {
      getItem: async (key: string) => memory.get(key) ?? null,
      setItem: async (key: string, value: string) => {
        memory.set(key, value);
      },
      removeItem: async (key: string) => {
        memory.delete(key);
      }
    }
  });
  await storage.setItem("token", "abc");
  equal(await storage.getItem("token"), "abc");
  await storage.removeItem("token");
  equal(await storage.getItem("token"), null);
});

test("uses native storage when platform is mobile", async () => {
  const memory = new Map<string, string>();
  const storage = createSecureStorageAdapter({
    platform: "ios",
    nativeStorage: {
      getItem: async (key: string) => memory.get(key) ?? null,
      setItem: async (key: string, value: string) => {
        memory.set(key, value);
      },
      removeItem: async (key: string) => {
        memory.delete(key);
      }
    }
  });
  await storage.setItem("pin", "1234");
  equal(await storage.getItem("pin"), "1234");
});
