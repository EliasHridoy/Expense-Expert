declare module "node:test" {
  export function test(name: string, fn: () => void | Promise<void>): void;
  export default test;
}

declare module "node:assert/strict" {
  export function equal(actual: unknown, expected: unknown, message?: string): void;
  export function deepEqual(actual: unknown, expected: unknown, message?: string): void;
  export function ok(value: unknown, message?: string): void;
  export function strictEqual(actual: unknown, expected: unknown, message?: string): void;
}

declare module "node:fs" {
  export function readdirSync(path: string, options?: { recursive?: boolean; withFileTypes?: boolean }): any[];
}

declare module "node:path" {
  export function join(...parts: string[]): string;
  export function resolve(...parts: string[]): string;
  export function dirname(path: string): string;
  export function basename(path: string, ext?: string): string;
  export function extname(path: string): string;
}

declare module "node:url" {
  export function fileURLToPath(url: string): string;
}

declare const __dirname: string;
declare const Buffer: {
  from(value: string, encoding?: string): { toString(encoding?: string): string };
};
