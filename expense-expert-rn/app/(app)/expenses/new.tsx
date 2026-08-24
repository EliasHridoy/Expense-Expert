import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { ExpenseForm } from '../../../src/features/expenses/components/ExpenseForm';

export default function NewExpenseScreen() {
  const router = useRouter();

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={true}
      testID="new-expense-screen"
    >
      <ExpenseForm
        onSuccess={() => router.replace('/(app)')}
        onCancel={() => router.back()}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 180, // Comfortable spacing above bottom navigation bar
    alignItems: 'center',
  },
});
