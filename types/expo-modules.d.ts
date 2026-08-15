declare module "expo-secure-store" {
  export function getItemAsync(key: string): Promise<string | null>;
  export function setItemAsync(key: string, value: string): Promise<void>;
  export function deleteItemAsync(key: string): Promise<void>;
}

declare module "expo-local-authentication" {
  export function hasHardwareAsync(): Promise<boolean>;
  export function isEnrolledAsync(): Promise<boolean>;
  export function authenticateAsync(options?: Record<string, unknown>): Promise<{ success: boolean }>;
}

declare module "expo-print" {
  export function printToFileAsync(options: { html: string }): Promise<{ uri: string }>;
  export function printAsync(options: { html: string }): Promise<void>;
}

declare module "expo-sharing" {
  export function isAvailableAsync(): Promise<boolean>;
  export function shareAsync(uri: string): Promise<void>;
}
