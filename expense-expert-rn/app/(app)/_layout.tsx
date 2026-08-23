import React from 'react';
import { Stack } from 'expo-router';
import { ExpenseProvider } from '../../src/features/expenses/context/ExpenseProvider';
import { CategoryProvider } from '../../src/features/categories/context/CategoryProvider';
import { BudgetProvider } from '../../src/features/budgets/context/BudgetProvider';
import { DashboardProvider } from '../../src/features/dashboard/context/DashboardProvider';

export default function AppLayoutGroup() {
  return (
    <ExpenseProvider>
      <CategoryProvider>
        <BudgetProvider>
          <DashboardProvider>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="expenses/new" />
              <Stack.Screen name="expenses/[id]" />
              <Stack.Screen name="budgets/index" />
              <Stack.Screen name="categories/index" />
            </Stack>
          </DashboardProvider>
        </BudgetProvider>
      </CategoryProvider>
    </ExpenseProvider>
  );
}
