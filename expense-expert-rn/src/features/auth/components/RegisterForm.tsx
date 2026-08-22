import React, { useState } from 'react';
import {
  ActivityIndicator,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../hooks/useAuth';
import { getAuthErrorMessage } from '../utils/auth-errors';
import { SocialAuthButton } from './SocialAuthButton';

export interface RegisterFormProps {
  onSuccess?: () => void;
  onNavigateToLogin?: () => void;
  testID?: string;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({
  onSuccess,
  onNavigateToLogin,
  testID = 'register-form',
}) => {
  const router = useRouter();
  const { register, signInWithGoogle } = useAuth();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isPasswordTooShort = password.length > 0 && password.length < 6;
  const isPasswordMismatch =
    confirmPassword.length > 0 && password !== confirmPassword;

  const isFormValid =
    displayName.trim().length > 0 &&
    email.trim().length > 0 &&
    password.length >= 6 &&
    confirmPassword.length >= 6 &&
    password === confirmPassword;

  const handleRegister = async () => {
    if (!isFormValid || isSubmitting) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await register({
        email: email.trim(),
        password,
        displayName: displayName.trim(),
      });
      if (onSuccess) {
        onSuccess();
      } else {
        router.replace('/');
      }
    } catch (error: any) {
      const code = error?.code || '';
      setErrorMessage(getAuthErrorMessage(code));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await signInWithGoogle();
      if (onSuccess) {
        onSuccess();
      } else {
        router.replace('/');
      }
    } catch (error: any) {
      if (error?.code !== 'auth/popup-closed-by-user') {
        setErrorMessage(getAuthErrorMessage(error?.code || ''));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLoginNavigation = () => {
    if (onNavigateToLogin) {
      onNavigateToLogin();
    } else {
      router.push('/(auth)/login');
    }
  };

  return (
    <View testID={testID} className="w-full">
      {/* Error Feedback Banner */}
      {errorMessage ? (
        <View
          testID="register-error-banner"
          className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-950/40"
          accessibilityRole="alert"
        >
          <Text className="text-sm text-red-700 dark:text-red-300">
            {errorMessage}
          </Text>
        </View>
      ) : null}

      {/* Display Name Input */}
      <View className="mb-4">
        <Text className="mb-1 text-sm font-medium text-slate-700 dark:text-slate-300">
          Display name
        </Text>
        <TextInput
          testID="register-name-input"
          value={displayName}
          onChangeText={setDisplayName}
          placeholder="John Doe"
          placeholderTextColor="#94a3b8"
          autoCapitalize="words"
          autoCorrect={false}
          editable={!isSubmitting}
          className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
        />
      </View>

      {/* Email Input */}
      <View className="mb-4">
        <Text className="mb-1 text-sm font-medium text-slate-700 dark:text-slate-300">
          Email address
        </Text>
        <TextInput
          testID="register-email-input"
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          placeholderTextColor="#94a3b8"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          editable={!isSubmitting}
          className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
        />
      </View>

      {/* Password Input */}
      <View className="mb-4">
        <Text className="mb-1 text-sm font-medium text-slate-700 dark:text-slate-300">
          Password
        </Text>
        <TextInput
          testID="register-password-input"
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••"
          placeholderTextColor="#94a3b8"
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          editable={!isSubmitting}
          className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
        />
        {isPasswordTooShort ? (
          <Text
            testID="register-password-length-error"
            className="mt-1 text-xs text-red-500"
          >
            Password must be at least 6 characters
          </Text>
        ) : null}
      </View>

      {/* Confirm Password Input */}
      <View className="mb-6">
        <Text className="mb-1 text-sm font-medium text-slate-700 dark:text-slate-300">
          Confirm password
        </Text>
        <TextInput
          testID="register-confirm-password-input"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="••••••••"
          placeholderTextColor="#94a3b8"
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          editable={!isSubmitting}
          className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
        />
        {isPasswordMismatch ? (
          <Text
            testID="register-password-match-error"
            className="mt-1 text-xs text-red-500"
          >
            Passwords do not match
          </Text>
        ) : null}
      </View>

      {/* Submit Button */}
      <TouchableOpacity
        testID="register-submit-button"
        onPress={handleRegister}
        disabled={!isFormValid || isSubmitting}
        activeOpacity={0.8}
        className={`w-full items-center justify-center rounded-lg bg-primary-600 px-4 py-2.5 shadow-sm ${
          !isFormValid || isSubmitting ? 'opacity-50' : 'active:bg-primary-700'
        }`}
        accessibilityRole="button"
        accessibilityLabel="Create account"
        accessibilityState={{ disabled: !isFormValid || isSubmitting, busy: isSubmitting }}
      >
        {isSubmitting ? (
          <ActivityIndicator size="small" color="#ffffff" testID="register-submit-loading" />
        ) : (
          <Text className="text-sm font-medium text-white">Create account</Text>
        )}
      </TouchableOpacity>

      {/* Divider */}
      <View className="relative my-6 items-center justify-center">
        <View className="absolute inset-x-0 h-px bg-slate-300 dark:bg-slate-600" />
        <View className="bg-white px-2 dark:bg-slate-800">
          <Text className="text-xs text-slate-500 dark:text-slate-400">
            Or sign up with
          </Text>
        </View>
      </View>

      {/* Google Social Login */}
      <SocialAuthButton
        testID="register-google-button"
        onPress={handleGoogleSignUp}
        disabled={isSubmitting}
        label="Google"
      />

      {/* Login Navigation Link */}
      <View className="mt-6 flex-row items-center justify-center">
        <Text className="text-sm text-slate-500 dark:text-slate-400">
          Already have an account?{' '}
        </Text>
        <TouchableOpacity
          testID="register-login-link"
          onPress={handleLoginNavigation}
          disabled={isSubmitting}
          accessibilityRole="link"
        >
          <Text className="text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400">
            Sign in
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};
