import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  Text,
  View,
} from 'react-native';

export interface AuthLayoutProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  testID?: string;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({
  title,
  subtitle,
  children,
  testID = 'auth-layout',
}) => {
  return (
    <SafeAreaView
      style={{ flex: 1, minHeight: '100%' }}
      className="flex-1 bg-slate-50 dark:bg-slate-900"
      testID={testID}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
        className="flex-1"
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            flexGrow: 1,
            minHeight: '100%',
            justifyContent: 'center',
            alignItems: 'center',
            paddingVertical: 32,
            paddingHorizontal: 16,
          }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="w-full max-w-md">
            {/* Brand Header */}
            <View className="items-center mb-8">
              <View
                testID="auth-brand-badge"
                className="items-center justify-center h-14 w-14 rounded-2xl bg-primary-600 shadow-md mb-4"
              >
                <Text className="text-white font-bold text-xl">EE</Text>
              </View>
              <Text className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                Expense Expert
              </Text>
              <Text className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Track your expenses smarter
              </Text>
            </View>

            {/* Auth Card */}
            <View className="w-full bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 p-6 sm:p-8">
              {title ? (
                <Text className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-1">
                  {title}
                </Text>
              ) : null}
              {subtitle ? (
                <Text className="text-slate-500 dark:text-slate-400 text-sm mb-6">
                  {subtitle}
                </Text>
              ) : null}
              {children}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};
