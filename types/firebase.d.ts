declare module "firebase/app" {
  export type FirebaseApp = { name: string };
  export function initializeApp(config: Record<string, string>): FirebaseApp;
}

declare module "firebase/auth" {
  export type Auth = { app: unknown };
  export type Persistence = unknown;
  export function getAuth(app: unknown): Auth;
  export function initializeAuth(app: unknown, options: { persistence: Persistence }): Auth;
  export function getReactNativePersistence(storage: unknown): Persistence;
  export function onAuthStateChanged(auth: Auth, cb: (user: { uid: string } | null) => void): () => void;
  export function signInWithEmailAndPassword(auth: Auth, email: string, password: string): Promise<{ user: { uid: string } }>;
  export function createUserWithEmailAndPassword(auth: Auth, email: string, password: string): Promise<{ user: { uid: string } }>;
  export function signOut(auth: Auth): Promise<void>;
}

declare module "firebase/firestore" {
  export type Firestore = unknown;
  export function getFirestore(app: unknown): Firestore;
  export function collection(db: Firestore, ...path: string[]): unknown;
  export function doc(db: Firestore, ...path: string[]): unknown;
  export function writeBatch(db: Firestore): {
    set(ref: unknown, data: unknown): void;
    update(ref: unknown, data: unknown): void;
    delete(ref: unknown): void;
    commit(): Promise<void>;
  };
  export function increment(value: number): { __increment: number };
  export function getAggregateFromServer(ref: unknown, aggregation: unknown): Promise<{ data(): Record<string, number> }>;
}
