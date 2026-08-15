declare module "zustand" {
  export type StoreApi<T> = {
    getState(): T;
    setState(partial: Partial<T> | ((state: T) => Partial<T>), replace?: boolean): void;
    subscribe(listener: (state: T) => void): () => void;
  };
  export type StateCreator<T> = (set: (partial: Partial<T> | ((state: T) => Partial<T>)) => void, get: () => T) => T;
  export interface UseBoundStore<T> extends StoreApi<T> {
    <U>(selector: (state: T) => U): U;
    (): T;
  }
  export function create<T>(initializer: StateCreator<T>): UseBoundStore<T>;
  export function create<T>(): (initializer: StateCreator<T>) => UseBoundStore<T>;
}

declare module "zustand/middleware" {
  export function persist<T>(initializer: any, options: { name: string; storage: any; onRehydrateStorage?: () => (state?: T, error?: unknown) => void }): any;
  export function createJSONStorage(getStorage: () => any): any;
}
