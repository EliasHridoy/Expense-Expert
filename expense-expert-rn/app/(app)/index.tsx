import React, { useContext, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { format } from 'date-fns';
import { useAuth } from '../../src/features/auth/hooks/useAuth';
import { useExpenses } from '../../src/features/expenses/hooks/useExpenses';
import { CategoryContext } from '../../src/features/categories/context/CategoryContext';
import { BudgetContext } from '../../src/features/budgets/context/BudgetContext';
import { DashboardContext } from '../../src/features/dashboard/context/DashboardContext';
import { MonthNavigator } from '../../src/features/dashboard/components/MonthNavigator';
import { SummaryCardsGrid } from '../../src/features/dashboard/components/SummaryCardsGrid';
import { CategoryDonutChart } from '../../src/features/dashboard/components/CategoryDonutChart';
import { MonthlyTrendBarChart } from '../../src/features/dashboard/components/MonthlyTrendBarChart';
import { ActionShortcuts } from '../../src/features/dashboard/components/ActionShortcuts';
import { OfflineSyncBanner } from '../../src/features/expenses/components/OfflineSyncBanner';
import { ExpenseListHeader } from '../../src/features/expenses/components/ExpenseListHeader';
import { BudgetProgressBar } from '../../src/features/budgets/components/BudgetProgressBar';
import { useTransactionFilters } from '../../src/features/expenses/hooks/useTransactionFilters';
import { BUILTIN_CATEGORY_ICONS } from '../../src/features/expenses/types/category.types';
import { formatCents } from '../../src/features/expenses/utils/currency.util';
import { formatDisplayDate } from '../../src/features/expenses/utils/date.util';
import { getThresholdColor } from '../../src/features/budgets/utils/budget.util';
import { MonthSummary } from '../../src/features/dashboard/types/dashboard.types';

export default function AppDashboardScreen() {
  const router = useRouter();
  const { user, profile, logout } = useAuth();
  const {
    expenses,
    pendingSyncCount,
    isOnline,
    isSyncing,
    syncQueue,
  } = useExpenses();

  const categoryContext = useContext(CategoryContext);
  const budgetContext = useContext(BudgetContext);
  const dashboardContext = useContext(DashboardContext);

  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const defaultMonth = useMemo(() => format(new Date(), 'yyyy-MM'), []);
  const activeMonth = dashboardContext?.activeMonth ?? defaultMonth;
  const setActiveMonth = dashboardContext?.setActiveMonth ?? (() => {});

  const currentSummary: MonthSummary = useMemo(() => {
    if (dashboardContext?.summary) {
      return dashboardContext.summary;
    }
    // Calculate fallback summary directly from expenses for the active month
    const monthExpenses = expenses.filter((e) => e.month === activeMonth);
    const totalExpCents = monthExpenses.reduce((sum, e) => sum + e.amountInCents, 0);

    return {
      month: activeMonth,
      totalIncomeInCents: 0,
      totalIncome: 0,
      currentMonthIncomeInCents: 0,
      currentMonthIncome: 0,
      previousMonthRemainingInCents: 0,
      previousMonthRemaining: 0,
      totalExpensesInCents: totalExpCents,
      totalExpenses: totalExpCents / 100,
      totalSavingsInCents: 0,
      totalSavings: 0,
      remainingInCents: -totalExpCents,
      remaining: -totalExpCents / 100,
      loansTakenIncomeInCents: 0,
      loansTakenIncome: 0,
      expenseCount: monthExpenses.length,
    };
  }, [dashboardContext?.summary, expenses, activeMonth]);

  const trends = dashboardContext?.trends ?? [];
  const breakdowns = dashboardContext?.breakdowns ?? [];

  const displayName =
    profile?.displayName ||
    user?.displayName ||
    user?.email?.split('@')[0] ||
    'User';

  const getCategoryIcon = (categoryValue: string) => {
    if (categoryContext?.categories) {
      const match = categoryContext.categories.find(
        (c) => c.value.toLowerCase() === categoryValue.toLowerCase()
      );
      if (match?.icon) return match.icon;
    }
    return BUILTIN_CATEGORY_ICONS[categoryValue] || '📁';
  };

  const getCategoryLabel = (categoryValue: string) => {
    if (categoryContext?.categories) {
      const match = categoryContext.categories.find(
        (c) => c.value.toLowerCase() === categoryValue.toLowerCase()
      );
      if (match?.label) return match.label;
    }
    return categoryValue;
  };

  const {
    criteria,
    viewMode,
    filteredExpenses,
    groupedExpenses,
    totalFilteredCents,
    filteredCount,
    setCategory,
    setDateRange,
    setCustomDateRange,
    setSearchQuery,
    setSortBy,
    setGroupBy,
    toggleViewMode,
    resetFilters,
  } = useTransactionFilters(expenses, undefined, getCategoryLabel);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
      setIsLoggingOut(false);
    }
  };

  return (
    <SafeAreaView
      style={{ flex: 1, minHeight: '100%' }}
      className="flex-1 bg-slate-50 dark:bg-slate-900"
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, alignItems: 'center', minHeight: '100%', flexGrow: 1 }}
        className="flex-1"
        showsVerticalScrollIndicator={false}
      >
        <View className="w-full max-w-6xl gap-y-6">
          {/* Section 1: Header & User Details */}
          <View className="w-full bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700">
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-row items-center gap-3">
                <View
                  testID="app-brand-badge"
                  className="items-center justify-center h-12 w-12 rounded-xl bg-indigo-600 shadow-md"
                >
                  <Text className="text-white font-bold text-lg">EE</Text>
                </View>
                <View>
                  <Text className="text-xl font-bold text-slate-900 dark:text-slate-100">
                    Welcome, {displayName}!
                  </Text>
                  <Text className="text-xs text-slate-500 dark:text-slate-400">
                    Expense Expert Dashboard
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                testID="logout-button"
                onPress={handleLogout}
                disabled={isLoggingOut}
                activeOpacity={0.8}
                className="rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 px-3 py-1.5"
                accessibilityRole="button"
                accessibilityLabel="Sign out"
              >
                {isLoggingOut ? (
                  <ActivityIndicator size="small" color="#dc2626" testID="logout-loading" />
                ) : (
                  <Text className="text-xs font-semibold text-red-600 dark:text-red-400">
                    Sign out
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            {/* User Info Details Badge */}
            <View className="w-full bg-slate-50 dark:bg-slate-700/50 rounded-xl p-3.5 border border-slate-200 dark:border-slate-600">
              <Text className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Account Details
              </Text>
              <View className="flex-row justify-between items-center py-0.5">
                <Text className="text-xs text-slate-500 dark:text-slate-400">Email:</Text>
                <Text
                  testID="user-email-text"
                  className="text-xs font-medium text-slate-900 dark:text-slate-100"
                >
                  {user?.email || 'N/A'}
                </Text>
              </View>
              <View className="flex-row justify-between items-center py-0.5">
                <Text className="text-xs text-slate-500 dark:text-slate-400">Name:</Text>
                <Text
                  testID="user-name-text"
                  className="text-xs font-medium text-slate-900 dark:text-slate-100"
                >
                  {displayName}
                </Text>
              </View>
              <View className="flex-row justify-between items-center py-0.5">
                <Text className="text-xs text-slate-500 dark:text-slate-400">UID:</Text>
                <Text
                  testID="user-uid-text"
                  className="text-[11px] font-mono text-slate-600 dark:text-slate-300 max-w-[200px]"
                  numberOfLines={1}
                  ellipsizeMode="middle"
                >
                  {user?.uid || 'N/A'}
                </Text>
              </View>
            </View>
          </View>

          {/* Section 1b: Month Switcher */}
          <MonthNavigator
            activeMonth={activeMonth}
            onChangeMonth={setActiveMonth}
          />

          {/* Section 2: Offline Sync Banner */}
          <OfflineSyncBanner
            pendingCount={pendingSyncCount}
            isOnline={isOnline}
            onSyncNow={syncQueue}
          />

          {/* Section 3: Summary Metrics Grid */}
          <SummaryCardsGrid
            summary={currentSummary}
            onPressCard={(_cardKey) => {
              // Quick jump to relevant views
            }}
          />

          {/* Section 4: Visualizations Grid (Desktop 2-Col / Mobile Stack) */}
          <View className="w-full flex-col lg:flex-row gap-6">
            <View className="flex-1">
              <CategoryDonutChart
                data={breakdowns}
                onSelectCategory={(cat) => setCategory(cat)}
              />
            </View>
            <View className="flex-1">
              <MonthlyTrendBarChart
                trends={trends}
              />
            </View>
          </View>

          {/* Section 5: Action Shortcuts & Compact Budget Progress Widget */}
          <ActionShortcuts
            onAddExpense={() => router.push('/expenses/new')}
            onNavigateBudgets={() => router.push('/budgets')}
            onNavigateCategories={() => router.push('/categories')}
          />

          {budgetContext && (
            <View
              testID="dashboard-budget-widget"
              className="w-full bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-700"
            >
              <View className="flex-row items-center justify-between mb-3">
                <View className="flex-row items-center gap-2">
                  <Text className="text-base font-bold text-slate-900 dark:text-white">
                    Monthly Budget
                  </Text>
                  <Text className="text-xs text-slate-400 font-medium">
                    {budgetContext.activeMonth}
                  </Text>
                </View>
                <TouchableOpacity
                  testID="nav-budgets-widget-btn"
                  onPress={() => router.push('/budgets')}
                  accessibilityRole="button"
                  accessibilityLabel="View Budgets"
                  className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/50"
                >
                  <Text className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                    Manage →
                  </Text>
                </TouchableOpacity>
              </View>

              {budgetContext.summary.totalLimitInCents > 0 ? (
                <View>
                  <View className="flex-row justify-between items-baseline mb-2">
                    <View>
                      <Text className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">
                        Spent
                      </Text>
                      <Text className="text-base font-bold text-slate-900 dark:text-white">
                        {formatCents(budgetContext.summary.totalSpentInCents)}
                      </Text>
                    </View>
                    <View className="items-center">
                      <Text className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">
                        Limit
                      </Text>
                      <Text className="text-base font-bold text-slate-700 dark:text-slate-300">
                        {formatCents(budgetContext.summary.totalLimitInCents)}
                      </Text>
                    </View>
                    <View className="items-end">
                      <Text className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">
                        {budgetContext.summary.thresholdState === 'exceeded' ? 'Over' : 'Remaining'}
                      </Text>
                      <Text
                        className={`text-base font-bold ${
                          getThresholdColor(budgetContext.summary.thresholdState).textColor
                        }`}
                      >
                        {budgetContext.summary.thresholdState === 'exceeded'
                          ? `-${formatCents(Math.abs(budgetContext.summary.totalRemainingInCents))}`
                          : formatCents(budgetContext.summary.totalRemainingInCents)}
                      </Text>
                    </View>
                  </View>

                  <BudgetProgressBar
                    percentage={budgetContext.summary.percentage}
                    thresholdState={budgetContext.summary.thresholdState}
                    showLabel={true}
                    heightClass="h-2.5"
                  />
                </View>
              ) : (
                <View className="py-1 flex-row items-center justify-between">
                  <Text className="text-xs text-slate-500 dark:text-slate-400">
                    No budget set for this month.
                  </Text>
                  <TouchableOpacity
                    testID="widget-set-budget-btn"
                    onPress={() => router.push('/budgets')}
                    className="px-3 py-1.5 rounded-xl bg-indigo-600 active:bg-indigo-700"
                  >
                    <Text className="text-xs font-bold text-white">+ Set Budget</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

          {/* Section 6: Recent Transactions */}
          <View className="w-full bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-base font-bold text-slate-900 dark:text-slate-100">
                Recent Transactions
              </Text>
              {isSyncing ? (
                <View className="flex-row items-center gap-1.5">
                  <ActivityIndicator size="small" color="#6366f1" />
                  <Text className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                    Syncing...
                  </Text>
                </View>
              ) : (
                <Text className="text-xs text-slate-500 dark:text-slate-400">
                  {expenses.length} {expenses.length === 1 ? 'record' : 'records'}
                </Text>
              )}
            </View>

            {expenses.length === 0 ? (
              <View
                testID="empty-expenses-message"
                className="py-8 items-center justify-center px-4"
              >
                <Text className="text-3xl mb-2">🧾</Text>
                <Text className="text-sm font-semibold text-slate-700 dark:text-slate-300 text-center mb-1">
                  No expenses recorded yet
                </Text>
                <Text className="text-xs text-slate-500 dark:text-slate-400 text-center mb-4">
                  Tap '+ Add Expense' to log your first transaction.
                </Text>
                <TouchableOpacity
                  testID="empty-add-expense-btn"
                  onPress={() => router.push('/expenses/new')}
                  className="rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 px-4 py-2"
                >
                  <Text className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                    + Add First Expense
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View>
                {/* Search & Multi-criteria Filtering Header */}
                <ExpenseListHeader
                  criteria={criteria}
                  viewMode={viewMode}
                  totalFilteredCents={totalFilteredCents}
                  filteredCount={filteredCount}
                  onSelectCategory={setCategory}
                  onSelectPreset={setDateRange}
                  onCustomDateChange={setCustomDateRange}
                  onSearchChange={setSearchQuery}
                  onSelectSortBy={setSortBy}
                  onSelectGroupBy={setGroupBy}
                  onToggleViewMode={toggleViewMode}
                  onResetFilters={resetFilters}
                />

                {/* Filter Results Content */}
                {filteredExpenses.length === 0 ? (
                  <View
                    testID="empty-filtered-expenses"
                    className="py-8 items-center justify-center px-4 mt-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-700"
                  >
                    <Text className="text-2xl mb-1">🔍</Text>
                    <Text className="text-sm font-semibold text-slate-700 dark:text-slate-300 text-center mb-1">
                      No matching transactions found
                    </Text>
                    <Text className="text-xs text-slate-500 dark:text-slate-400 text-center mb-3">
                      Try adjusting your category, date, or search filter.
                    </Text>
                    <TouchableOpacity
                      testID="reset-filters-empty-btn"
                      onPress={resetFilters}
                      className="rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 px-3.5 py-1.5"
                    >
                      <Text className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                        Reset Filters
                      </Text>
                    </TouchableOpacity>
                  </View>
                ) : criteria.groupBy !== 'none' ? (
                  /* Grouped View */
                  <View className="gap-y-4 mt-3" testID="grouped-expenses-list">
                    {groupedExpenses.map((group) => (
                      <View key={group.key} className="gap-y-2">
                        {/* Group Header */}
                        <View className="flex-row items-center justify-between px-1 pt-2 border-b border-slate-200 dark:border-slate-700 pb-1">
                          <Text className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                            {group.title}
                          </Text>
                          <Text className="text-xs font-bold text-slate-900 dark:text-white">
                            {formatCents(group.totalInCents)}
                          </Text>
                        </View>

                        {/* Group Items */}
                        <View className="gap-y-2">
                          {group.items.map((expense) => {
                            const icon = getCategoryIcon(expense.category);
                            const isPending = expense.syncStatus === 'pending';
                            return (
                              <Pressable
                                key={expense.id}
                                testID={`expense-item-${expense.id}`}
                                onPress={() => router.push(`/expenses/${expense.id}`)}
                                className="flex-row items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-700/40 active:bg-slate-100 dark:active:bg-slate-700/70 border border-slate-100 dark:border-slate-700/60"
                              >
                                <View className="flex-row items-center flex-1 mr-3">
                                  <View className="h-10 w-10 rounded-xl bg-white dark:bg-slate-800 items-center justify-center mr-3 shadow-xs border border-slate-200/50 dark:border-slate-700">
                                    <Text className="text-lg">{icon}</Text>
                                  </View>
                                  <View className="flex-1">
                                    <Text
                                      numberOfLines={1}
                                      className="text-sm font-semibold text-slate-900 dark:text-slate-100"
                                    >
                                      {expense.title}
                                    </Text>
                                    <Text className="text-xs text-slate-500 dark:text-slate-400">
                                      {formatDisplayDate(expense.date)}
                                    </Text>
                                  </View>
                                </View>

                                <View className="items-end">
                                  <Text className="text-sm font-bold text-slate-900 dark:text-slate-100">
                                    {formatCents(expense.amountInCents)}
                                  </Text>
                                  {isPending ? (
                                    <View
                                      testID={`expense-pending-badge-${expense.id}`}
                                      className="bg-amber-100 dark:bg-amber-950/60 rounded px-1.5 py-0.5 mt-0.5"
                                    >
                                      <Text className="text-[10px] font-semibold text-amber-700 dark:text-amber-300">
                                        Pending
                                      </Text>
                                    </View>
                                  ) : null}
                                </View>
                              </Pressable>
                            );
                          })}
                        </View>
                      </View>
                    ))}
                  </View>
                ) : viewMode === 'grid' ? (
                  /* Flat Grid View */
                  <View
                    testID="recent-expenses-list"
                    className="flex-row flex-wrap justify-between gap-y-3 mt-3"
                  >
                    {filteredExpenses.map((expense) => {
                      const icon = getCategoryIcon(expense.category);
                      const isPending = expense.syncStatus === 'pending';
                      return (
                        <Pressable
                          key={expense.id}
                          testID={`expense-item-${expense.id}`}
                          onPress={() => router.push(`/expenses/${expense.id}`)}
                          className="w-[48%] bg-slate-50 dark:bg-slate-700/40 active:bg-slate-100 dark:active:bg-slate-700/70 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-700/60 justify-between"
                        >
                          <View className="flex-row items-center justify-between mb-2">
                            <View className="h-9 w-9 rounded-xl bg-white dark:bg-slate-800 items-center justify-center border border-slate-200/50 dark:border-slate-700">
                              <Text className="text-base">{icon}</Text>
                            </View>
                            {isPending && (
                              <View
                                testID={`expense-pending-badge-${expense.id}`}
                                className="bg-amber-100 dark:bg-amber-950/60 rounded px-1.5 py-0.5"
                              >
                                <Text className="text-[9px] font-semibold text-amber-700 dark:text-amber-300">
                                  Pending
                                </Text>
                              </View>
                            )}
                          </View>
                          <View>
                            <Text
                              numberOfLines={1}
                              className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-0.5"
                            >
                              {expense.title}
                            </Text>
                            <Text className="text-[11px] text-slate-500 dark:text-slate-400 mb-2">
                              {formatDisplayDate(expense.date)}
                            </Text>
                            <Text className="text-sm font-extrabold text-slate-900 dark:text-white">
                              {formatCents(expense.amountInCents)}
                            </Text>
                          </View>
                        </Pressable>
                      );
                    })}
                  </View>
                ) : (
                  /* Flat List View */
                  <View className="gap-y-3 mt-3" testID="recent-expenses-list">
                    {filteredExpenses.map((expense) => {
                      const icon = getCategoryIcon(expense.category);
                      const isPending = expense.syncStatus === 'pending';

                      return (
                        <Pressable
                          key={expense.id}
                          testID={`expense-item-${expense.id}`}
                          onPress={() => router.push(`/expenses/${expense.id}`)}
                          className="flex-row items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-700/40 active:bg-slate-100 dark:active:bg-slate-700/70 border border-slate-100 dark:border-slate-700/60"
                        >
                          <View className="flex-row items-center flex-1 mr-3">
                            <View className="h-10 w-10 rounded-xl bg-white dark:bg-slate-800 items-center justify-center mr-3 shadow-xs border border-slate-200/50 dark:border-slate-700">
                              <Text className="text-lg">{icon}</Text>
                            </View>
                            <View className="flex-1">
                              <Text
                                numberOfLines={1}
                                className="text-sm font-semibold text-slate-900 dark:text-slate-100"
                              >
                                {expense.title}
                              </Text>
                              <Text className="text-xs text-slate-500 dark:text-slate-400">
                                {formatDisplayDate(expense.date)}
                              </Text>
                            </View>
                          </View>

                          <View className="items-end">
                            <Text className="text-sm font-bold text-slate-900 dark:text-slate-100">
                              {formatCents(expense.amountInCents)}
                            </Text>
                            {isPending ? (
                              <View
                                testID={`expense-pending-badge-${expense.id}`}
                                className="bg-amber-100 dark:bg-amber-950/60 rounded px-1.5 py-0.5 mt-0.5"
                              >
                                <Text className="text-[10px] font-semibold text-amber-700 dark:text-amber-300">
                                  Pending
                                </Text>
                              </View>
                            ) : null}
                          </View>
                        </Pressable>
                      );
                    })}
                  </View>
                )}
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
