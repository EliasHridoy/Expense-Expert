import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useCategories } from '../../categories/hooks/useCategories';
import { AmountInput } from '../../expenses/components/AmountInput';
import { CategoryCardPicker } from '../../expenses/components/CategoryCardPicker';
import { toCents } from '../../expenses/utils/currency.util';
import { SetBudgetDto } from '../types/budget.types';

export interface SetBudgetModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (dto: SetBudgetDto) => Promise<void>;
  initialBudget?: { category: string; limit: number; month?: string } | null;
  activeMonth: string;
  testID?: string;
}

/**
 * Modal form for creating and editing monthly category budgets.
 */
export const SetBudgetModal: React.FC<SetBudgetModalProps> = ({
  visible,
  onClose,
  onSave,
  initialBudget,
  activeMonth,
  testID = 'set-budget-modal',
}) => {
  const { customCategories, categories } = useCategories();
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [limitAmount, setLimitAmount] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      if (initialBudget) {
        setSelectedCategory(initialBudget.category);
        setLimitAmount(initialBudget.limit > 0 ? initialBudget.limit.toString() : '');
      } else {
        setSelectedCategory(categories[0]?.value || 'food');
        setLimitAmount('');
      }
      setError(null);
    }
  }, [visible, initialBudget, categories]);

  const handleSave = async () => {
    if (!selectedCategory) {
      setError('Please select a category');
      return;
    }

    const cents = toCents(limitAmount);
    if (cents <= 0) {
      setError('Please enter a budget limit greater than $0.00');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onSave({
        category: selectedCategory,
        month: initialBudget?.month || activeMonth,
        limit: limitAmount,
      });
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save budget';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setError(null);
    onClose();
  };

  return (
    <Modal
      testID={testID}
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View className="flex-1 bg-black/60 justify-end sm:justify-center items-center p-0 sm:p-4">
        <View className="w-full sm:max-w-lg max-h-[90%] bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl flex-col">
          {/* Header */}
          <View className="flex-row items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
            <Text className="text-xl font-bold text-slate-900 dark:text-white">
              {initialBudget ? 'Edit Category Budget' : 'Set Category Budget'}
            </Text>
            <Pressable
              testID="close-budget-modal-btn"
              accessibilityRole="button"
              accessibilityLabel="Close modal"
              onPress={handleClose}
              className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 items-center justify-center"
            >
              <Text className="text-slate-600 dark:text-slate-300 font-bold text-base">✕</Text>
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            className="flex-1 my-4"
            contentContainerStyle={{ paddingBottom: 16 }}
          >
            {/* Target Month Info */}
            <View className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 mb-4 flex-row items-center justify-between">
              <Text className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Target Month
              </Text>
              <Text className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                {initialBudget?.month || activeMonth}
              </Text>
            </View>

            {/* Limit Input */}
            <View className="mb-6">
              <AmountInput
                testID="budget-limit-input"
                value={limitAmount}
                onChangeText={(val) => {
                  setLimitAmount(val);
                  if (error) setError(null);
                }}
              />
            </View>

            {/* Category Selector */}
            <View className="mb-6">
              <Text className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2.5">
                Select Category
              </Text>
              <CategoryCardPicker
                testID="budget-category-picker"
                selectedValue={selectedCategory}
                onSelect={(cat) => {
                  setSelectedCategory(cat);
                  if (error) setError(null);
                }}
                customCategories={customCategories}
              />
            </View>

            {/* Error Message */}
            {error && (
              <Text
                testID="budget-modal-error"
                className="text-sm font-medium text-rose-600 dark:text-rose-400 text-center mb-4"
              >
                {error}
              </Text>
            )}

            {/* Submit Button */}
            <Pressable
              testID="save-budget-btn"
              accessibilityRole="button"
              onPress={handleSave}
              disabled={isSubmitting}
              className="bg-indigo-600 active:bg-indigo-700 rounded-2xl py-3.5 items-center justify-center flex-row shadow-sm"
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text className="text-white font-bold text-base">
                  {initialBudget ? 'Update Budget' : 'Save Budget'}
                </Text>
              )}
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};
