import React from 'react';
import { Text } from 'react-native';
import { render, fireEvent, act } from '@testing-library/react-native';
import { AuthLayout } from '../../../src/features/auth/components/AuthLayout';
import { SocialAuthButton } from '../../../src/features/auth/components/SocialAuthButton';

describe('AuthLayout', () => {
  it('renders brand logo badge EE, title, subtitle, and child contents', () => {
    const { getByTestId, getByText } = render(
      <AuthLayout title="Sign In" subtitle="Welcome back!">
        <Text testID="test-child">Child Content</Text>
      </AuthLayout>
    );

    expect(getByTestId('auth-brand-badge')).toBeTruthy();
    expect(getByText('EE')).toBeTruthy();
    expect(getByText('Expense Expert')).toBeTruthy();
    expect(getByText('Track your expenses smarter')).toBeTruthy();
    expect(getByText('Sign In')).toBeTruthy();
    expect(getByText('Welcome back!')).toBeTruthy();
    expect(getByTestId('test-child')).toBeTruthy();
  });
});

describe('SocialAuthButton', () => {
  it('renders Google button and handles onPress', async () => {
    const onPress = jest.fn();
    const { getByTestId, getByText } = render(
      <SocialAuthButton onPress={onPress} label="Continue with Google" />
    );

    expect(getByText('Continue with Google')).toBeTruthy();
    await act(async () => {
      fireEvent.press(getByTestId('social-auth-button'));
    });
    expect(onPress).toHaveBeenCalled();
  });

  it('renders loading spinner and disables button when loading', () => {
    const onPress = jest.fn();
    const { getByTestId, queryByText } = render(
      <SocialAuthButton onPress={onPress} loading={true} />
    );

    expect(getByTestId('social-auth-loading-indicator')).toBeTruthy();
    expect(queryByText('Continue with Google')).toBeNull();
  });
});
