import React, { useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
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
    <View testID={testID} style={styles.formContainer} className="w-full max-w-lg mx-auto pb-4">
      {/* Header Navigation */}
      <View style={styles.navHeader} className="flex-row items-center justify-between mb-6 px-1">
        <View style={styles.navHeaderLeft} className="flex-row items-center gap-3">
          {currentStep > 1 ? (
            <Pressable
              testID="expense-back-btn"
              accessibilityRole="button"
              accessibilityLabel="Go back to previous step"
              onPress={handlePrevious}
              style={styles.circleBtn}
              className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 active:bg-slate-200 dark:active:bg-slate-700"
            >
              <Text style={styles.circleBtnText} className="text-base text-slate-700 dark:text-slate-300">←</Text>
            </Pressable>
          ) : null}
          <View>
            <Text style={styles.formTitle} className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {isEditMode ? 'Edit Expense' : 'Add Expense'}
            </Text>
            <Text style={styles.stepBadgeText} className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
              Step {currentStep} of 3
            </Text>
          </View>
        </View>

        <Pressable
          testID="expense-cancel-btn"
          accessibilityRole="button"
          accessibilityLabel="Cancel expense entry"
          onPress={handleClose}
          style={styles.circleBtn}
          className="p-2 rounded-full active:bg-slate-100 dark:active:bg-slate-800"
        >
          <Text style={styles.closeIcon} className="text-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            ✕
          </Text>
        </Pressable>
      </View>

      {/* 3-Step Progress Indicator */}
      <View style={styles.progressRow} className="flex-row gap-2 mb-6 px-1">
        {[1, 2, 3].map((step) => (
          <View
            key={step}
            testID={`progress-step-${step}`}
            style={[
              styles.progressBar,
              currentStep >= step ? styles.progressBarActive : styles.progressBarInactive,
            ]}
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
          style={styles.errorBanner}
          className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/50 rounded-2xl p-4 mb-4"
        >
          <Text style={styles.errorText} className="text-xs font-semibold text-rose-600 dark:text-rose-400 text-center">
            {errorMessage}
          </Text>
        </View>
      ) : null}

      {/* STEP 1: Amount & Category */}
      {currentStep === 1 ? (
        <View testID="expense-step-1" style={styles.stepContainer} className="gap-y-6">
          <View style={styles.stepHeader} className="items-center mb-2">
            <Text style={styles.stepTitle} className="text-xl font-bold text-slate-900 dark:text-white">
              How much did you spend?
            </Text>
            <Text style={styles.stepSubtitle} className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Enter the amount and pick a category.
            </Text>
          </View>

          <AmountInput
            value={amount}
            onChangeText={setAmount}
            testID="expense-amount-input"
          />

          <View style={styles.pickerSection} className="gap-y-3">
            <Text style={styles.inputLabel} className="text-sm font-medium text-slate-700 dark:text-slate-300">
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
        <View testID="expense-step-2" style={styles.stepContainer} className="gap-y-6">
          <View style={styles.stepHeader} className="items-center mb-2">
            <Text style={styles.stepTitle} className="text-xl font-bold text-slate-900 dark:text-white">
              What was it for?
            </Text>
            <Text style={styles.stepSubtitle} className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Enter a title and select the date.
            </Text>
          </View>

          <View style={styles.cardContainer} className="gap-y-5 bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-700/50">
            <View>
              <Text style={styles.inputLabel} className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Title
              </Text>
              <TextInput
                testID="expense-title-input"
                value={title}
                onChangeText={setTitle}
                placeholder="e.g., Grocery shopping"
                placeholderTextColor="#94a3b8"
                style={styles.textInput}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-slate-100 px-4 py-3 text-sm outline-none"
              />

              {/* Title Suggestions */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.suggestionsScroll}
                className="mt-3"
                contentContainerStyle={{ gap: 8 }}
              >
                {TITLE_SUGGESTIONS.map((suggestion) => (
                  <Pressable
                    key={suggestion}
                    testID={`suggestion-pill-${suggestion}`}
                    onPress={() => setTitle(suggestion)}
                    style={styles.suggestionPill}
                    className="rounded-full bg-slate-100 dark:bg-slate-700 px-3 py-1.5 active:bg-slate-200 dark:active:bg-slate-600"
                  >
                    <Text style={styles.suggestionText} className="text-xs font-medium text-slate-600 dark:text-slate-300">
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
        <View testID="expense-step-3" style={styles.stepContainer} className="gap-y-6">
          <View style={styles.stepHeader} className="items-center mb-2">
            <Text style={styles.stepTitle} className="text-xl font-bold text-slate-900 dark:text-white">
              Almost done!
            </Text>
            <Text style={styles.stepSubtitle} className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Add any extra details.
            </Text>
          </View>

          <View style={styles.cardContainer} className="gap-y-5 bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-700/50">
            <View>
              <Text style={styles.inputLabel} className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
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
                style={[styles.textInput, { minHeight: 80, height: 80 }]}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-slate-100 px-4 py-3 text-sm outline-none min-h-[80px]"
              />
            </View>

            {/* Review Summary Card */}
            <View
              testID="expense-summary-card"
              style={styles.reviewCard}
              className="bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800"
            >
              <Text style={styles.reviewHeader} className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
                Summary
              </Text>
              <View style={styles.reviewRow} className="flex-row justify-between items-center mb-2">
                <Text
                  testID="expense-summary-title"
                  numberOfLines={1}
                  style={styles.reviewTitle}
                  className="text-sm font-medium text-slate-700 dark:text-slate-300 flex-1 mr-2"
                >
                  {title || 'Untitled'}
                </Text>
                <Text
                  testID="expense-summary-amount"
                  style={styles.reviewAmount}
                  className="text-base font-bold text-slate-900 dark:text-white"
                >
                  {formatCents(toCents(amount))}
                </Text>
              </View>
              <View style={styles.reviewFooter} className="flex-row justify-between items-center text-xs text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200/50 dark:border-slate-800">
                <Text testID="expense-summary-category" style={styles.reviewSub} className="text-xs text-slate-500 dark:text-slate-400">
                  {selectedCategoryMeta.icon} {selectedCategoryMeta.label}
                </Text>
                <Text testID="expense-summary-date" style={styles.reviewSub} className="text-xs text-slate-500 dark:text-slate-400">
                  {formatDisplayDate(date)}
                </Text>
              </View>
            </View>
          </View>
        </View>
      ) : null}

      {/* Sticky / Bottom Action Bar */}
      <View style={styles.actionSection} className="mt-8 pt-4">
        {currentStep < 3 ? (
          <Pressable
            testID="expense-continue-btn"
            accessibilityRole="button"
            accessibilityState={{ disabled: !canProceed }}
            disabled={!canProceed}
            onPress={handleNext}
            style={[
              styles.continueBtn,
              !canProceed && styles.btnDisabled,
            ]}
            className={`w-full rounded-2xl py-4 items-center justify-center shadow-lg transition-all active:scale-[0.98] ${
              canProceed
                ? 'bg-indigo-600 dark:bg-indigo-500 shadow-indigo-500/30'
                : 'bg-slate-300 dark:bg-slate-700 opacity-60 shadow-none'
            }`}
          >
            <Text style={styles.btnText} className="text-base font-bold text-white">Continue</Text>
          </Pressable>
        ) : (
          <Pressable
            testID="expense-submit-btn"
            accessibilityRole="button"
            accessibilityState={{ disabled: !canProceed || isSubmitting }}
            disabled={!canProceed || isSubmitting}
            onPress={handleSubmit}
            style={[
              styles.submitBtn,
              (!canProceed || isSubmitting) && styles.btnDisabled,
            ]}
            className={`w-full rounded-2xl py-4 items-center justify-center shadow-lg transition-all active:scale-[0.98] ${
              !canProceed || isSubmitting
                ? 'bg-slate-300 dark:bg-slate-700 opacity-60 shadow-none'
                : 'bg-emerald-600 dark:bg-emerald-500 shadow-emerald-500/30'
            }`}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#ffffff" testID="expense-submit-spinner" />
            ) : (
              <Text style={styles.btnText} className="text-base font-bold text-white">
                {isEditMode ? 'Update Expense' : 'Save Expense'}
              </Text>
            )}
          </Pressable>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  formContainer: {
    width: '100%',
    maxWidth: 540,
    alignSelf: 'center',
    paddingBottom: 32,
  },
  navHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  navHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  circleBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  },
  circleBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#334155',
  },
  formTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
  },
  closeIcon: {
    fontSize: 16,
    fontWeight: '700',
    color: '#94a3b8',
  },
  progressRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  progressBar: {
    height: 6,
    flex: 1,
    borderRadius: 9999,
  },
  progressBarActive: {
    backgroundColor: '#4f46e5',
  },
  progressBarInactive: {
    backgroundColor: '#e2e8f0',
  },
  errorBanner: {
    backgroundColor: '#fff1f2',
    borderWidth: 1,
    borderColor: '#fecdd3',
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
  },
  errorText: {
    color: '#e11d48',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  stepContainer: {
    gap: 20,
  },
  stepHeader: {
    alignItems: 'center',
    marginBottom: 8,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'center',
  },
  stepSubtitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 4,
    textAlign: 'center',
  },
  pickerSection: {
    gap: 10,
    marginTop: 8,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
  },
  cardContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 18,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 4px 16px rgba(15, 23, 42, 0.05)' }
      : {
          shadowColor: '#0f172a',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.05,
          shadowRadius: 10,
          elevation: 2,
        }),
  },
  textInput: {
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: '#0f172a',
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : {}),
  },
  suggestionsScroll: {
    marginTop: 10,
  },
  suggestionPill: {
    backgroundColor: '#f1f5f9',
    borderRadius: 9999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginRight: 8,
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  },
  suggestionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  reviewCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginTop: 8,
  },
  reviewHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  reviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  reviewAmount: {
    fontSize: 18,
    fontWeight: '800',
    color: '#059669',
  },
  reviewFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  stepBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4f46e5',
    marginTop: 2,
  },
  actionSection: {
    marginTop: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'web' ? 12 : 8,
    width: '100%',
    ...(Platform.OS === 'web'
      ? {
          position: 'sticky' as any,
          bottom: 16,
          zIndex: 30,
          backgroundColor: 'rgba(248, 250, 252, 0.95)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          paddingHorizontal: 8,
          borderRadius: 20,
          borderWidth: 1,
          borderColor: 'rgba(226, 232, 240, 0.8)',
          boxShadow: '0 4px 16px rgba(15, 23, 42, 0.08)',
        }
      : {}),
  },
  continueBtn: {
    width: '100%',
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4f46e5',
    ...(Platform.OS === 'web'
      ? {
          boxShadow: '0 6px 20px rgba(79, 70, 229, 0.35)',
          cursor: 'pointer',
          userSelect: 'none',
        }
      : {
          shadowColor: '#4f46e5',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 3,
        }),
  },
  submitBtn: {
    width: '100%',
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    ...(Platform.OS === 'web'
      ? {
          boxShadow: '0 6px 20px rgba(5, 150, 105, 0.35)',
          cursor: 'pointer',
          userSelect: 'none',
        }
      : {
          shadowColor: '#059669',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 3,
        }),
  },
  btnDisabled: {
    backgroundColor: '#94a3b8',
    opacity: 0.7,
    ...(Platform.OS === 'web'
      ? {
          cursor: 'not-allowed',
          boxShadow: 'none',
        }
      : {
          elevation: 0,
        }),
  } as any,
  btnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.3,
  },
});
