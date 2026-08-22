import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import RootIndex from '../../app/index';
import LoginScreen from '../../app/(auth)/login';
import RegisterScreen from '../../app/(auth)/register';
import AppDashboardScreen from '../../app/(app)/index';
import { useAuth } from '../../src/features/auth/hooks/useAuth';
import { useExpenses } from '../../src/features/expenses/hooks/useExpenses';

jest.mock('../../src/features/auth/hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../../src/features/expenses/hooks/useExpenses', () => ({
  useExpenses: () => ({
    expenses: [],
    pendingSyncCount: 0,
    isLoading: false,
    isSyncing: false,
    isOnline: true,
    addExpense: jest.fn(),
    updateExpense: jest.fn(),
    deleteExpense: jest.fn(),
    getExpenseById: jest.fn(),
    syncQueue: jest.fn(),
    refreshExpenses: jest.fn(),
  }),
}));

const mockPush = jest.fn();
const mockReplace = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
  useSegments: () => [],
  Redirect: ({ href }: { href: string }) => {
    const { Text } = require('react-native');
    return <Text testID="redirect-target">{href}</Text>;
  },
  Stack: Object.assign(
    ({ children }: { children: React.ReactNode }) => <>{children}</>,
    {
      Screen: () => null,
    }
  ),
}));

describe('Screen Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('RootIndex (app/index.tsx)', () => {
    it('returns null when auth is loading', () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: null,
        isLoading: true,
      });

      const { toJSON } = render(<RootIndex />);
      expect(toJSON()).toBeNull();
    });

    it('redirects to /(auth)/login when unauthenticated', () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: null,
        isLoading: false,
      });

      const { getByTestId, getByText } = render(<RootIndex />);
      expect(getByTestId('redirect-target')).toBeTruthy();
      expect(getByText('/(auth)/login')).toBeTruthy();
    });

    it('redirects to /(app) when authenticated', () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: { uid: 'u123', email: 'test@example.com' },
        isLoading: false,
      });

      const { getByTestId, getByText } = render(<RootIndex />);
      expect(getByTestId('redirect-target')).toBeTruthy();
      expect(getByText('/(app)')).toBeTruthy();
    });
  });

  describe('LoginScreen (app/(auth)/login.tsx)', () => {
    it('renders login screen with title and login form elements', () => {
      (useAuth as jest.Mock).mockReturnValue({
        login: jest.fn(),
        signInWithGoogle: jest.fn(),
        isLoading: false,
        isAuthenticated: false,
        user: null,
        profile: null,
      });

      const { getAllByText, getByText, getByTestId } = render(<LoginScreen />);
      expect(getAllByText('Sign in').length).toBeGreaterThanOrEqual(1);
      expect(
        getByText('Welcome back! Enter your credentials to continue.')
      ).toBeTruthy();
      expect(getByTestId('login-form')).toBeTruthy();
    });
  });

  describe('RegisterScreen (app/(auth)/register.tsx)', () => {
    it('renders register screen with title and register form elements', () => {
      (useAuth as jest.Mock).mockReturnValue({
        register: jest.fn(),
        signInWithGoogle: jest.fn(),
        isLoading: false,
        isAuthenticated: false,
        user: null,
        profile: null,
      });

      const { getAllByText, getByText, getByTestId } = render(<RegisterScreen />);
      expect(getAllByText('Create account').length).toBeGreaterThanOrEqual(1);
      expect(getByText('Start tracking your expenses today.')).toBeTruthy();
      expect(getByTestId('register-form')).toBeTruthy();
    });
  });

  describe('AppDashboardScreen (app/(app)/index.tsx)', () => {
    it('renders user details and responds to logout', async () => {
      const mockLogout = jest.fn().mockResolvedValue(undefined);
      (useAuth as jest.Mock).mockReturnValue({
        user: { uid: 'uid-456', email: 'elias@example.com', displayName: 'Elias Hridoy' },
        profile: { uid: 'uid-456', email: 'elias@example.com', displayName: 'Elias Hridoy' },
        logout: mockLogout,
        isLoading: false,
        isAuthenticated: true,
      });

      const { getByText, getByTestId } = render(<AppDashboardScreen />);

      expect(getByText('Welcome, Elias Hridoy!')).toBeTruthy();
      expect(getByTestId('user-email-text').props.children).toBe('elias@example.com');
      expect(getByTestId('user-name-text').props.children).toBe('Elias Hridoy');
      expect(getByTestId('user-uid-text').props.children).toBe('uid-456');

      const logoutButton = getByTestId('logout-button');
      await act(async () => {
        fireEvent.press(logoutButton);
      });

      await waitFor(() => {
        expect(mockLogout).toHaveBeenCalled();
      });
    });

    it('falls back to email username if displayName is not present', () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: { uid: 'uid-789', email: 'testuser@example.com', displayName: null },
        profile: null,
        logout: jest.fn(),
        isLoading: false,
        isAuthenticated: true,
      });

      const { getByText } = render(<AppDashboardScreen />);
      expect(getByText('Welcome, testuser!')).toBeTruthy();
    });
  });
});
