import React from 'react';
import { renderHook, act } from '@testing-library/react-native';
import { onAuthStateChanged, User } from 'firebase/auth';
import { AuthProvider } from '../../../src/features/auth/context/AuthProvider';
import { useAuth } from '../../../src/features/auth/hooks/useAuth';
import { AuthService } from '../../../src/features/auth/services/auth.service';

jest.mock('firebase/auth', () => ({
  onAuthStateChanged: jest.fn(),
  getAuth: jest.fn(() => ({})),
  initializeAuth: jest.fn(() => ({})),
  getReactNativePersistence: jest.fn(() => ({})),
}));

jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(() => ({ type: 'firestore' })),
  doc: jest.fn(),
  getDoc: jest.fn(),
  setDoc: jest.fn(),
  serverTimestamp: jest.fn(),
}));

jest.mock('../../../src/features/auth/services/auth.service', () => ({
  AuthService: {
    ensureUserDocument: jest.fn(),
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
    signInWithGoogle: jest.fn(),
  },
}));

describe('AuthProvider and useAuth', () => {
  let authCallback: ((user: User | null) => Promise<void>) | null = null;
  const unsubscribeMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (onAuthStateChanged as jest.Mock).mockImplementation((_auth, callback) => {
      authCallback = callback;
      return unsubscribeMock;
    });
  });

  const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <AuthProvider>{children}</AuthProvider>
  );

  it('throws an error when useAuth is called outside AuthProvider', () => {
    const originalError = console.error;
    console.error = jest.fn();

    expect(() => {
      renderHook(() => useAuth());
    }).toThrow('useAuth must be used within an AuthProvider');

    console.error = originalError;
  });

  it('provides initial loading state true before auth state resolves', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.user).toBeNull();
    expect(result.current.profile).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('updates state when unauthenticated user (null) is emitted', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      if (authCallback) {
        await authCallback(null);
      }
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.user).toBeNull();
    expect(result.current.profile).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('updates state and populates profile when authenticated user is emitted', async () => {
    const mockUser = {
      uid: 'user-789',
      email: 'member@test.com',
      displayName: 'Member Test',
    } as unknown as User;

    const mockProfile = {
      uid: 'user-789',
      email: 'member@test.com',
      displayName: 'Member Test',
    };

    (AuthService.ensureUserDocument as jest.Mock).mockResolvedValueOnce(mockProfile);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      if (authCallback) {
        await authCallback(mockUser);
      }
    });

    expect(AuthService.ensureUserDocument).toHaveBeenCalledWith(mockUser);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.user).toBe(mockUser);
    expect(result.current.profile).toEqual(mockProfile);
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('handles ensureUserDocument error gracefully without breaking user state', async () => {
    const mockUser = {
      uid: 'user-fail',
      email: 'fail@test.com',
    } as unknown as User;

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    (AuthService.ensureUserDocument as jest.Mock).mockRejectedValueOnce(
      new Error('Firestore error')
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      if (authCallback) {
        await authCallback(mockUser);
      }
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.user).toBe(mockUser);
    expect(result.current.profile).toBeNull();
    expect(result.current.isAuthenticated).toBe(true);
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('exposes AuthService methods', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    const creds = { email: 'test@example.com', password: 'password123' };
    await act(async () => {
      await result.current.login(creds);
      await result.current.register({ ...creds, displayName: 'User' });
      await result.current.logout();
      await result.current.signInWithGoogle();
    });

    expect(AuthService.login).toHaveBeenCalledWith(creds);
    expect(AuthService.register).toHaveBeenCalledWith({ ...creds, displayName: 'User' });
    expect(AuthService.logout).toHaveBeenCalled();
    expect(AuthService.signInWithGoogle).toHaveBeenCalled();
  });

  it('unsubscribes from onAuthStateChanged on unmount', () => {
    const { unmount } = renderHook(() => useAuth(), { wrapper });

    unmount();

    expect(unsubscribeMock).toHaveBeenCalled();
  });
});
