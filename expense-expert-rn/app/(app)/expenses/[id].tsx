import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View, ScrollView, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useExpenses } from '../../../src/features/expenses/hooks/useExpenses';
import { ExpenseForm } from '../../../src/features/expenses/components/ExpenseForm';
import { Expense } from '../../../src/features/expenses/types/expense.types';

export default function EditExpenseScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { getExpenseById } = useExpenses();

  const [expense, setExpense] = useState<Expense | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [notFound, setNotFound] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;

    async function loadExpense() {
      if (!id) {
        setIsLoading(false);
        setNotFound(true);
        return;
      }

      setIsLoading(true);
      try {
        const found = await getExpenseById(id);
        if (isMounted) {
          if (found) {
            setExpense(found);
          } else {
            setNotFound(true);
          }
        }
      } catch {
        if (isMounted) {
          setNotFound(true);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadExpense();

    return () => {
      isMounted = false;
    };
  }, [id, getExpenseById]);

  if (isLoading) {
    return (
      <SafeAreaView
        style={{ flex: 1, minHeight: '100%' }}
        testID="edit-expense-screen"
        className="flex-1 bg-slate-50 dark:bg-slate-900 items-center justify-center p-4"
      >
        <ActivityIndicator size="large" color="#6366f1" testID="edit-expense-loading" />
      </SafeAreaView>
    );
  }

  if (notFound || !expense) {
    return (
      <SafeAreaView
        style={{ flex: 1, minHeight: '100%' }}
        testID="edit-expense-screen"
        className="flex-1 bg-slate-50 dark:bg-slate-900 items-center justify-center p-6"
      >
        <View
          testID="expense-not-found-card"
          className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700 items-center max-w-sm w-full"
        >
          <Text className="text-4xl mb-3">🔍</Text>
          <Text className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1 text-center">
            Expense Not Found
          </Text>
          <Text className="text-sm text-slate-500 dark:text-slate-400 mb-6 text-center">
            The transaction you are looking for does not exist or has been removed.
          </Text>
          <Pressable
            testID="not-found-back-btn"
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={() => router.back()}
            className="w-full rounded-xl bg-indigo-600 dark:bg-indigo-500 py-3 items-center"
          >
            <Text className="text-sm font-semibold text-white">Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#f8fafc' }}
      contentContainerStyle={{
        paddingHorizontal: 16,
        paddingTop: 24,
        paddingBottom: 180,
        alignItems: 'center',
      }}
      showsVerticalScrollIndicator={true}
      testID="edit-expense-screen"
    >
      <ExpenseForm
        initialData={expense}
        onSuccess={() => router.replace('/(app)')}
        onCancel={() => router.back()}
      />
    </ScrollView>
  );
}
