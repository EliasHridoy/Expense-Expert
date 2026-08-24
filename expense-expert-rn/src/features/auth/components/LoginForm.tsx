import React, { useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../hooks/useAuth';
import { getAuthErrorMessage } from '../utils/auth-errors';
import { SocialAuthButton } from './SocialAuthButton';
import { colors } from '../../../theme';

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
    <View testID={testID} style={styles.container} className="w-full">
      {/* Error Feedback Banner */}
      {errorMessage ? (
        <View
          testID="login-error-banner"
          style={styles.errorBanner}
          className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-950/40"
          accessibilityRole="alert"
        >
          <Text style={styles.errorText} className="text-sm text-red-700 dark:text-red-300">
            {errorMessage}
          </Text>
        </View>
      ) : null}

      {/* Email Input */}
      <View style={styles.inputGroup} className="mb-4">
        <Text style={styles.label} className="mb-1 text-sm font-medium text-slate-700 dark:text-slate-300">
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
          style={styles.input}
          className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
        />
      </View>

      {/* Password Input */}
      <View style={styles.inputGroup} className="mb-6">
        <Text style={styles.label} className="mb-1 text-sm font-medium text-slate-700 dark:text-slate-300">
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
          style={styles.input}
          className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
        />
      </View>

      {/* Submit Button */}
      <TouchableOpacity
        testID="login-submit-button"
        onPress={handleLogin}
        disabled={!isFormValid || isSubmitting}
        activeOpacity={0.85}
        style={[
          styles.submitBtn,
          (!isFormValid || isSubmitting) && styles.submitBtnDisabled,
        ]}
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
          <Text style={styles.submitBtnText} className="text-sm font-medium text-white">Sign in</Text>
        )}
      </TouchableOpacity>

      {/* Divider */}
      <View style={styles.dividerContainer} className="relative my-6 items-center justify-center">
        <View style={styles.dividerLine} className="absolute inset-x-0 h-px bg-slate-300 dark:bg-slate-600" />
        <View style={styles.dividerBadge} className="bg-white px-2 dark:bg-slate-800">
          <Text style={styles.dividerText} className="text-xs text-slate-500 dark:text-slate-400">
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
      <View style={styles.footerRow} className="mt-6 flex-row items-center justify-center">
        <Text style={styles.footerText} className="text-sm text-slate-500 dark:text-slate-400">
          Don't have an account?{' '}
        </Text>
        <TouchableOpacity
          testID="login-register-link"
          onPress={handleRegisterNavigation}
          disabled={isSubmitting}
          accessibilityRole="link"
        >
          <Text style={styles.footerLink} className="text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400">
            Sign up
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  errorBanner: {
    backgroundColor: '#fff1f2',
    borderWidth: 1,
    borderColor: '#fecdd3',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#e11d48',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#0f172a',
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : {}),
  },
  submitBtn: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)', cursor: 'pointer' }
      : {
          shadowColor: colors.primary,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 3,
        }),
  },
  submitBtnDisabled: {
    opacity: 0.5,
  },
  submitBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 15,
  },
  dividerContainer: {
    position: 'relative',
    marginVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dividerLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#e2e8f0',
  },
  dividerBadge: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 10,
  },
  dividerText: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '500',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  footerText: {
    fontSize: 14,
    color: '#64748b',
  },
  footerLink: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
});
