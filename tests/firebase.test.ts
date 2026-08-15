import test from "node:test";
import { deepEqual, equal, ok } from "node:assert/strict";
import { buildDocumentPath, buildLoanRepaymentBatch, createFirebaseServices } from "../src/lib/firebase";

test("builds firestore paths and batch operations", () => {
  equal(buildDocumentPath({ userId: "u1", collection: "expenses", documentId: "e1" }), "users/u1/expenses/e1");
  const batch = buildLoanRepaymentBatch({
    userId: "u1",
    loanId: "l1",
    expenseId: "e1",
    amount: 400,
    repaidBefore: 6800,
    loanAmount: 10000
  });
  equal(batch.length, 2);
  equal(batch[1].data?.status, "partially_repaid");
});

test("creates firebase service placeholders without native packages", async () => {
  const services = await createFirebaseServices("web");
  ok(Boolean(services.app));
  ok(Boolean(services.auth));
  ok(Boolean(services.db));
});
