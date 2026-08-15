export interface FirebaseApp {
  name: string;
}

export interface Auth {
  app: unknown;
}

export interface Firestore {
  app: unknown;
}

export interface FirebaseEnvironment {
  apiKey: string;
  authDomain: string;
  projectId: string;
  appId: string;
  storageBucket?: string;
  messagingSenderId?: string;
}

export const firebaseConfig: FirebaseEnvironment = {
  apiKey: "demo-api-key",
  authDomain: "expense-expert.firebaseapp.com",
  projectId: "expense-expert",
  appId: "expense-expert-app",
  storageBucket: "expense-expert.appspot.com",
  messagingSenderId: "000000000000"
};

export async function createFirebaseServices(
  platform: "web" | "ios" | "android" = "web",
  deps: {
    initializeApp?: (config: Record<string, string>) => FirebaseApp;
    getAuth?: (app: FirebaseApp) => Auth;
    initializeAuth?: (app: FirebaseApp, options: { persistence: unknown }) => Auth;
    getReactNativePersistence?: (storage: unknown) => unknown;
    getFirestore?: (app: FirebaseApp) => Firestore;
    asyncStorage?: unknown;
  } = {}
) {
  const initializeApp = deps.initializeApp ?? ((config: Record<string, string>) => ({ name: config.projectId }));
  const getAuth = deps.getAuth ?? ((app: FirebaseApp) => ({ app }));
  const initializeAuth = deps.initializeAuth ?? ((app: FirebaseApp) => ({ app }));
  const getReactNativePersistence = deps.getReactNativePersistence ?? ((storage: unknown) => storage);
  const getFirestore = deps.getFirestore ?? ((app: FirebaseApp) => ({ app }));
  const app: FirebaseApp = initializeApp(firebaseConfig as unknown as Record<string, string>);
  const auth: Auth = platform === "web" ? getAuth(app) : initializeAuth(app, { persistence: getReactNativePersistence(deps.asyncStorage) });
  const db = getFirestore(app);
  return { app, auth, db };
}

export interface FirestorePath {
  userId: string;
  collection: "expenses" | "expense_drafts" | "draft_applications" | "income_entries" | "income_drafts" | "persons" | "loans_taken" | "bank_accounts" | "saving_goals" | "saving_entries";
  documentId: string;
}

export function buildDocumentPath({ userId, collection, documentId }: FirestorePath): string {
  return `users/${userId}/${collection}/${documentId}`;
}

export interface BatchOperation {
  type: "set" | "update" | "delete";
  path: string;
  data?: Record<string, unknown>;
}

export function buildLoanRepaymentBatch(input: {
  userId: string;
  loanId: string;
  expenseId: string;
  amount: number;
  repaidBefore: number;
  loanAmount: number;
}): BatchOperation[] {
  const repaidAfter = Number((input.repaidBefore + input.amount).toFixed(2));
  const status = repaidAfter >= input.loanAmount ? "cleared" : repaidAfter > 0 ? "partially_repaid" : "active";
  return [
    {
      type: "set",
      path: buildDocumentPath({ userId: input.userId, collection: "expenses", documentId: input.expenseId }),
      data: {
        amount: input.amount,
        category: "Loan",
        type: "LOAN",
        isLoan: true,
        loanRepaid: input.amount
      }
    },
    {
      type: "update",
      path: buildDocumentPath({ userId: input.userId, collection: "loans_taken", documentId: input.loanId }),
      data: {
        repaid: repaidAfter,
        status
      }
    }
  ];
}
