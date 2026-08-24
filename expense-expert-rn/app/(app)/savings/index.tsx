import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSavings } from '../../../src/features/savings/hooks/useSavings';
import { BankAccountCard } from '../../../src/features/savings/components/BankAccountCard';
import { SavingGoalCard } from '../../../src/features/savings/components/SavingGoalCard';
import { QuickSaveModal } from '../../../src/features/savings/components/QuickSaveModal';
import { AddGoalModal } from '../../../src/features/savings/components/AddGoalModal';
import { AddBankAccountModal } from '../../../src/features/savings/components/AddBankAccountModal';
import { SavingGoal, BankAccount, SavingEntryType } from '../../../src/features/savings/types/saving.types';
import { MonthNavigator } from '../../../src/features/dashboard/components/MonthNavigator';
import { colors } from '../../../src/theme';

export default function SavingsScreen() {
  const router = useRouter();
  const {
    bankAccounts,
    goals,
    entries,
    isLoading,
    activeMonth,
    setActiveMonth,
    addBankAccount,
    deleteBankAccount,
    addGoal,
    deleteGoal,
    addEntry,
  } = useSavings();

  // Modals state
  const [showAddBank, setShowAddBank] = useState(false);
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [quickSaveGoal, setQuickSaveGoal] = useState<SavingGoal | null>(null);
  const [quickSaveType, setQuickSaveType] = useState<SavingEntryType>('deposit');

  // Filter goals active in the selected month
  const activeGoals = goals.filter(
    (g) => g.startMonth <= activeMonth && g.endMonth >= activeMonth
  );

  const totalSavedAcrossGoals = goals.reduce((acc, g) => acc + (g.savedAmount || 0), 0);
  const totalTargetAcrossGoals = goals.reduce((acc, g) => acc + (g.targetAmount || 0), 0);

  // Month entries
  const monthEntries = entries.filter((e) => e.month === activeMonth);

  const handleDeposit = (goal: SavingGoal) => {
    setQuickSaveGoal(goal);
    setQuickSaveType('deposit');
  };

  const handleWithdraw = (goal: SavingGoal) => {
    setQuickSaveGoal(goal);
    setQuickSaveType('withdrawal');
  };

  return (
    <ScrollView
      testID="savings-screen"
      style={styles.screen}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={true}
    >
      <View style={styles.container}>
        {/* Header Navigation */}
        <View style={styles.headerRow}>
          <View style={styles.headerTitles}>
            <Text style={styles.headerTitle}>🏦 Savings & Goals</Text>
            <Text style={styles.headerSubtitle}>
              Manage bank accounts, set targets, and track emergency funds
            </Text>
          </View>

          <View style={styles.headerActions}>
            <TouchableOpacity
              testID="add-bank-account-btn"
              onPress={() => setShowAddBank(true)}
              style={styles.secondaryActionBtn}
              accessibilityRole="button"
            >
              <Text style={styles.secondaryActionBtnText}>+ Bank Account</Text>
            </TouchableOpacity>

            <TouchableOpacity
              testID="add-saving-goal-btn"
              onPress={() => setShowAddGoal(true)}
              style={styles.primaryActionBtn}
              accessibilityRole="button"
            >
              <Text style={styles.primaryActionBtnText}>+ Saving Goal</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Month Navigator */}
        <MonthNavigator
          activeMonth={activeMonth}
          onChangeMonth={setActiveMonth}
        />

        {/* Total Savings Overview Card */}
        <View style={styles.overviewCard} testID="savings-overview-card">
          <View style={styles.overviewRow}>
            <View>
              <Text style={styles.overviewLabel}>Total Accumulated Savings</Text>
              <Text style={styles.overviewAmount} testID="total-saved-amount">
                ${totalSavedAcrossGoals.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Text>
            </View>
            <View style={styles.targetCol}>
              <Text style={styles.overviewLabel}>Total Target</Text>
              <Text style={styles.overviewTarget}>
                ${totalTargetAcrossGoals.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Text>
            </View>
          </View>
        </View>

        {isLoading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginVertical: 32 }} />
        ) : (
          <>
            {/* Bank Accounts Section */}
            <View style={styles.section} testID="bank-accounts-section">
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Connected Bank Accounts</Text>
                <Text style={styles.sectionCount}>({bankAccounts.length})</Text>
              </View>

              {bankAccounts.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyIcon}>🏦</Text>
                  <Text style={styles.emptyTitle}>No Bank Accounts Linked</Text>
                  <Text style={styles.emptySubtext}>
                    Add your checking, high-yield savings, or money market accounts to link with your saving goals.
                  </Text>
                  <TouchableOpacity
                    onPress={() => setShowAddBank(true)}
                    style={styles.emptyBtn}
                  >
                    <Text style={styles.emptyBtnText}>+ Add First Account</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.bankGrid}>
                  {bankAccounts.map((acc) => (
                    <BankAccountCard
                      key={acc.id}
                      account={acc}
                      onDelete={(a) => deleteBankAccount(a.id)}
                    />
                  ))}
                </View>
              )}
            </View>

            {/* Saving Goals Section */}
            <View style={styles.section} testID="saving-goals-section">
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>
                  Active Goals for {activeMonth}
                </Text>
                <Text style={styles.sectionCount}>({activeGoals.length})</Text>
              </View>

              {activeGoals.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyIcon}>🎯</Text>
                  <Text style={styles.emptyTitle}>No Active Goals for this Month</Text>
                  <Text style={styles.emptySubtext}>
                    Create a saving goal (e.g. Vacation, New Home, Emergency Fund) to track and deposit towards your targets.
                  </Text>
                  <TouchableOpacity
                    onPress={() => setShowAddGoal(true)}
                    style={styles.emptyBtn}
                  >
                    <Text style={styles.emptyBtnText}>+ Create Saving Goal</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                activeGoals.map((goal) => {
                  const linkedBank = bankAccounts.find((b) => b.id === goal.bankAccountId);
                  return (
                    <SavingGoalCard
                      key={goal.id}
                      goal={goal}
                      bankAccountName={linkedBank ? `${linkedBank.bankName} (${linkedBank.accountName})` : undefined}
                      onDeposit={handleDeposit}
                      onWithdraw={handleWithdraw}
                      onDelete={(g) => deleteGoal(g.id)}
                    />
                  );
                })
              )}
            </View>

            {/* Monthly Entries History Section */}
            <View style={styles.section} testID="saving-history-section">
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>
                  Saving Activity in {activeMonth}
                </Text>
                <Text style={styles.sectionCount}>({monthEntries.length})</Text>
              </View>

              {monthEntries.length === 0 ? (
                <View style={styles.emptyHistoryCard}>
                  <Text style={styles.emptyHistoryText}>No deposits or withdrawals recorded in {activeMonth}.</Text>
                </View>
              ) : (
                <View style={styles.historyList}>
                  {monthEntries.map((entry) => {
                    const goal = goals.find((g) => g.id === entry.goalId);
                    const isDeposit = entry.type === 'deposit';
                    return (
                      <View key={entry.id} style={styles.historyRow} testID={`saving-entry-${entry.id}`}>
                        <View style={styles.historyLeft}>
                          <View
                            style={[
                              styles.historyBadge,
                              isDeposit ? styles.historyBadgeDeposit : styles.historyBadgeWithdraw,
                            ]}
                          >
                            <Text style={styles.historyBadgeIcon}>{isDeposit ? '💰' : '💸'}</Text>
                          </View>
                          <View>
                            <Text style={styles.historyGoalName}>{goal?.purpose || 'Saving Goal'}</Text>
                            <Text style={styles.historyDate}>{entry.date} {entry.note ? `• ${entry.note}` : ''}</Text>
                          </View>
                        </View>
                        <Text
                          style={[
                            styles.historyAmount,
                            isDeposit ? styles.historyAmountDeposit : styles.historyAmountWithdraw,
                          ]}
                        >
                          {isDeposit ? '+' : '-'}${entry.amount.toFixed(2)}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          </>
        )}
      </View>

      {/* Modals */}
      <QuickSaveModal
        visible={!!quickSaveGoal}
        goal={quickSaveGoal}
        initialType={quickSaveType}
        onClose={() => setQuickSaveGoal(null)}
        onSubmit={async (data) => {
          await addEntry(data);
        }}
      />

      <AddGoalModal
        visible={showAddGoal}
        bankAccounts={bankAccounts}
        onClose={() => setShowAddGoal(false)}
        onSubmit={async (dto) => {
          await addGoal(dto);
        }}
      />

      <AddBankAccountModal
        visible={showAddBank}
        onClose={() => setShowAddBank(false)}
        onSubmit={async (dto) => {
          await addBankAccount(dto);
        }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 160,
    alignItems: 'center',
  },
  container: {
    width: '100%',
    maxWidth: 960,
    gap: 20,
  },
  headerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  headerTitles: {
    flex: 1,
    minWidth: 280,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0f172a',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  secondaryActionBtn: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  },
  secondaryActionBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  primaryActionBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 12,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 4px 12px rgba(79, 70, 229, 0.25)', cursor: 'pointer' }
      : { elevation: 2 }),
  },
  primaryActionBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
  overviewCard: {
    backgroundColor: '#ffffff',
    borderRadius: 22,
    padding: 22,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 4px 16px rgba(15, 23, 42, 0.05)' }
      : { elevation: 2 }),
  },
  overviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  overviewLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 4,
  },
  overviewAmount: {
    fontSize: 26,
    fontWeight: '900',
    color: '#059669',
  },
  targetCol: {
    alignItems: 'flex-end',
  },
  overviewTarget: {
    fontSize: 18,
    fontWeight: '700',
    color: '#334155',
  },
  section: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  sectionCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94a3b8',
  },
  bankGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  emptyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 28,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyIcon: {
    fontSize: 32,
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
  },
  emptySubtext: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    maxWidth: 420,
  },
  emptyBtn: {
    marginTop: 8,
    backgroundColor: '#eff6ff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  emptyBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2563eb',
  },
  emptyHistoryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  emptyHistoryText: {
    fontSize: 13,
    color: '#94a3b8',
  },
  historyList: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  historyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  historyBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyBadgeDeposit: {
    backgroundColor: '#ecfdf5',
  },
  historyBadgeWithdraw: {
    backgroundColor: '#fff1f2',
  },
  historyBadgeIcon: {
    fontSize: 16,
  },
  historyGoalName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  historyDate: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  historyAmount: {
    fontSize: 15,
    fontWeight: '800',
  },
  historyAmountDeposit: {
    color: '#059669',
  },
  historyAmountWithdraw: {
    color: '#e11d48',
  },
});
