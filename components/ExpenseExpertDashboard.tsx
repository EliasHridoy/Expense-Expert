import React, { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useLedgerStore } from "../src/store/ledger-store";
import { calculateSnapshot, filterExpenses, formatCurrency, monthFromDate } from "../src/domain/finance";
import { initialState } from "../src/domain/mockData";
import { buildCashflowSeries } from "../src/domain/finance";
import { TelemetryHeader } from "./TelemetryHeader";
import { MetricTile } from "./MetricTile";
import { KineticCashflowChart } from "./KineticCashflowChart";
import { CategoryBreakdown } from "./CategoryBreakdown";
import { DraftCards } from "./DraftCards";
import { LedgerTable } from "./LedgerTable";
import { BiometricOverlay } from "./BiometricOverlay";
import { ExpenseFormModal } from "./ExpenseFormModal";
import { ModalFrame } from "./ModalFrame";
import { PdfExportModal } from "./PdfExportModal";
import { buildMonthlyStatementHtml, exportMonthlyStatement } from "../src/lib/pdf";
import { applyMonthlyDraft, createExpenseFromForm, reconcileLoan } from "../src/domain/ledger-operations";

function summarizeDraftProgress() {
  return "3 items: Rent ($1,500), Fiber ($90), Insurance ($260)";
}

export function ExpenseExpertDashboard() {
  const store = useLedgerStore();
  const snapshot = calculateSnapshot(store);
  const [online, setOnline] = useState(true);
  const [biometricLocked, setBiometricLocked] = useState(false);
  const [period, setPeriod] = useState<"monthly" | "quarterly">("monthly");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("ALL");
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showEditExpense, setShowEditExpense] = useState(false);
  const [showPdf, setShowPdf] = useState(false);
  const [showLoan, setShowLoan] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [previewHtml, setPreviewHtml] = useState(() => buildMonthlyStatementHtml(snapshot, "2026-08"));

  useEffect(() => {
    setPreviewHtml(buildMonthlyStatementHtml(snapshot, "2026-08"));
  }, [snapshot]);

  const filteredExpenses = useMemo(() => filterExpenses(store.expenses, { search, category: category as never }), [store.expenses, search, category]);
  const rows = filteredExpenses.map((entry) => ({
    id: entry.id,
    date: entry.date,
    title: entry.title,
    category: entry.category,
    type: entry.type,
    amount: entry.amount
  }));

  const series = useMemo(() => {
    if (period === "quarterly") {
      return buildCashflowSeries(store.expenses, ["2026-06", "2026-07", "2026-08"]);
    }
    return buildCashflowSeries(store.expenses, ["2026-08-01".slice(0, 7), "2026-08", "2026-08"]);
  }, [period, store.expenses]);

  function handleAddExpense(value: { title: string; description: string; amount: string; category: string; type: string; date: string }) {
    store.addExpense(
      createExpenseFromForm({
        id: `exp-${Date.now()}`,
        title: value.title,
        description: value.description,
        amount: Number(value.amount),
        category: value.category as never,
        type: value.type as never,
        date: value.date
      })
    );
    setShowAddExpense(false);
  }

  function handleEditExpense(value: { title: string; description: string; amount: string; category: string; type: string; date: string }) {
    if (!editingId) {
      return;
    }
    store.updateExpense(editingId, {
      title: value.title,
      description: value.description,
      amount: Number(value.amount),
      category: value.category as never,
      type: value.type as never,
      date: value.date,
      month: monthFromDate(value.date)
    });
    setEditingId(null);
    setShowEditExpense(false);
  }

  function openEdit(id: string) {
    setEditingId(id);
    setShowEditExpense(true);
  }

  const editingExpense = store.expenses.find((expense) => expense.id === editingId) ?? null;

  return (
    <View style={{ flex: 1, backgroundColor: "#0B0F17" }}>
      <TelemetryHeader
        online={online}
        hydrated={store._hasHydrated}
        biometricEnabled={store.biometricEnabled}
        accountLabel={`Account ${store.accountId}`}
        onToggleOnline={() => setOnline((value) => !value)}
        onToggleBiometric={() => store.setBiometricEnabled(!store.biometricEnabled)}
        onAddExpense={() => setShowAddExpense(true)}
        onApplyDraft={() => store.applyDraft("draft-fixed", "2026-08", "2026-08-15")}
        onPdfExport={() => setShowPdf(true)}
        onLock={() => setBiometricLocked(true)}
      />

      <ScrollView contentContainerStyle={{ padding: 20, gap: 20 }}>
        <View style={{ gap: 16 }}>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 16 }}>
            <View style={{ flex: 1, minWidth: 220 }}>
              <MetricTile label="Total Monthly Income" value={formatCurrency(snapshot.income)} tag="FIRESTORE AGG" delta="+8.4%" note="vs previous month" tone="positive" />
            </View>
            <View style={{ flex: 1, minWidth: 220 }}>
              <MetricTile label="Total Expenses" value={formatCurrency(snapshot.expenses)} tag="LOCKED CACHE" delta="-3.1%" note={`${snapshot.transactionCount} transactions logged`} tone="negative" />
            </View>
            <View style={{ flex: 1, minWidth: 220 }}>
              <MetricTile label="Net Cashflow Velocity" value={formatCurrency(snapshot.netCashflow)} tag="REALTIME" delta="66.4%" note="savings velocity rate" tone="positive" />
            </View>
            <View style={{ flex: 1, minWidth: 220 }}>
              <MetricTile label="Active Loans Liabilities" value={formatCurrency(snapshot.activeLoans)} tag="BATCH INCREMENT" delta="68.0%" note="repaid ($6,800 paid of $10K)" tone="accent" />
            </View>
          </View>

          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 20, alignItems: "flex-start" }}>
            <View style={{ flex: 1, minWidth: 340, gap: 20, backgroundColor: "#141A24", borderWidth: 1, borderColor: "#222C3D", borderRadius: 14, padding: 20 }}>
              <View style={{ gap: 16 }}>
                <KineticCashflowChart period={period} points={series} />
                <View style={{ flexDirection: "row", gap: 8 }}>
                  <Pressable onPress={() => setPeriod("monthly")} style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 4, backgroundColor: period === "monthly" ? "#1C2433" : "#0B0F17" }}>
                    <Text style={{ color: "#F8FAFC", fontSize: 11, fontWeight: "600" }}>Monthly</Text>
                  </Pressable>
                  <Pressable onPress={() => setPeriod("quarterly")} style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 4, backgroundColor: period === "quarterly" ? "#1C2433" : "#0B0F17" }}>
                    <Text style={{ color: "#F8FAFC", fontSize: 11, fontWeight: "600" }}>Quarterly</Text>
                  </Pressable>
                </View>
              </View>

              <CategoryBreakdown categories={snapshot.categories} total={snapshot.expenses} />

              <DraftCards
                drafts={store.drafts}
                onApply={(draftId) => store.applyDraft(draftId, "2026-08", "2026-08-15")}
                onLoanLog={() => setShowLoan(true)}
              />

              <View style={{ gap: 10 }}>
                <Text style={{ color: "#64748B", fontSize: 12, fontWeight: "700", textTransform: "uppercase" }}>Savings Goal Progress</Text>
                {store.savingGoals.map((goal) => {
                  const ratio = Math.min(1, goal.savedAmount / goal.targetAmount);
                  return (
                    <View key={goal.id} style={{ gap: 6 }}>
                      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                        <Text style={{ color: "#F8FAFC", fontSize: 12 }}>{goal.purpose}</Text>
                        <Text style={{ color: "#94A3B8", fontFamily: "JetBrains Mono", fontSize: 11 }}>{Math.round(ratio * 100)}%</Text>
                      </View>
                      <View style={{ height: 6, borderRadius: 3, backgroundColor: "#1C2433" }}>
                        <View style={{ width: `${ratio * 100}%`, height: "100%", backgroundColor: "#10B981", borderRadius: 3 }} />
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>

            <View style={{ flex: 1.35, minWidth: 420, gap: 20, backgroundColor: "#141A24", borderWidth: 1, borderColor: "#222C3D", borderRadius: 14, padding: 20 }}>
              <View style={{ gap: 10 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                  <Text style={{ color: "#F8FAFC", fontSize: 15, fontWeight: "700" }}>Transactional Expense Ledger</Text>
                  <Text style={{ color: "#94A3B8", fontFamily: "JetBrains Mono", fontSize: 10, borderWidth: 1, borderColor: "#222C3D", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 }}>
                    ATOMIC WRITEBATCH
                  </Text>
                </View>
                <LedgerTable rows={rows} search={search} category={category} onSearchChange={setSearch} onCategoryChange={setCategory} onEdit={openEdit} onDelete={(id) => store.deleteExpense(id)} />
              </View>

              <View style={{ gap: 10 }}>
                <Text style={{ color: "#64748B", fontSize: 12, fontWeight: "700", textTransform: "uppercase" }}>Loan & Savings Modules</Text>
                <View style={{ gap: 10 }}>
                  <View style={{ backgroundColor: "#1C2433", borderWidth: 1, borderColor: "#222C3D", borderRadius: 10, padding: 14 }}>
                    <Text style={{ color: "#F8FAFC", fontSize: 13, fontWeight: "600" }}>Loan Repayment Drawer</Text>
                    <Text style={{ color: "#94A3B8", fontSize: 11, marginTop: 2 }}>Atomic increment updates the parent loan balance and status.</Text>
                  </View>
                  <View style={{ backgroundColor: "#1C2433", borderWidth: 1, borderColor: "#222C3D", borderRadius: 10, padding: 14 }}>
                    <Text style={{ color: "#F8FAFC", fontSize: 13, fontWeight: "600" }}>Expense Draft Sync</Text>
                    <Text style={{ color: "#94A3B8", fontSize: 11, marginTop: 2 }}>{summarizeDraftProgress()}</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      <BiometricOverlay locked={biometricLocked} onAuthenticate={() => setBiometricLocked(false)} />

      <ExpenseFormModal
        visible={showAddExpense}
        title="New Atomic Ledger Entry"
        onClose={() => setShowAddExpense(false)}
        onSubmit={handleAddExpense}
      />

      <ExpenseFormModal
        visible={showEditExpense}
        title="Edit Ledger Entry"
        initialValue={
          editingExpense
            ? {
                title: editingExpense.title,
                description: editingExpense.description,
                amount: String(editingExpense.amount),
                category: editingExpense.category,
                type: editingExpense.type,
                date: editingExpense.date
              }
            : undefined
        }
        onClose={() => setShowEditExpense(false)}
        onSubmit={handleEditExpense}
      />

      <PdfExportModal
        visible={showPdf}
        previewHtml={previewHtml}
        onClose={() => setShowPdf(false)}
        onExport={async () => {
          await exportMonthlyStatement(snapshot, "2026-08");
          setShowPdf(false);
        }}
      />

      <ModalFrame visible={showLoan} title="Log Loan Repayment" onClose={() => setShowLoan(false)}>
        <View style={{ gap: 12 }}>
          <Text style={{ color: "#94A3B8", fontSize: 12 }}>
            This action uses writeBatch() plus increment() in the service layer to update the expense and loan records atomically.
          </Text>
          <Pressable
            onPress={() => {
              const loan = store.loans[0];
              if (loan) {
                store.logLoanRepayment({ loanId: loan.id, amount: 400, expenseId: `loan-exp-${Date.now()}` });
              }
              setShowLoan(false);
            }}
            style={{ paddingHorizontal: 12, paddingVertical: 10, backgroundColor: "#F59E0B", borderRadius: 6, alignSelf: "flex-end" }}
          >
            <Text style={{ color: "#0B0F17", fontWeight: "700" }}>Log $400</Text>
          </Pressable>
        </View>
      </ModalFrame>
    </View>
  );
}
