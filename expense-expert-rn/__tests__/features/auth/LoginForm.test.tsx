import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { LoginForm } from '../../../src/features/auth/components/LoginForm';
import { useAuth } from '../../../src/features/auth/hooks/useAuth';

const mockPush = jest.fn();
const mockReplace = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
}));

jest.mock('../../../src/features/auth/hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

describe('LoginForm', () => {
  const mockLogin = jest.fn();
  const mockSignInWithGoogle = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({
      login: mockLogin,
      signInWithGoogle: mockSignInWithGoogle,
      isLoading: false,
      isAuthenticated: false,
      user: null,
      profile: null,
      logout: jest.fn(),
      register: jest.fn(),
    });
  });

  it('renders all form fields, buttons, and navigation links', () => {
    const { getByTestId, getByText, getByPlaceholderText } = render(
      <LoginForm />
    );

    expect(getByText('Email address')).toBeTruthy();
    expect(getByPlaceholderText('you@example.com')).toBeTruthy();
    expect(getByText('Password')).toBeTruthy();
    expect(getByPlaceholderText('••••••••')).toBeTruthy();
    expect(getByTestId('login-submit-button')).toBeTruthy();
    expect(getByTestId('login-google-button')).toBeTruthy();
    expect(getByTestId('login-register-link')).toBeTruthy();
  });

  it('disables submit button when fields are empty', async () => {
    const { getByTestId } = render(<LoginForm />);
    const submitButton = getByTestId('login-submit-button');

    expect(submitButton.props.accessibilityState.disabled).toBe(true);

    await act(async () => {
      fireEvent.press(submitButton);
    });
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it('enables submit button and calls login with trimmed email and password', async () => {
    mockLogin.mockResolvedValueOnce({ uid: 'test-123' });
    const { getByTestId, getByPlaceholderText } = render(<LoginForm />);

    const emailInput = getByPlaceholderText('you@example.com');
    const passwordInput = getByPlaceholderText('••••••••');
    const submitButton = getByTestId('login-submit-button');

    fireEvent.changeText(emailInput, '  test@example.com  ');
    fireEvent.changeText(passwordInput, 'secret123');

    expect(submitButton.props.accessibilityState.disabled).toBe(false);

    await act(async () => {
      fireEvent.press(submitButton);
    });

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'secret123',
      });
      expect(mockReplace).toHaveBeenCalledWith('/');
    });
  });

  it('calls onSuccess callback if provided upon successful login', async () => {
    mockLogin.mockResolvedValueOnce({ uid: 'test-123' });
    const onSuccess = jest.fn();
    const { getByTestId, getByPlaceholderText } = render(
      <LoginForm onSuccess={onSuccess} />
    );

    fireEvent.changeText(getByPlaceholderText('you@example.com'), 'user@test.com');
    fireEvent.changeText(getByPlaceholderText('••••••••'), 'password123');

    await act(async () => {
      fireEvent.press(getByTestId('login-submit-button'));
    });

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled();
      expect(mockReplace).not.toHaveBeenCalled();
    });
  });

  it('displays user-friendly error banner when login fails with invalid credentials', async () => {
    mockLogin.mockRejectedValueOnce({ code: 'auth/invalid-credential' });
    const { getByTestId, getByPlaceholderText, findByText } = render(<LoginForm />);

    fireEvent.changeText(getByPlaceholderText('you@example.com'), 'user@test.com');
    fireEvent.changeText(getByPlaceholderText('••••••••'), 'wrongpass');

    await act(async () => {
      fireEvent.press(getByTestId('login-submit-button'));
    });

    const errorBanner = await findByText('Invalid email or password');
    expect(errorBanner).toBeTruthy();
    expect(getByTestId('login-error-banner')).toBeTruthy();
  });

  it('calls signInWithGoogle when Google button is pressed', async () => {
    mockSignInWithGoogle.mockResolvedValueOnce({ uid: 'google-user' });
    const { getByTestId } = render(<LoginForm />);

    await act(async () => {
      fireEvent.press(getByTestId('login-google-button'));
    });

    await waitFor(() => {
      expect(mockSignInWithGoogle).toHaveBeenCalled();
      expect(mockReplace).toHaveBeenCalledWith('/');
    });
  });

  it('ignores auth/popup-closed-by-user error without showing error banner', async () => {
    mockSignInWithGoogle.mockRejectedValueOnce({ code: 'auth/popup-closed-by-user' });
    const { getByTestId, queryByTestId } = render(<LoginForm />);

    await act(async () => {
      fireEvent.press(getByTestId('login-google-button'));
    });

    await waitFor(() => {
      expect(mockSignInWithGoogle).toHaveBeenCalled();
      expect(queryByTestId('login-error-banner')).toBeNull();
    });
  });

  it('displays error banner when signInWithGoogle fails with another error code', async () => {
    mockSignInWithGoogle.mockRejectedValueOnce({ code: 'auth/network-request-failed' });
    const { getByTestId, findByText } = render(<LoginForm />);

    await act(async () => {
      fireEvent.press(getByTestId('login-google-button'));
    });

    const errorText = await findByText('Network error. Please check your internet connection.');
    expect(errorText).toBeTruthy();
    expect(getByTestId('login-error-banner')).toBeTruthy();
  });

  it('navigates to register screen via router push or custom onNavigateToRegister', async () => {
    const { getByTestId, rerender } = render(<LoginForm />);

    await act(async () => {
      fireEvent.press(getByTestId('login-register-link'));
    });
    expect(mockPush).toHaveBeenCalledWith('/(auth)/register');

    const onNavigateToRegister = jest.fn();
    rerender(<LoginForm onNavigateToRegister={onNavigateToRegister} />);

    await act(async () => {
      fireEvent.press(getByTestId('login-register-link'));
    });
    expect(onNavigateToRegister).toHaveBeenCalled();
  });
});
