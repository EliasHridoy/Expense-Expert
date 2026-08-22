import React from 'react';
import { Redirect } from 'expo-router';
import { useAuth } from '../src/features/auth/hooks/useAuth';

export default function RootIndex() {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  return user ? <Redirect href="/(app)" /> : <Redirect href="/(auth)/login" />;
}

