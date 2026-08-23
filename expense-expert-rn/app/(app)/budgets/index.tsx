import React, { useState } from 'react';
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
import { useBudgets } from '../../../src/features/budgets/hooks/useBudgets';
import { BudgetSummaryCard } from '../../../src/features/budgets/components/BudgetSummaryCard';
import { CategoryBudgetCard } from '../../../src/features/budgets/components/CategoryBudgetCard';
import { SetBudgetModal } from '../../../src/features/budgets/components/SetBudgetModal';
import { BudgetUsage, SetBudgetDto } from '../../../src/features/budgets/types/budget.types';

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
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-900" testID="budgets-screen">
      {/* Screen Header */}
      <View className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700/60 px-5 py-4 flex-row items-center justify-between">
        <View className="flex-row items-center">
          <TouchableOpacity
            testID="back-to-dashboard-btn"
            onPress={() => router.replace('/')}
            accessibilityRole="button"
            accessibilityLabel="Back to Dashboard"
            className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-700 items-center justify-center mr-3 active:opacity-75"
          >
            <Text className="text-slate-700 dark:text-slate-200 font-bold text-lg">←</Text>
          </TouchableOpacity>
          <View>
            <Text className="text-xl font-extrabold text-slate-900 dark:text-white">
              Monthly Budgets
            </Text>
            <Text className="text-xs text-slate-500 dark:text-slate-400">
              Track category limits & spending
            </Text>
          </View>
        </View>

        <TouchableOpacity
          testID="open-set-budget-btn"
          onPress={handleOpenCreateModal}
          accessibilityRole="button"
          accessibilityLabel="Set category budget"
          className="bg-indigo-600 active:bg-indigo-700 px-3.5 py-2 rounded-xl shadow-sm flex-row items-center"
        >
          <Text className="text-white font-bold text-xs">+ Set Budget</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, alignItems: 'center' }}
        className="flex-1"
        showsVerticalScrollIndicator={false}
      >
        <View className="w-full max-w-lg space-y-4">
          {/* Month Selector Carousel / Navigation */}
          <View
            testID="month-selector"
            className="w-full bg-white dark:bg-slate-800 rounded-2xl p-3.5 flex-row items-center justify-between border border-slate-100 dark:border-slate-700 shadow-xs mb-1"
          >
            <TouchableOpacity
              testID="prev-month-btn"
              onPress={handlePrevMonth}
              accessibilityRole="button"
              accessibilityLabel="Previous month"
              className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-700 items-center justify-center active:opacity-70"
            >
              <Text className="text-slate-700 dark:text-slate-300 font-bold text-base">‹</Text>
            </TouchableOpacity>

            <View className="items-center">
              <Text
                testID="current-month-display"
                className="text-base font-extrabold text-slate-900 dark:text-white"
              >
                {formatMonthDisplay(activeMonth)}
              </Text>
              <Text className="text-[11px] font-medium text-slate-400">
                {activeMonth}
              </Text>
            </View>

            <TouchableOpacity
              testID="next-month-btn"
              onPress={handleNextMonth}
              accessibilityRole="button"
              accessibilityLabel="Next month"
              className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-700 items-center justify-center active:opacity-70"
            >
              <Text className="text-slate-700 dark:text-slate-300 font-bold text-base">›</Text>
            </TouchableOpacity>
          </View>

          {/* Budget Summary Card */}
          <BudgetSummaryCard
            summary={summary}
            activeMonth={activeMonth}
            onAddBudget={handleOpenCreateModal}
          />

          {/* Category Budgets List Section */}
          <View className="w-full">
            <View className="flex-row items-center justify-between mb-3 px-1">
              <Text className="text-base font-bold text-slate-900 dark:text-white">
                Category Limits
              </Text>
              <Text className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {budgetUsages.length} {budgetUsages.length === 1 ? 'category' : 'categories'}
              </Text>
            </View>

            {isLoading && budgetUsages.length === 0 ? (
              <View className="py-12 items-center justify-center">
                <ActivityIndicator size="small" color="#6366f1" />
              </View>
            ) : budgetUsages.length === 0 ? (
              <View
                testID="empty-budgets-view"
                className="w-full bg-white dark:bg-slate-800 rounded-3xl p-8 items-center justify-center border border-dashed border-slate-200 dark:border-slate-700"
              >
                <Text className="text-4xl mb-2">🎯</Text>
                <Text className="text-base font-bold text-slate-800 dark:text-slate-200 text-center mb-1">
                  No budgets set for this month
                </Text>
                <Text className="text-xs text-slate-500 dark:text-slate-400 text-center max-w-xs mb-5">
                  Set spending limits for your categories to keep your expenses on track.
                </Text>
                <TouchableOpacity
                  testID="empty-set-budget-btn"
                  onPress={handleOpenCreateModal}
                  className="bg-indigo-600 active:bg-indigo-700 px-5 py-2.5 rounded-xl shadow-sm"
                >
                  <Text className="text-white font-bold text-xs">+ Set Your First Budget</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View testID="category-budgets-list" className="space-y-3">
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
