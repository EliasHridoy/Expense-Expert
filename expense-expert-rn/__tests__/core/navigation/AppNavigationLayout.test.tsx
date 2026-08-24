import React from 'react';
import { render } from '@testing-library/react-native';
import { Text } from 'react-native';
import { AppNavigationLayout } from '@/core/navigation/AppNavigationLayout';

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  usePathname: () => '/',
}));

jest.mock('@/features/auth/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { email: 'test@example.com', displayName: 'Test User' },
    profile: { displayName: 'Test User' },
    logout: jest.fn(),
    isLoading: false,
    isAuthenticated: true,
  }),
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 20, left: 0, right: 0 }),
}));

describe('AppNavigationLayout (Unified Responsive Navigation Shell)', () => {
  it('renders children with top navbar and bottom nav', () => {
    const { getByTestId, getByText } = render(
      <AppNavigationLayout>
        <Text testID="screen-content">Main Screen Content</Text>
      </AppNavigationLayout>
    );

    expect(getByTestId('app-navigation-layout')).toBeTruthy();
    expect(getByTestId('app-desktop-navbar')).toBeTruthy();
    expect(getByTestId('screen-content')).toBeTruthy();
    expect(getByText('Main Screen Content')).toBeTruthy();
  });
});
