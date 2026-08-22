import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { NavigationGate } from '../../app/_layout';
import { useAuth } from '../../src/features/auth/hooks/useAuth';
import { useRouter, useSegments } from 'expo-router';

jest.mock('../../src/features/auth/hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

const mockReplace = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({
    replace: mockReplace,
  }),
  useSegments: jest.fn(),
  Slot: () => {
    const { Text } = require('react-native');
    return <Text testID="slot-content">Slot Content</Text>;
  },
}));

describe('NavigationGate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading spinner and does not redirect while isLoading is true', () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      isLoading: true,
    });
    (useSegments as jest.Mock).mockReturnValue([]);

    const { getByTestId, queryByTestId } = render(<NavigationGate />);

    expect(getByTestId('navigation-gate-loading')).toBeTruthy();
    expect(queryByTestId('slot-content')).toBeNull();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('redirects unauthenticated user to /(auth)/login if accessing protected route', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      isLoading: false,
    });
    (useSegments as jest.Mock).mockReturnValue(['(app)']);

    const { getByTestId } = render(<NavigationGate />);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/(auth)/login');
    });
    expect(getByTestId('slot-content')).toBeTruthy();
  });

  it('redirects authenticated user to /(app) if accessing auth screens', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: { uid: 'u123', email: 'test@example.com' },
      isLoading: false,
    });
    (useSegments as jest.Mock).mockReturnValue(['(auth)', 'login']);

    const { getByTestId } = render(<NavigationGate />);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/(app)');
    });
    expect(getByTestId('slot-content')).toBeTruthy();
  });

  it('does not redirect unauthenticated user if already in auth group', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      isLoading: false,
    });
    (useSegments as jest.Mock).mockReturnValue(['(auth)', 'login']);

    const { getByTestId } = render(<NavigationGate />);

    expect(getByTestId('slot-content')).toBeTruthy();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('does not redirect authenticated user if already in app group', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: { uid: 'u123', email: 'test@example.com' },
      isLoading: false,
    });
    (useSegments as jest.Mock).mockReturnValue(['(app)']);

    const { getByTestId } = render(<NavigationGate />);

    expect(getByTestId('slot-content')).toBeTruthy();
    expect(mockReplace).not.toHaveBeenCalled();
  });
});
