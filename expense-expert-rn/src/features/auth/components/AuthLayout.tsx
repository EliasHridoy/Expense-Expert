import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { colors } from '../../../theme';

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
      style={styles.safeArea}
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
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.container} className="w-full max-w-md">
            {/* Brand Header */}
            <View style={styles.brandHeader} className="items-center mb-8">
              <View
                testID="auth-brand-badge"
                style={styles.brandBadge}
                className="items-center justify-center h-14 w-14 rounded-2xl bg-primary-600 shadow-md mb-4"
              >
                <Text style={styles.brandBadgeText} className="text-white font-bold text-xl">EE</Text>
              </View>
              <Text style={styles.brandTitle} className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                Expense Expert
              </Text>
              <Text style={styles.brandSubtitle} className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Track your expenses smarter
              </Text>
            </View>

            {/* Auth Card */}
            <View style={styles.card} className="w-full bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 p-6 sm:p-8">
              {title ? (
                <Text style={styles.cardTitle} className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-1">
                  {title}
                </Text>
              ) : null}
              {subtitle ? (
                <Text style={styles.cardSubtitle} className="text-slate-500 dark:text-slate-400 text-sm mb-6">
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

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    minHeight: '100%',
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    flexGrow: 1,
    minHeight: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  container: {
    width: '100%',
    maxWidth: 440,
    alignItems: 'center',
  },
  brandHeader: {
    alignItems: 'center',
    marginBottom: 28,
  },
  brandBadge: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 8px 20px rgba(79, 70, 229, 0.35)' }
      : {
          shadowColor: colors.primary,
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.35,
          shadowRadius: 10,
          elevation: 5,
        }),
  },
  brandBadgeText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 22,
    letterSpacing: 1,
  },
  brandTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.5,
  },
  brandSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
    fontWeight: '500',
  },
  card: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 32,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 12px 32px rgba(15, 23, 42, 0.08)' }
      : {
          shadowColor: '#0f172a',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.08,
          shadowRadius: 20,
          elevation: 4,
        }),
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 24,
  },
});
