import React from 'react';
import { Stack } from 'expo-router';
import { ExpenseProvider } from '../../src/features/expenses/context/ExpenseProvider';
import { CategoryProvider } from '../../src/features/categories/context/CategoryProvider';
import { BudgetProvider } from '../../src/features/budgets/context/BudgetProvider';
import { DashboardProvider } from '../../src/features/dashboard/context/DashboardProvider';
import { ErrorBoundary } from '../../src/core/components/ErrorBoundary';
import { ConnectionStatusBanner } from '../../src/core/components/ConnectionStatusBanner';
import { useExpenses } from '../../src/features/expenses/hooks/useExpenses';

function AppLayoutContent() {
  const { pendingSyncCount, isSyncing, syncQueue } = useExpenses();

  return (
    <ErrorBoundary>
      <ConnectionStatusBanner
        pendingCount={pendingSyncCount}
        isSyncing={isSyncing}
        onSyncNow={syncQueue}
      />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="expenses/new" />
        <Stack.Screen name="expenses/[id]" />
        <Stack.Screen name="budgets/index" />
        <Stack.Screen name="categories/index" />
      </Stack>
    </ErrorBoundary>
  );
}

export default function AppLayoutGroup() {
  return (
    <ExpenseProvider>
      <CategoryProvider>
        <BudgetProvider>
          <DashboardProvider>
            <AppLayoutContent />
          </DashboardProvider>
        </BudgetProvider>
      </CategoryProvider>
    </ExpenseProvider>
  );
}
