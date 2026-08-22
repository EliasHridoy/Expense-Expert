import React, { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useExpenses } from '../hooks/useExpenses';
import { AmountInput } from './AmountInput';
import { CategoryCardPicker } from './CategoryCardPicker';
import { DateSelector } from './DateSelector';
import { Expense } from '../types/expense.types';
import { ExpenseCategory, EXPENSE_CATEGORIES } from '../types/category.types';
import { formatCents, fromCents, toCents } from '../utils/currency.util';
import { formatDisplayDate, toDateInputValue } from '../utils/date.util';

export interface ExpenseFormProps {
  initialData?: Partial<Expense>;
  onSuccess?: (expense: Expense) => void;
  onCancel?: () => void;
  testID?: string;
}

const TITLE_SUGGESTIONS = [
  'Grocery',
  'Coffee',
  'Transport',
  'Utilities',
  'Shopping',
  'Dinner',
  'Medicine',
];

/**
 * 3-step transaction entry wizard form matching the Angular application workflow.
 */
export const ExpenseForm: React.FC<ExpenseFormProps> = ({
  initialData,
  onSuccess,
  onCancel,
  testID = 'expense-form',
}) => {
  let router: any;
  try {
    router = useRouter();
  } catch {
    router = null;
  }

  const { addExpense, updateExpense } = useExpenses();

  const isEditMode = Boolean(initialData?.id);
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [amount, setAmount] = useState<string>(
    initialData?.amount != null ? String(initialData.amount) : ''
  );
  const [category, setCategory] = useState<string>(
    initialData?.category || ExpenseCategory.Food
  );
  const [title, setTitle] = useState<string>(initialData?.title || '');
  const [date, setDate] = useState<string>(
    initialData?.date
      ? toDateInputValue(initialData.date)
      : toDateInputValue(new Date())
  );
  const [description, setDescription] = useState<string>(
    initialData?.description || ''
  );
  const [isLoan, setIsLoan] = useState<boolean>(initialData?.isLoan || false);
  const [loanPersonId, setLoanPersonId] = useState<string | null>(
    initialData?.loanPersonId || null
  );
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const canProceedStep1 = toCents(amount) > 0 && Boolean(category);
  const canProceedStep2 = title.trim().length > 0 && Boolean(date);
  const canProceed =
    currentStep === 1
      ? canProceedStep1
      : currentStep === 2
      ? canProceedStep2
      : canProceedStep1 && canProceedStep2;

  const handleNext = () => {
    if (currentStep === 1 && canProceedStep1) {
      setCurrentStep(2);
    } else if (currentStep === 2 && canProceedStep2) {
      setCurrentStep(3);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as 1 | 2 | 3);
    }
  };

  const handleClose = () => {
    if (onCancel) {
      onCancel();
    } else if (router?.back) {
      router.back();
    }
  };

  const handleSubmit = async () => {
    if (!canProceed || isSubmitting) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const dto = {
        title: title.trim(),
        description: description.trim() || undefined,
        amount: fromCents(toCents(amount)),
        category,
        date: new Date(date + 'T00:00:00.000Z').toISOString(),
        isLoan,
        loanPersonId: isLoan ? loanPersonId : null,
      };

      let savedExpense: Expense;

      if (isEditMode && initialData?.id) {
        await updateExpense(initialData.id, dto);
        savedExpense = {
          ...initialData,
          ...dto,
          id: initialData.id,
          amountInCents: toCents(amount),
          month: date.slice(0, 7),
          updatedAt: new Date().toISOString(),
        } as Expense;
      } else {
        savedExpense = await addExpense(dto);
      }

      if (onSuccess) {
        onSuccess(savedExpense);
      } else if (router?.back) {
        router.back();
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to save expense');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Find category icon and label for summary card
  const selectedCategoryMeta = EXPENSE_CATEGORIES.find(
    (c) => c.value === category
  ) || { label: category, icon: '📁' };

  return (
    <View testID={testID} className="flex-1 max-w-lg mx-auto w-full pb-8">
      {/* Header Navigation */}
      <View className="flex-row items-center justify-between mb-6 px-1">
        <View className="flex-row items-center gap-3">
          {currentStep > 1 ? (
            <Pressable
              testID="expense-back-btn"
              accessibilityRole="button"
              accessibilityLabel="Go back to previous step"
              onPress={handlePrevious}
              className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 active:bg-slate-200 dark:active:bg-slate-700"
            >
              <Text className="text-base text-slate-700 dark:text-slate-300">←</Text>
            </Pressable>
          ) : null}
          <Text className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {isEditMode ? 'Edit Expense' : 'Add Expense'}
          </Text>
        </View>

        <Pressable
          testID="expense-cancel-btn"
          accessibilityRole="button"
          accessibilityLabel="Cancel expense entry"
          onPress={handleClose}
          className="p-2 rounded-full active:bg-slate-100 dark:active:bg-slate-800"
        >
          <Text className="text-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            ✕
          </Text>
        </Pressable>
      </View>

      {/* 3-Step Progress Indicator */}
      <View className="flex-row gap-2 mb-6 px-1">
        {[1, 2, 3].map((step) => (
          <View
            key={step}
            testID={`progress-step-${step}`}
            className={`h-1.5 flex-1 rounded-full ${
              currentStep >= step
                ? 'bg-indigo-600 dark:bg-indigo-500'
                : 'bg-slate-200 dark:bg-slate-700'
            }`}
          />
        ))}
      </View>

      {/* Error Banner */}
      {errorMessage ? (
        <View
          testID="expense-form-error"
          className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/50 rounded-2xl p-4 mb-4"
        >
          <Text className="text-xs font-semibold text-rose-600 dark:text-rose-400 text-center">
            {errorMessage}
          </Text>
        </View>
      ) : null}

      {/* STEP 1: Amount & Category */}
      {currentStep === 1 ? (
        <View testID="expense-step-1" className="space-y-6">
          <View className="items-center mb-2">
            <Text className="text-xl font-bold text-slate-900 dark:text-white">
              How much did you spend?
            </Text>
            <Text className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Enter the amount and pick a category.
            </Text>
          </View>

          <AmountInput
            value={amount}
            onChangeText={setAmount}
            testID="expense-amount-input"
          />

          <View className="space-y-3">
            <Text className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Category
            </Text>
            <CategoryCardPicker
              selectedValue={category}
              onSelect={setCategory}
              testID="expense-category-picker"
            />
          </View>
        </View>
      ) : null}

      {/* STEP 2: Title & Date */}
      {currentStep === 2 ? (
        <View testID="expense-step-2" className="space-y-6">
          <View className="items-center mb-2">
            <Text className="text-xl font-bold text-slate-900 dark:text-white">
              What was it for?
            </Text>
            <Text className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Enter a title and select the date.
            </Text>
          </View>

          <View className="space-y-5 bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-700/50">
            <View>
              <Text className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Title
              </Text>
              <TextInput
                testID="expense-title-input"
                value={title}
                onChangeText={setTitle}
                placeholder="e.g., Grocery shopping"
                placeholderTextColor="#94a3b8"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-slate-100 px-4 py-3 text-sm outline-none"
              />

              {/* Title Suggestions */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                className="mt-3"
                contentContainerStyle={{ gap: 8 }}
              >
                {TITLE_SUGGESTIONS.map((suggestion) => (
                  <Pressable
                    key={suggestion}
                    testID={`suggestion-pill-${suggestion}`}
                    onPress={() => setTitle(suggestion)}
                    className="rounded-full bg-slate-100 dark:bg-slate-700 px-3 py-1.5 active:bg-slate-200 dark:active:bg-slate-600"
                  >
                    <Text className="text-xs font-medium text-slate-600 dark:text-slate-300">
                      {suggestion}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>

            <DateSelector
              value={date}
              onChange={setDate}
              testID="expense-date-selector"
            />
          </View>
        </View>
      ) : null}

      {/* STEP 3: Details & Summary */}
      {currentStep === 3 ? (
        <View testID="expense-step-3" className="space-y-6">
          <View className="items-center mb-2">
            <Text className="text-xl font-bold text-slate-900 dark:text-white">
              Almost done!
            </Text>
            <Text className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Add any extra details.
            </Text>
          </View>

          <View className="space-y-5 bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-700/50">
            <View>
              <Text className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Note (Optional)
              </Text>
              <TextInput
                testID="expense-description-input"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
                placeholder="Add more details..."
                placeholderTextColor="#94a3b8"
                textAlignVertical="top"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-slate-100 px-4 py-3 text-sm outline-none min-h-[80px]"
              />
            </View>

            {/* Review Summary Card */}
            <View
              testID="expense-summary-card"
              className="bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800"
            >
              <Text className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
                Summary
              </Text>
              <View className="flex-row justify-between items-center mb-2">
                <Text
                  testID="expense-summary-title"
                  numberOfLines={1}
                  className="text-sm font-medium text-slate-700 dark:text-slate-300 flex-1 mr-2"
                >
                  {title || 'Untitled'}
                </Text>
                <Text
                  testID="expense-summary-amount"
                  className="text-base font-bold text-slate-900 dark:text-white"
                >
                  {formatCents(toCents(amount))}
                </Text>
              </View>
              <View className="flex-row justify-between items-center text-xs text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200/50 dark:border-slate-800">
                <Text testID="expense-summary-category" className="text-xs text-slate-500 dark:text-slate-400">
                  {selectedCategoryMeta.icon} {selectedCategoryMeta.label}
                </Text>
                <Text testID="expense-summary-date" className="text-xs text-slate-500 dark:text-slate-400">
                  {formatDisplayDate(date)}
                </Text>
              </View>
            </View>
          </View>
        </View>
      ) : null}

      {/* Sticky / Bottom Action Bar */}
      <View className="mt-8 pt-4">
        {currentStep < 3 ? (
          <Pressable
            testID="expense-continue-btn"
            accessibilityRole="button"
            accessibilityState={{ disabled: !canProceed }}
            disabled={!canProceed}
            onPress={handleNext}
            className={`w-full rounded-2xl py-4 items-center justify-center shadow-lg transition-all active:scale-[0.98] ${
              canProceed
                ? 'bg-indigo-600 dark:bg-indigo-500 shadow-indigo-500/30'
                : 'bg-slate-300 dark:bg-slate-700 opacity-60 shadow-none'
            }`}
          >
            <Text className="text-base font-bold text-white">Continue</Text>
          </Pressable>
        ) : (
          <Pressable
            testID="expense-submit-btn"
            accessibilityRole="button"
            accessibilityState={{ disabled: !canProceed || isSubmitting }}
            disabled={!canProceed || isSubmitting}
            onPress={handleSubmit}
            className={`w-full rounded-2xl py-4 items-center justify-center shadow-lg transition-all active:scale-[0.98] ${
              !canProceed || isSubmitting
                ? 'bg-slate-300 dark:bg-slate-700 opacity-60 shadow-none'
                : 'bg-emerald-600 dark:bg-emerald-500 shadow-emerald-500/30'
            }`}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#ffffff" testID="expense-submit-spinner" />
            ) : (
              <Text className="text-base font-bold text-white">
                {isEditMode ? 'Update Expense' : 'Save Expense'}
              </Text>
            )}
          </Pressable>
        )}
      </View>
    </View>
  );
};
