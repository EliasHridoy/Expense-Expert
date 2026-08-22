import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { RegisterForm } from '../../../src/features/auth/components/RegisterForm';
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

describe('RegisterForm', () => {
  const mockRegister = jest.fn();
  const mockSignInWithGoogle = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({
      register: mockRegister,
      signInWithGoogle: mockSignInWithGoogle,
      isLoading: false,
      isAuthenticated: false,
      user: null,
      profile: null,
      login: jest.fn(),
      logout: jest.fn(),
    });
  });

  it('renders all form fields, buttons, and navigation links', () => {
    const { getByTestId, getByText, getByPlaceholderText } = render(
      <RegisterForm />
    );

    expect(getByText('Display name')).toBeTruthy();
    expect(getByPlaceholderText('John Doe')).toBeTruthy();
    expect(getByText('Email address')).toBeTruthy();
    expect(getByPlaceholderText('you@example.com')).toBeTruthy();
    expect(getByText('Password')).toBeTruthy();
    expect(getByText('Confirm password')).toBeTruthy();
    expect(getByTestId('register-submit-button')).toBeTruthy();
    expect(getByTestId('register-google-button')).toBeTruthy();
    expect(getByTestId('register-login-link')).toBeTruthy();
  });

  it('disables submit button when required fields are empty', async () => {
    const { getByTestId } = render(<RegisterForm />);
    const submitButton = getByTestId('register-submit-button');

    expect(submitButton.props.accessibilityState.disabled).toBe(true);

    await act(async () => {
      fireEvent.press(submitButton);
    });
    expect(mockRegister).not.toHaveBeenCalled();
  });

  it('shows validation warning when password is less than 6 characters and keeps button disabled', async () => {
    const { getByTestId, getByPlaceholderText, getByText } = render(
      <RegisterForm />
    );

    fireEvent.changeText(getByPlaceholderText('John Doe'), 'John Doe');
    fireEvent.changeText(getByPlaceholderText('you@example.com'), 'john@example.com');
    fireEvent.changeText(getByTestId('register-password-input'), '12345');
    fireEvent.changeText(getByTestId('register-confirm-password-input'), '12345');

    expect(getByText('Password must be at least 6 characters')).toBeTruthy();
    expect(getByTestId('register-submit-button').props.accessibilityState.disabled).toBe(true);

    await act(async () => {
      fireEvent.press(getByTestId('register-submit-button'));
    });
    expect(mockRegister).not.toHaveBeenCalled();
  });

  it('shows validation error when password and confirm password do not match', async () => {
    const { getByTestId, getByPlaceholderText, getByText } = render(
      <RegisterForm />
    );

    fireEvent.changeText(getByPlaceholderText('John Doe'), 'John Doe');
    fireEvent.changeText(getByPlaceholderText('you@example.com'), 'john@example.com');
    fireEvent.changeText(getByTestId('register-password-input'), 'password123');
    fireEvent.changeText(getByTestId('register-confirm-password-input'), 'different123');

    expect(getByText('Passwords do not match')).toBeTruthy();
    expect(getByTestId('register-submit-button').props.accessibilityState.disabled).toBe(true);

    await act(async () => {
      fireEvent.press(getByTestId('register-submit-button'));
    });
    expect(mockRegister).not.toHaveBeenCalled();
  });

  it('enables submit button and calls register with trimmed values when form is valid', async () => {
    mockRegister.mockResolvedValueOnce({ uid: 'new-user-123' });
    const { getByTestId, getByPlaceholderText, queryByText } = render(
      <RegisterForm />
    );

    fireEvent.changeText(getByPlaceholderText('John Doe'), '  Jane Doe  ');
    fireEvent.changeText(getByPlaceholderText('you@example.com'), '  jane@example.com  ');
    fireEvent.changeText(getByTestId('register-password-input'), 'secret123');
    fireEvent.changeText(getByTestId('register-confirm-password-input'), 'secret123');

    expect(queryByText('Passwords do not match')).toBeNull();
    expect(queryByText('Password must be at least 6 characters')).toBeNull();
    expect(getByTestId('register-submit-button').props.accessibilityState.disabled).toBe(false);

    await act(async () => {
      fireEvent.press(getByTestId('register-submit-button'));
    });

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith({
        displayName: 'Jane Doe',
        email: 'jane@example.com',
        password: 'secret123',
      });
      expect(mockReplace).toHaveBeenCalledWith('/');
    });
  });

  it('calls onSuccess callback if provided upon successful registration', async () => {
    mockRegister.mockResolvedValueOnce({ uid: 'new-user-123' });
    const onSuccess = jest.fn();
    const { getByTestId, getByPlaceholderText } = render(
      <RegisterForm onSuccess={onSuccess} />
    );

    fireEvent.changeText(getByPlaceholderText('John Doe'), 'Jane Doe');
    fireEvent.changeText(getByPlaceholderText('you@example.com'), 'jane@test.com');
    fireEvent.changeText(getByTestId('register-password-input'), 'pass1234');
    fireEvent.changeText(getByTestId('register-confirm-password-input'), 'pass1234');

    await act(async () => {
      fireEvent.press(getByTestId('register-submit-button'));
    });

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled();
      expect(mockReplace).not.toHaveBeenCalled();
    });
  });

  it('displays user-friendly error banner when email is already in use', async () => {
    mockRegister.mockRejectedValueOnce({ code: 'auth/email-already-in-use' });
    const { getByTestId, getByPlaceholderText, findByText } = render(
      <RegisterForm />
    );

    fireEvent.changeText(getByPlaceholderText('John Doe'), 'Existing User');
    fireEvent.changeText(getByPlaceholderText('you@example.com'), 'existing@test.com');
    fireEvent.changeText(getByTestId('register-password-input'), 'pass1234');
    fireEvent.changeText(getByTestId('register-confirm-password-input'), 'pass1234');

    await act(async () => {
      fireEvent.press(getByTestId('register-submit-button'));
    });

    const errorBanner = await findByText('An account with this email already exists');
    expect(errorBanner).toBeTruthy();
    expect(getByTestId('register-error-banner')).toBeTruthy();
  });

  it('calls signInWithGoogle when Google sign up button is pressed', async () => {
    mockSignInWithGoogle.mockResolvedValueOnce({ uid: 'google-user' });
    const { getByTestId } = render(<RegisterForm />);

    await act(async () => {
      fireEvent.press(getByTestId('register-google-button'));
    });

    await waitFor(() => {
      expect(mockSignInWithGoogle).toHaveBeenCalled();
      expect(mockReplace).toHaveBeenCalledWith('/');
    });
  });

  it('navigates to login screen via router push or custom onNavigateToLogin', async () => {
    const { getByTestId, rerender } = render(<RegisterForm />);

    await act(async () => {
      fireEvent.press(getByTestId('register-login-link'));
    });
    expect(mockPush).toHaveBeenCalledWith('/(auth)/login');

    const onNavigateToLogin = jest.fn();
    rerender(<RegisterForm onNavigateToLogin={onNavigateToLogin} />);

    await act(async () => {
      fireEvent.press(getByTestId('register-login-link'));
    });
    expect(onNavigateToLogin).toHaveBeenCalled();
  });
});
