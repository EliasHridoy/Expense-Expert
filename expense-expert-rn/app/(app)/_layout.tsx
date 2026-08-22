import React from 'react';
import { Stack } from 'expo-router';
import { ExpenseProvider } from '../../src/features/expenses/context/ExpenseProvider';

export default function AppLayoutGroup() {
  return (
    <ExpenseProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="expenses/new" />
        <Stack.Screen name="expenses/[id]" />
      </Stack>
    </ExpenseProvider>
  );
}
