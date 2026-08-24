import React, { useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useBudgets } from '../../../src/features/budgets/hooks/useBudgets';
import { BudgetSummaryCard } from '../../../src/features/budgets/components/BudgetSummaryCard';
import { CategoryBudgetCard } from '../../../src/features/budgets/components/CategoryBudgetCard';
import { SetBudgetModal } from '../../../src/features/budgets/components/SetBudgetModal';
import { BudgetUsage, SetBudgetDto } from '../../../src/features/budgets/types/budget.types';
import { colors } from '../../../src/theme';

export default function BudgetsScreen() {
  const router = useRouter();
  const {
    activeMonth,
    setActiveMonth,
    budgetUsages,
    summary,
    isLoading,
    setBudget,
    deleteBudget,
  } = useBudgets();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<{
    category: string;
    limit: number;
    month?: string;
  } | null>(null);

  // Month navigation helpers
  const handlePrevMonth = () => {
    const [year, month] = activeMonth.split('-').map(Number);
    const date = new Date(year, month - 2, 1);
    const nextKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    setActiveMonth(nextKey);
  };

  const handleNextMonth = () => {
    const [year, month] = activeMonth.split('-').map(Number);
    const date = new Date(year, month, 1);
    const nextKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    setActiveMonth(nextKey);
  };

  const formatMonthDisplay = (monthStr: string) => {
    try {
      const [year, month] = monthStr.split('-').map(Number);
      const date = new Date(year, month - 1, 1);
      return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    } catch {
      return monthStr;
    }
  };

  const handleOpenCreateModal = () => {
    setEditingBudget(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (usage: BudgetUsage) => {
    setEditingBudget({
      category: usage.category,
      limit: usage.limit,
      month: usage.month,
    });
    setIsModalOpen(true);
  };

  const handleSaveBudget = async (dto: SetBudgetDto) => {
    await setBudget(dto);
  };

  const handleDeleteBudget = async (budgetId: string) => {
    await deleteBudget(budgetId);
  };

  return (
    <SafeAreaView
      style={styles.screen}
      className="flex-1 bg-slate-50 dark:bg-slate-900"
      testID="budgets-screen"
    >
      {/* Screen Header */}
      <View style={styles.header} className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700/60 px-5 py-4 flex-row items-center justify-between">
        <View style={styles.headerLeft} className="flex-row items-center">
          <TouchableOpacity
            testID="back-to-dashboard-btn"
            onPress={() => router.replace('/')}
            accessibilityRole="button"
            accessibilityLabel="Back to Dashboard"
            style={styles.backBtn}
            className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-700 items-center justify-center mr-3 active:opacity-75"
          >
            <Text style={styles.backBtnText} className="text-slate-700 dark:text-slate-200 font-bold text-lg">←</Text>
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle} className="text-xl font-extrabold text-slate-900 dark:text-white">
              Monthly Budgets
            </Text>
            <Text style={styles.headerSubtitle} className="text-xs text-slate-500 dark:text-slate-400">
              Track category limits & spending
            </Text>
          </View>
        </View>

        <TouchableOpacity
          testID="open-set-budget-btn"
          onPress={handleOpenCreateModal}
          accessibilityRole="button"
          accessibilityLabel="Set category budget"
          style={styles.setBudgetBtn}
          className="bg-indigo-600 active:bg-indigo-700 px-3.5 py-2 rounded-xl shadow-sm flex-row items-center"
        >
          <Text style={styles.setBudgetBtnText} className="text-white font-bold text-xs">+ Set Budget</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        className="flex-1"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container} className="w-full max-w-lg gap-y-4">
          {/* Month Selector Carousel / Navigation */}
          <View
            testID="month-selector"
            style={styles.monthSelector}
            className="w-full bg-white dark:bg-slate-800 rounded-2xl p-3.5 flex-row items-center justify-between border border-slate-100 dark:border-slate-700 shadow-xs mb-1"
          >
            <TouchableOpacity
              testID="prev-month-btn"
              onPress={handlePrevMonth}
              accessibilityRole="button"
              accessibilityLabel="Previous month"
              style={styles.arrowBtn}
              className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-700 items-center justify-center active:opacity-70"
            >
              <Text style={styles.arrowBtnText} className="text-slate-700 dark:text-slate-300 font-bold text-base">‹</Text>
            </TouchableOpacity>

            <View style={{ alignItems: 'center' }}>
              <Text
                testID="current-month-display"
                style={styles.monthName}
                className="text-base font-extrabold text-slate-900 dark:text-white"
              >
                {formatMonthDisplay(activeMonth)}
              </Text>
              <Text style={styles.monthKey} className="text-[11px] font-medium text-slate-400">
                {activeMonth}
              </Text>
            </View>

            <TouchableOpacity
              testID="next-month-btn"
              onPress={handleNextMonth}
              accessibilityRole="button"
              accessibilityLabel="Next month"
              style={styles.arrowBtn}
              className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-700 items-center justify-center active:opacity-70"
            >
              <Text style={styles.arrowBtnText} className="text-slate-700 dark:text-slate-300 font-bold text-base">›</Text>
            </TouchableOpacity>
          </View>

          {/* Budget Summary Card */}
          <BudgetSummaryCard
            summary={summary}
            activeMonth={activeMonth}
            onAddBudget={handleOpenCreateModal}
          />

          {/* Category Budgets List Section */}
          <View style={{ width: '100%' }}>
            <View style={styles.listHeader} className="flex-row items-center justify-between mb-3 px-1">
              <Text style={styles.listTitle} className="text-base font-bold text-slate-900 dark:text-white">
                Category Limits
              </Text>
              <Text style={styles.listCount} className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {budgetUsages.length} {budgetUsages.length === 1 ? 'category' : 'categories'}
              </Text>
            </View>

            {isLoading && budgetUsages.length === 0 ? (
              <View style={styles.loadingBox} className="py-12 items-center justify-center">
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            ) : budgetUsages.length === 0 ? (
              <View
                testID="empty-budgets-view"
                style={styles.emptyCard}
                className="w-full bg-white dark:bg-slate-800 rounded-3xl p-8 items-center justify-center border border-dashed border-slate-200 dark:border-slate-700"
              >
                <Text style={styles.emptyIcon} className="text-4xl mb-2">🎯</Text>
                <Text style={styles.emptyTitle} className="text-base font-bold text-slate-800 dark:text-slate-200 text-center mb-1">
                  No budgets set for this month
                </Text>
                <Text style={styles.emptySubtitle} className="text-xs text-slate-500 dark:text-slate-400 text-center max-w-xs mb-5">
                  Set spending limits for your categories to keep your expenses on track.
                </Text>
                <TouchableOpacity
                  testID="empty-set-budget-btn"
                  onPress={handleOpenCreateModal}
                  style={styles.emptySetBtn}
                  className="bg-indigo-600 active:bg-indigo-700 px-5 py-2.5 rounded-xl shadow-sm"
                >
                  <Text style={styles.emptySetBtnText} className="text-white font-bold text-xs">+ Set Your First Budget</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View testID="category-budgets-list" style={styles.listContainer} className="gap-y-3">
                {budgetUsages.map((usage) => (
                  <CategoryBudgetCard
                    key={usage.budgetId}
                    usage={usage}
                    onEdit={handleOpenEditModal}
                    onDelete={handleDeleteBudget}
                  />
                ))}
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Set / Edit Budget Modal */}
      <SetBudgetModal
        visible={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingBudget(null);
        }}
        onSave={handleSaveBudget}
        initialBudget={editingBudget}
        activeMonth={activeMonth}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    minHeight: '100%',
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  },
  backBtnText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#334155',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  setBudgetBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 2px 8px rgba(79, 70, 229, 0.25)', cursor: 'pointer' }
      : {
          shadowColor: colors.primary,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 4,
          elevation: 2,
        }),
  },
  setBudgetBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 12,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    alignItems: 'center',
    minHeight: '100%',
    flexGrow: 1,
  },
  container: {
    width: '100%',
    maxWidth: 600,
    gap: 16,
  },
  monthSelector: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 8,
    width: '100%',
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)' }
      : {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.04,
          shadowRadius: 4,
          elevation: 1,
        }),
  },
  arrowBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  },
  arrowBtnText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#334155',
  },
  monthName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  monthKey: {
    fontSize: 11,
    fontWeight: '500',
    color: '#94a3b8',
    marginTop: 2,
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  listCount: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  loadingBox: {
    paddingVertical: 48,
    alignItems: 'center',
  },
  emptyCard: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
  },
  emptyIcon: {
    fontSize: 36,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 20,
    maxWidth: 280,
  },
  emptySetBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  },
  emptySetBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
  },
  listContainer: {
    gap: 12,
  },
});
