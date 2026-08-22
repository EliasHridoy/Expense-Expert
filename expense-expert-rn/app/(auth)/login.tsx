import React from 'react';
import { AuthLayout } from '../../src/features/auth/components/AuthLayout';
import { LoginForm } from '../../src/features/auth/components/LoginForm';

export default function LoginScreen() {
  return (
    <AuthLayout
      title="Sign in"
      subtitle="Welcome back! Enter your credentials to continue."
    >
      <LoginForm />
    </AuthLayout>
  );
}
