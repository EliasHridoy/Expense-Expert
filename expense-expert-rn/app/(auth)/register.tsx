import React from 'react';
import { AuthLayout } from '../../src/features/auth/components/AuthLayout';
import { RegisterForm } from '../../src/features/auth/components/RegisterForm';

export default function RegisterScreen() {
  return (
    <AuthLayout
      title="Create account"
      subtitle="Start tracking your expenses today."
    >
      <RegisterForm />
    </AuthLayout>
  );
}
