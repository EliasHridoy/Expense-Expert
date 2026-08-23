import '../global.css';
import React, { useEffect } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';
import { AuthProvider } from '../src/features/auth/context/AuthProvider';
import { useAuth } from '../src/features/auth/hooks/useAuth';
import { ErrorBoundary } from '../src/core/components/ErrorBoundary';
import { ToastProvider } from '../src/core/feedback/ToastProvider';

export function NavigationGate() {
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!user && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (user && inAuthGroup) {
      router.replace('/(app)');
    }
  }, [user, isLoading, segments, router]);

  if (isLoading) {
    return (
      <View
        testID="navigation-gate-loading"
        className="flex-1 justify-center items-center bg-slate-50 dark:bg-slate-900"
      >
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  return <Slot />;
}

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <SafeAreaProvider style={{ flex: 1 }}>
        <StatusBar style="auto" />
        <AuthProvider>
          <ToastProvider>
            <NavigationGate />
          </ToastProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
