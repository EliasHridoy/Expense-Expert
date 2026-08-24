import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import ProfileScreen from '@/../app/(app)/profile/index';

const mockReplace = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: mockReplace,
    back: jest.fn(),
  }),
}));

const mockLogout = jest.fn();
jest.mock('@/features/auth/hooks/useAuth', () => ({
  useAuth: () => ({
    user: {
      uid: 'super_secret_uid_12345',
      email: 'alex.rivers@example.com',
      displayName: 'Alex Rivers',
      providerData: [{ providerId: 'password' }],
    },
    profile: {
      displayName: 'Alex Rivers',
      monthlySalary: 6500,
      createdAt: '2025-06-01T00:00:00.000Z',
    },
    logout: mockLogout,
    isLoading: false,
    isAuthenticated: true,
  }),
}));

describe('ProfileScreen (/profile)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders profile screen container and headers', () => {
    const { getByTestId, getByText } = render(<ProfileScreen />);
    expect(getByTestId('profile-screen')).toBeTruthy();
    expect(getByText('User Profile')).toBeTruthy();
    expect(getByText('Account information & preferences')).toBeTruthy();
  });

  it('displays user welcome banner and avatar initial', () => {
    const { getByTestId, getByText } = render(<ProfileScreen />);
    expect(getByTestId('profile-user-card')).toBeTruthy();
    expect(getByTestId('profile-welcome-text')).toHaveTextContent('Welcome, Alex Rivers!');
    expect(getByTestId('profile-user-email')).toHaveTextContent('alex.rivers@example.com');
    expect(getByText('A')).toBeTruthy();
    expect(getByText('✓ Verified User')).toBeTruthy();
  });

  it('displays account details while strictly HIDING the raw UID', () => {
    const { getByTestId, queryByText, queryByTestId } = render(<ProfileScreen />);
    expect(getByTestId('profile-user-name')).toHaveTextContent('Alex Rivers');
    expect(getByTestId('profile-detail-email')).toHaveTextContent('alex.rivers@example.com');
    expect(getByTestId('profile-member-since')).toHaveTextContent('2025-06-01');

    // Verify UID is NOT rendered anywhere in the document
    expect(queryByText('super_secret_uid_12345')).toBeNull();
    expect(queryByTestId('user-uid-text')).toBeNull();
  });

  it('displays financial baseline settings', () => {
    const { getByTestId, getByText } = render(<ProfileScreen />);
    expect(getByTestId('profile-salary-text')).toHaveTextContent('$6,500');
    expect(getByText('USD ($)')).toBeTruthy();
  });

  it('navigates back to dashboard when back button is pressed', () => {
    const { getByTestId } = render(<ProfileScreen />);
    fireEvent.press(getByTestId('back-to-dashboard-btn'));
    expect(mockReplace).toHaveBeenCalledWith('/');
  });

  it('calls logout when sign out button is pressed', async () => {
    const { getByTestId } = render(<ProfileScreen />);
    fireEvent.press(getByTestId('profile-logout-button'));
    expect(mockLogout).toHaveBeenCalledTimes(1);
  });
});
