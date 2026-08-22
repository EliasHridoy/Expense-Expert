import React from 'react';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ExpenseForm } from '../../../src/features/expenses/components/ExpenseForm';

export default function NewExpenseScreen() {
  const router = useRouter();

  return (
    <SafeAreaView
      testID="new-expense-screen"
      className="flex-1 bg-slate-50 dark:bg-slate-900 p-4 sm:p-6"
    >
      <ExpenseForm
        onSuccess={() => router.replace('/(app)')}
        onCancel={() => router.back()}
      />
    </SafeAreaView>
  );
}
