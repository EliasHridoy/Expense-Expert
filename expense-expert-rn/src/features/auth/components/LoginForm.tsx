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

export interface LoginFormProps {
  onSuccess?: () => void;
  onNavigateToRegister?: () => void;
  testID?: string;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onSuccess,
  onNavigateToRegister,
  testID = 'login-form',
}) => {
  const router = useRouter();
  const { login, signInWithGoogle } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isFormValid = email.trim().length > 0 && password.length > 0;

  const handleLogin = async () => {
    if (!isFormValid || isSubmitting) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await login({ email: email.trim(), password });
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

  const handleGoogleSignIn = async () => {
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

  const handleRegisterNavigation = () => {
    if (onNavigateToRegister) {
      onNavigateToRegister();
    } else {
      router.push('/(auth)/register');
    }
  };

  return (
    <View testID={testID} className="w-full">
      {/* Error Feedback Banner */}
      {errorMessage ? (
        <View
          testID="login-error-banner"
          className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-950/40"
          accessibilityRole="alert"
        >
          <Text className="text-sm text-red-700 dark:text-red-300">
            {errorMessage}
          </Text>
        </View>
      ) : null}

      {/* Email Input */}
      <View className="mb-4">
        <Text className="mb-1 text-sm font-medium text-slate-700 dark:text-slate-300">
          Email address
        </Text>
        <TextInput
          testID="login-email-input"
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
      <View className="mb-6">
        <Text className="mb-1 text-sm font-medium text-slate-700 dark:text-slate-300">
          Password
        </Text>
        <TextInput
          testID="login-password-input"
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
      </View>

      {/* Submit Button */}
      <TouchableOpacity
        testID="login-submit-button"
        onPress={handleLogin}
        disabled={!isFormValid || isSubmitting}
        activeOpacity={0.8}
        className={`w-full items-center justify-center rounded-lg bg-primary-600 px-4 py-2.5 shadow-sm ${
          !isFormValid || isSubmitting ? 'opacity-50' : 'active:bg-primary-700'
        }`}
        accessibilityRole="button"
        accessibilityLabel="Sign in"
        accessibilityState={{ disabled: !isFormValid || isSubmitting, busy: isSubmitting }}
      >
        {isSubmitting ? (
          <ActivityIndicator size="small" color="#ffffff" testID="login-submit-loading" />
        ) : (
          <Text className="text-sm font-medium text-white">Sign in</Text>
        )}
      </TouchableOpacity>

      {/* Divider */}
      <View className="relative my-6 items-center justify-center">
        <View className="absolute inset-x-0 h-px bg-slate-300 dark:bg-slate-600" />
        <View className="bg-white px-2 dark:bg-slate-800">
          <Text className="text-xs text-slate-500 dark:text-slate-400">
            Or continue with
          </Text>
        </View>
      </View>

      {/* Google Social Login */}
      <SocialAuthButton
        testID="login-google-button"
        onPress={handleGoogleSignIn}
        disabled={isSubmitting}
        label="Google"
      />

      {/* Registration Navigation Link */}
      <View className="mt-6 flex-row items-center justify-center">
        <Text className="text-sm text-slate-500 dark:text-slate-400">
          Don't have an account?{' '}
        </Text>
        <TouchableOpacity
          testID="login-register-link"
          onPress={handleRegisterNavigation}
          disabled={isSubmitting}
          accessibilityRole="link"
        >
          <Text className="text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400">
            Sign up
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};
