import React from 'react';
import { render, renderHook, act, fireEvent, waitFor } from '@testing-library/react-native';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
  signInWithPopup,
  User,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Platform } from 'react-native';

import { AuthProvider } from '../../src/features/auth/context/AuthProvider';
import { useAuth } from '../../src/features/auth/hooks/useAuth';
import { AuthService } from '../../src/features/auth/services/auth.service';
import { LoginForm } from '../../src/features/auth/components/LoginForm';
import { RegisterForm } from '../../src/features/auth/components/RegisterForm';
import { RealtimeSyncManager } from '../../src/features/sync/services/RealtimeSyncManager';

// Router Navigation Mocks
const mockPush = jest.fn();
const mockReplace = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
}));

// Firebase Auth Mocks
jest.mock('firebase/auth', () => ({
  onAuthStateChanged: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  updateProfile: jest.fn(),
  signOut: jest.fn(),
  signInWithPopup: jest.fn(),
  GoogleAuthProvider: jest.fn(),
  getAuth: jest.fn(() => ({})),
  initializeAuth: jest.fn(() => ({})),
  getReactNativePersistence: jest.fn(() => ({})),
}));

// Firebase Firestore Mocks
jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(() => ({ type: 'firestore' })),
  doc: jest.fn(),
  getDoc: jest.fn(),
  setDoc: jest.fn(),
  serverTimestamp: jest.fn(() => '2026-08-23T12:00:00.000Z'),
}));

// ============================================================================
// RICH DUMMY DATA FIXTURES
// ============================================================================

export const DUMMY_USERS = {
  ALICE: {
    credentials: {
      email: 'alice.adams@expense-expert.io',
      password: 'PasswordAlice123!',
      displayName: 'Alice Adams',
    },
    firebaseUser: {
      uid: 'usr_alice_101',
      email: 'alice.adams@expense-expert.io',
      displayName: 'Alice Adams',
      emailVerified: true,
    } as unknown as User,
    firestoreDoc: {
      uid: 'usr_alice_101',
      email: 'alice.adams@expense-expert.io',
      displayName: 'Alice Adams',
      createdAt: '2026-01-15T08:00:00.000Z',
      updatedAt: '2026-08-20T10:30:00.000Z',
    },
  },
  BOB: {
    credentials: {
      email: 'bob.builder@fintech.dev',
      password: 'PasswordBob456#',
      displayName: 'Bob Builder',
    },
    firebaseUser: {
      uid: 'usr_bob_202',
      email: 'bob.builder@fintech.dev',
      displayName: 'Bob Builder',
      emailVerified: true,
    } as unknown as User,
    firestoreDoc: {
      uid: 'usr_bob_202',
      email: 'bob.builder@fintech.dev',
      displayName: 'Bob Builder',
      createdAt: '2026-03-10T12:00:00.000Z',
      updatedAt: '2026-08-22T15:45:00.000Z',
    },
  },
  CHARLIE: {
    credentials: {
      email: 'charlie.cloud@enterprise.co',
      password: 'PasswordCharlie789$',
      displayName: 'Charlie Cloud',
    },
    firebaseUser: {
      uid: 'usr_charlie_303',
      email: 'charlie.cloud@enterprise.co',
      displayName: 'Charlie Cloud',
      emailVerified: true,
    } as unknown as User,
    firestoreDoc: {
      uid: 'usr_charlie_303',
      email: 'charlie.cloud@enterprise.co',
      displayName: 'Charlie Cloud',
      createdAt: '2026-06-01T09:00:00.000Z',
      updatedAt: '2026-08-23T09:00:00.000Z',
    },
  },
  DIANA: {
    credentials: {
      email: 'diana.dev@startup.io',
      password: 'PasswordDiana2026!',
      displayName: 'Diana Developer',
    },
    firebaseUser: {
      uid: 'usr_diana_404',
      email: 'diana.dev@startup.io',
      displayName: 'Diana Developer',
      emailVerified: false,
    } as unknown as User,
    firestoreDoc: {
      uid: 'usr_diana_404',
      email: 'diana.dev@startup.io',
      displayName: 'Diana Developer',
      createdAt: '2026-08-23T12:00:00.000Z',
      updatedAt: '2026-08-23T12:00:00.000Z',
    },
  },
  ANONYMOUS: {
    credentials: {
      email: 'anonymous.user@webmail.org',
      password: 'PassWithoutName123!',
    },
    firebaseUser: {
      uid: 'usr_anon_505',
      email: 'anonymous.user@webmail.org',
      displayName: null,
      emailVerified: false,
    } as unknown as User,
  },
};

describe('Authentication & Profile Module - Dummy Data Simulation Suite', () => {
  let authStateCallback: ((user: User | null) => Promise<void>) | null = null;
  const mockUnsubscribe = jest.fn();
  let inMemoryFirestore: Map<string, any> = new Map();

  const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <AuthProvider>{children}</AuthProvider>
  );

  beforeEach(() => {
    jest.clearAllMocks();
    RealtimeSyncManager.teardownAll();
    inMemoryFirestore.clear();

    // Seed in-memory Firestore with pre-existing dummy users
    inMemoryFirestore.set(
      `users/${DUMMY_USERS.ALICE.firebaseUser.uid}`,
      DUMMY_USERS.ALICE.firestoreDoc
    );
    inMemoryFirestore.set(
      `users/${DUMMY_USERS.BOB.firebaseUser.uid}`,
      DUMMY_USERS.BOB.firestoreDoc
    );
    inMemoryFirestore.set(
      `users/${DUMMY_USERS.CHARLIE.firebaseUser.uid}`,
      DUMMY_USERS.CHARLIE.firestoreDoc
    );

    // Mock onAuthStateChanged listener registration
    (onAuthStateChanged as jest.Mock).mockImplementation((_auth, callback) => {
      authStateCallback = callback;
      return mockUnsubscribe;
    });

    // Mock doc reference creator
    (doc as jest.Mock).mockImplementation((_db, collection, docId) => ({
      path: `${collection}/${docId}`,
      id: docId,
    }));

    // Mock Firestore getDoc reflecting in-memory database
    (getDoc as jest.Mock).mockImplementation((docRef) => {
      const data = inMemoryFirestore.get(docRef.path);
      return Promise.resolve({
        exists: () => !!data,
        data: () => data,
      });
    });

    // Mock Firestore setDoc persisting to in-memory database
    (setDoc as jest.Mock).mockImplementation((docRef, payload) => {
      inMemoryFirestore.set(docRef.path, payload);
      return Promise.resolve();
    });

    // Default signOut implementation
    (signOut as jest.Mock).mockImplementation(async () => {
      if (authStateCallback) {
        await authStateCallback(null);
      }
    });
  });

  afterEach(() => {
    RealtimeSyncManager.teardownAll();
  });

  // ==========================================================================
  // SCENARIO 1: User Registration Simulation & Validation
  // ==========================================================================
  describe('1. User Registration Simulation & Validation', () => {
    it('successfully registers a new user with validation, creates Firestore profile, and syncs auth state', async () => {
      const targetUser = DUMMY_USERS.DIANA;

      (createUserWithEmailAndPassword as jest.Mock).mockResolvedValueOnce({
        user: targetUser.firebaseUser,
      });
      (updateProfile as jest.Mock).mockResolvedValueOnce(undefined);

      const { getByTestId, getByPlaceholderText, queryByText } = render(
        <AuthProvider>
          <RegisterForm />
        </AuthProvider>
      );

      // Fill in registration form inputs
      fireEvent.changeText(
        getByPlaceholderText('John Doe'),
        targetUser.credentials.displayName
      );
      fireEvent.changeText(
        getByPlaceholderText('you@example.com'),
        targetUser.credentials.email
      );
      fireEvent.changeText(
        getByTestId('register-password-input'),
        targetUser.credentials.password
      );
      fireEvent.changeText(
        getByTestId('register-confirm-password-input'),
        targetUser.credentials.password
      );

      // Verify no client validation errors
      expect(queryByText('Password must be at least 6 characters')).toBeNull();
      expect(queryByText('Passwords do not match')).toBeNull();

      const submitButton = getByTestId('register-submit-button');
      expect(submitButton.props.accessibilityState.disabled).toBe(false);

      // Submit Registration
      await act(async () => {
        fireEvent.press(submitButton);
      });

      await waitFor(() => {
        expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(
          expect.anything(),
          targetUser.credentials.email,
          targetUser.credentials.password
        );
        expect(updateProfile).toHaveBeenCalledWith(targetUser.firebaseUser, {
          displayName: targetUser.credentials.displayName,
        });
        expect(setDoc).toHaveBeenCalledWith(
          expect.objectContaining({ path: `users/${targetUser.firebaseUser.uid}` }),
          expect.objectContaining({
            uid: targetUser.firebaseUser.uid,
            email: targetUser.credentials.email,
            displayName: targetUser.credentials.displayName,
          })
        );
        expect(mockReplace).toHaveBeenCalledWith('/');
      });

      // Verify Firestore in-memory state contains new user
      const storedProfile = inMemoryFirestore.get(`users/${targetUser.firebaseUser.uid}`);
      expect(storedProfile).toBeDefined();
      expect(storedProfile.displayName).toBe(targetUser.credentials.displayName);
      expect(storedProfile.email).toBe(targetUser.credentials.email);
    });

    it('enforces client-side validation when password is too short (< 6 chars)', async () => {
      const { getByTestId, getByPlaceholderText, getByText } = render(
        <AuthProvider>
          <RegisterForm />
        </AuthProvider>
      );

      fireEvent.changeText(getByPlaceholderText('John Doe'), 'Short Pass User');
      fireEvent.changeText(getByPlaceholderText('you@example.com'), 'short@test.com');
      fireEvent.changeText(getByTestId('register-password-input'), '12345');
      fireEvent.changeText(getByTestId('register-confirm-password-input'), '12345');

      expect(getByText('Password must be at least 6 characters')).toBeTruthy();
      expect(getByTestId('register-submit-button').props.accessibilityState.disabled).toBe(true);

      await act(async () => {
        fireEvent.press(getByTestId('register-submit-button'));
      });
      expect(createUserWithEmailAndPassword).not.toHaveBeenCalled();
    });

    it('enforces client-side validation when password and confirm password do not match', async () => {
      const { getByTestId, getByPlaceholderText, getByText } = render(
        <AuthProvider>
          <RegisterForm />
        </AuthProvider>
      );

      fireEvent.changeText(getByPlaceholderText('John Doe'), 'Mismatch User');
      fireEvent.changeText(getByPlaceholderText('you@example.com'), 'mismatch@test.com');
      fireEvent.changeText(getByTestId('register-password-input'), 'SecurePassword123');
      fireEvent.changeText(getByTestId('register-confirm-password-input'), 'DifferentPassword456');

      expect(getByText('Passwords do not match')).toBeTruthy();
      expect(getByTestId('register-submit-button').props.accessibilityState.disabled).toBe(true);

      await act(async () => {
        fireEvent.press(getByTestId('register-submit-button'));
      });
      expect(createUserWithEmailAndPassword).not.toHaveBeenCalled();
    });

    it('handles duplicate account error (auth/email-already-in-use) gracefully with user banner', async () => {
      (createUserWithEmailAndPassword as jest.Mock).mockRejectedValueOnce({
        code: 'auth/email-already-in-use',
      });

      const { getByTestId, getByPlaceholderText, findByText } = render(
        <AuthProvider>
          <RegisterForm />
        </AuthProvider>
      );

      fireEvent.changeText(
        getByPlaceholderText('John Doe'),
        DUMMY_USERS.ALICE.credentials.displayName
      );
      fireEvent.changeText(
        getByPlaceholderText('you@example.com'),
        DUMMY_USERS.ALICE.credentials.email
      );
      fireEvent.changeText(
        getByTestId('register-password-input'),
        DUMMY_USERS.ALICE.credentials.password
      );
      fireEvent.changeText(
        getByTestId('register-confirm-password-input'),
        DUMMY_USERS.ALICE.credentials.password
      );

      await act(async () => {
        fireEvent.press(getByTestId('register-submit-button'));
      });

      const errorBanner = await findByText('An account with this email already exists');
      expect(errorBanner).toBeTruthy();
      expect(getByTestId('register-error-banner')).toBeTruthy();
      expect(mockReplace).not.toHaveBeenCalled();
    });

    it('handles weak password error from backend (auth/weak-password) in register form', async () => {
      (createUserWithEmailAndPassword as jest.Mock).mockRejectedValueOnce({
        code: 'auth/weak-password',
      });

      const { getByTestId, getByPlaceholderText, findByText } = render(
        <AuthProvider>
          <RegisterForm />
        </AuthProvider>
      );

      fireEvent.changeText(getByPlaceholderText('John Doe'), 'Weak User');
      fireEvent.changeText(getByPlaceholderText('you@example.com'), 'weak@user.com');
      fireEvent.changeText(getByTestId('register-password-input'), 'abcdef');
      fireEvent.changeText(getByTestId('register-confirm-password-input'), 'abcdef');

      await act(async () => {
        fireEvent.press(getByTestId('register-submit-button'));
      });

      const errorBanner = await findByText('Password must be at least 6 characters');
      expect(errorBanner).toBeTruthy();
      expect(getByTestId('register-error-banner')).toBeTruthy();
    });

    it('falls back to email prefix for displayName when registering without explicit display name', async () => {
      const anonUser = DUMMY_USERS.ANONYMOUS;

      (createUserWithEmailAndPassword as jest.Mock).mockResolvedValueOnce({
        user: anonUser.firebaseUser,
      });

      const user = await AuthService.register({
        email: anonUser.credentials.email,
        password: anonUser.credentials.password,
      });

      expect(user).toBe(anonUser.firebaseUser);
      expect(updateProfile).not.toHaveBeenCalled();

      const storedProfile = inMemoryFirestore.get(`users/${anonUser.firebaseUser.uid}`);
      expect(storedProfile).toBeDefined();
      expect(storedProfile.displayName).toBe('anonymous.user');
    });

    it('triggers custom onSuccess callback upon successful registration', async () => {
      const targetUser = DUMMY_USERS.DIANA;
      const onSuccessMock = jest.fn();

      (createUserWithEmailAndPassword as jest.Mock).mockResolvedValueOnce({
        user: targetUser.firebaseUser,
      });
      (updateProfile as jest.Mock).mockResolvedValueOnce(undefined);

      const { getByTestId, getByPlaceholderText } = render(
        <AuthProvider>
          <RegisterForm onSuccess={onSuccessMock} />
        </AuthProvider>
      );

      fireEvent.changeText(
        getByPlaceholderText('John Doe'),
        targetUser.credentials.displayName
      );
      fireEvent.changeText(
        getByPlaceholderText('you@example.com'),
        targetUser.credentials.email
      );
      fireEvent.changeText(
        getByTestId('register-password-input'),
        targetUser.credentials.password
      );
      fireEvent.changeText(
        getByTestId('register-confirm-password-input'),
        targetUser.credentials.password
      );

      await act(async () => {
        fireEvent.press(getByTestId('register-submit-button'));
      });

      await waitFor(() => {
        expect(onSuccessMock).toHaveBeenCalledTimes(1);
        expect(mockReplace).not.toHaveBeenCalled();
      });
    });

    it('navigates to login screen when clicking sign in link', async () => {
      const { getByTestId } = render(
        <AuthProvider>
          <RegisterForm />
        </AuthProvider>
      );

      await act(async () => {
        fireEvent.press(getByTestId('register-login-link'));
      });

      expect(mockPush).toHaveBeenCalledWith('/(auth)/login');
    });
  });

  // ==========================================================================
  // SCENARIO 2: User Login & Firestore Profile Hydration
  // ==========================================================================
  describe('2. User Login & Firestore Profile Hydration', () => {
    it('authenticates user with credentials and hydrates Firestore profile into AuthProvider', async () => {
      const alice = DUMMY_USERS.ALICE;

      (signInWithEmailAndPassword as jest.Mock).mockResolvedValueOnce({
        user: alice.firebaseUser,
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      // Trigger Login through Auth Hook
      await act(async () => {
        await result.current.login({
          email: alice.credentials.email,
          password: alice.credentials.password,
        });
      });

      expect(signInWithEmailAndPassword).toHaveBeenCalledWith(
        expect.anything(),
        alice.credentials.email,
        alice.credentials.password
      );

      // Simulate Firebase Auth state transition after login
      await act(async () => {
        if (authStateCallback) {
          await authStateCallback(alice.firebaseUser);
        }
      });

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toBe(alice.firebaseUser);
      expect(result.current.profile).toEqual(alice.firestoreDoc);
      expect(result.current.profile?.displayName).toBe('Alice Adams');
      expect(result.current.isLoading).toBe(false);
    });

    it('renders LoginForm, submits credentials, and handles wrong-password error banner', async () => {
      (signInWithEmailAndPassword as jest.Mock).mockRejectedValueOnce({
        code: 'auth/wrong-password',
      });

      const { getByTestId, getByPlaceholderText, findByText } = render(
        <AuthProvider>
          <LoginForm />
        </AuthProvider>
      );

      fireEvent.changeText(
        getByPlaceholderText('you@example.com'),
        DUMMY_USERS.ALICE.credentials.email
      );
      fireEvent.changeText(getByTestId('login-password-input'), 'WrongSecret999!');

      await act(async () => {
        fireEvent.press(getByTestId('login-submit-button'));
      });

      const errorBanner = await findByText('Invalid email or password');
      expect(errorBanner).toBeTruthy();
      expect(getByTestId('login-error-banner')).toBeTruthy();
      expect(mockReplace).not.toHaveBeenCalled();
    });

    it('handles non-existent account error (auth/user-not-found) on login', async () => {
      (signInWithEmailAndPassword as jest.Mock).mockRejectedValueOnce({
        code: 'auth/user-not-found',
      });

      const { getByTestId, getByPlaceholderText, findByText } = render(
        <AuthProvider>
          <LoginForm />
        </AuthProvider>
      );

      fireEvent.changeText(
        getByPlaceholderText('you@example.com'),
        'ghost.user@doesnotexist.com'
      );
      fireEvent.changeText(getByTestId('login-password-input'), 'AnyPassword123');

      await act(async () => {
        fireEvent.press(getByTestId('login-submit-button'));
      });

      const errorBanner = await findByText('Invalid email or password');
      expect(errorBanner).toBeTruthy();
    });

    it('handles invalid-credential error code on login', async () => {
      (signInWithEmailAndPassword as jest.Mock).mockRejectedValueOnce({
        code: 'auth/invalid-credential',
      });

      const { getByTestId, getByPlaceholderText, findByText } = render(
        <AuthProvider>
          <LoginForm />
        </AuthProvider>
      );

      fireEvent.changeText(
        getByPlaceholderText('you@example.com'),
        'invalid.credential@test.com'
      );
      fireEvent.changeText(getByTestId('login-password-input'), 'AnyPass123');

      await act(async () => {
        fireEvent.press(getByTestId('login-submit-button'));
      });

      const errorBanner = await findByText('Invalid email or password');
      expect(errorBanner).toBeTruthy();
    });

    it('handles Google Sign-In on Web platform and hydrates profile', async () => {
      const originalPlatform = Platform.OS;
      Platform.OS = 'web';

      const bob = DUMMY_USERS.BOB;
      (signInWithPopup as jest.Mock).mockResolvedValueOnce({
        user: bob.firebaseUser,
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.signInWithGoogle();
      });

      expect(signInWithPopup).toHaveBeenCalled();

      // Trigger Firebase Auth state update
      await act(async () => {
        if (authStateCallback) {
          await authStateCallback(bob.firebaseUser);
        }
      });

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toBe(bob.firebaseUser);
      expect(result.current.profile).toEqual(bob.firestoreDoc);

      Platform.OS = originalPlatform;
    });

    it('navigates to register screen when clicking sign up link on LoginForm', async () => {
      const { getByTestId } = render(
        <AuthProvider>
          <LoginForm />
        </AuthProvider>
      );

      await act(async () => {
        fireEvent.press(getByTestId('login-register-link'));
      });

      expect(mockPush).toHaveBeenCalledWith('/(auth)/register');
    });
  });

  // ==========================================================================
  // SCENARIO 3: Session Persistence & Restoration upon App Reload
  // ==========================================================================
  describe('3. Session Persistence & Restoration upon App Reload', () => {
    it('restores persisted session for Bob on app cold start / reload', async () => {
      const bob = DUMMY_USERS.BOB;

      // Mount provider while in initial loading state
      const { result } = renderHook(() => useAuth(), { wrapper });
      expect(result.current.isLoading).toBe(true);
      expect(result.current.isAuthenticated).toBe(false);

      // Simulate Firebase Auth initializing with cached user from AsyncStorage/persistence
      await act(async () => {
        if (authStateCallback) {
          await authStateCallback(bob.firebaseUser);
        }
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user?.uid).toBe(bob.firebaseUser.uid);
      expect(result.current.profile?.displayName).toBe('Bob Builder');
      expect(result.current.profile?.email).toBe(bob.credentials.email);
    });

    it('initializes in unauthenticated state when no persisted session exists on app cold start', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });
      expect(result.current.isLoading).toBe(true);

      // Simulate Firebase Auth resolving null (guest/unauthenticated)
      await act(async () => {
        if (authStateCallback) {
          await authStateCallback(null);
        }
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
      expect(result.current.profile).toBeNull();
    });

    it('resiliently maintains user auth even if Firestore profile fetch encounters error on reload', async () => {
      const charlie = DUMMY_USERS.CHARLIE;
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      // Simulate temporary Firestore network timeout / read failure
      (getDoc as jest.Mock).mockRejectedValueOnce(new Error('Firestore connectivity error'));

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        if (authStateCallback) {
          await authStateCallback(charlie.firebaseUser);
        }
      });

      // User should still be authenticated, profile null, loading completed
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toBe(charlie.firebaseUser);
      expect(result.current.profile).toBeNull();
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('unsubscribes from onAuthStateChanged when AuthProvider unmounts', () => {
      const { unmount } = renderHook(() => useAuth(), { wrapper });
      unmount();
      expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
    });
  });

  // ==========================================================================
  // SCENARIO 4: Multi-User Account Switching & Session Isolation
  // ==========================================================================
  describe('4. Multi-User Account Switching & Session Isolation', () => {
    it('switches between multiple dummy users (Alice -> Bob -> Charlie) ensuring complete session and sync isolation', async () => {
      const alice = DUMMY_USERS.ALICE;
      const bob = DUMMY_USERS.BOB;
      const charlie = DUMMY_USERS.CHARLIE;

      const aliceExpenseUnsub = jest.fn();
      const aliceBudgetUnsub = jest.fn();
      const bobExpenseUnsub = jest.fn();
      const bobCategoryUnsub = jest.fn();
      const charlieExpenseUnsub = jest.fn();

      const { result } = renderHook(() => useAuth(), { wrapper });

      // ----------------------------------------------------------------------
      // Step 1: Alice logs in and registers active domain listeners
      // ----------------------------------------------------------------------
      await act(async () => {
        if (authStateCallback) {
          await authStateCallback(alice.firebaseUser);
        }
      });

      expect(result.current.user?.uid).toBe(alice.firebaseUser.uid);
      expect(result.current.profile?.displayName).toBe('Alice Adams');

      RealtimeSyncManager.register(`expenses_${alice.firebaseUser.uid}_2026-08`, () => aliceExpenseUnsub);
      RealtimeSyncManager.register(`budgets_${alice.firebaseUser.uid}_2026-08`, () => aliceBudgetUnsub);
      expect(RealtimeSyncManager.getActiveCount()).toBe(2);
      expect(RealtimeSyncManager.hasSubscription(`expenses_${alice.firebaseUser.uid}_2026-08`)).toBe(true);

      // ----------------------------------------------------------------------
      // Step 2: Alice logs out -> triggers teardown of all Alice's subscriptions
      // ----------------------------------------------------------------------
      await act(async () => {
        await result.current.logout();
      });

      expect(aliceExpenseUnsub).toHaveBeenCalledTimes(1);
      expect(aliceBudgetUnsub).toHaveBeenCalledTimes(1);
      expect(RealtimeSyncManager.getActiveCount()).toBe(0);
      expect(result.current.user).toBeNull();
      expect(result.current.profile).toBeNull();

      // ----------------------------------------------------------------------
      // Step 3: Bob logs in -> hydrates Bob's profile & registers Bob's listeners
      // ----------------------------------------------------------------------
      await act(async () => {
        if (authStateCallback) {
          await authStateCallback(bob.firebaseUser);
        }
      });

      expect(result.current.user?.uid).toBe(bob.firebaseUser.uid);
      expect(result.current.profile?.displayName).toBe('Bob Builder');

      RealtimeSyncManager.register(`expenses_${bob.firebaseUser.uid}_2026-08`, () => bobExpenseUnsub);
      RealtimeSyncManager.register(`categories_${bob.firebaseUser.uid}`, () => bobCategoryUnsub);

      expect(RealtimeSyncManager.getActiveCount()).toBe(2);
      expect(RealtimeSyncManager.hasSubscription(`expenses_${bob.firebaseUser.uid}_2026-08`)).toBe(true);
      expect(RealtimeSyncManager.hasSubscription(`expenses_${alice.firebaseUser.uid}_2026-08`)).toBe(false);

      // ----------------------------------------------------------------------
      // Step 4: Direct auth state transition to Charlie (e.g. account switch)
      // ----------------------------------------------------------------------
      // Simulate transition through null / switch
      await act(async () => {
        if (authStateCallback) {
          await authStateCallback(null);
        }
      });

      expect(bobExpenseUnsub).toHaveBeenCalledTimes(1);
      expect(bobCategoryUnsub).toHaveBeenCalledTimes(1);
      expect(RealtimeSyncManager.getActiveCount()).toBe(0);

      await act(async () => {
        if (authStateCallback) {
          await authStateCallback(charlie.firebaseUser);
        }
      });

      expect(result.current.user?.uid).toBe(charlie.firebaseUser.uid);
      expect(result.current.profile?.displayName).toBe('Charlie Cloud');

      RealtimeSyncManager.register(`expenses_${charlie.firebaseUser.uid}_2026-08`, () => charlieExpenseUnsub);
      expect(RealtimeSyncManager.getActiveCount()).toBe(1);
      expect(RealtimeSyncManager.hasSubscription(`expenses_${charlie.firebaseUser.uid}_2026-08`)).toBe(true);

      // Teardown Charlie on test completion
      await act(async () => {
        await result.current.logout();
      });
      expect(charlieExpenseUnsub).toHaveBeenCalledTimes(1);
      expect(RealtimeSyncManager.getActiveCount()).toBe(0);
    });
  });

  // ==========================================================================
  // SCENARIO 5: Auth Logout & Deterministic Sync Teardown
  // ==========================================================================
  describe('5. Auth Logout & Deterministic Sync Teardown', () => {
    it('executes deterministic teardown of all multi-domain listeners on explicit logout', async () => {
      const user = DUMMY_USERS.ALICE;
      const expenseUnsub = jest.fn();
      const categoryUnsub = jest.fn();
      const budgetUnsub = jest.fn();
      const dashboardUnsub = jest.fn();

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        if (authStateCallback) {
          await authStateCallback(user.firebaseUser);
        }
      });

      // Register subscriptions across 4 distinct domains
      RealtimeSyncManager.register(`expenses_${user.firebaseUser.uid}_2026-08`, () => expenseUnsub);
      RealtimeSyncManager.register(`categories_${user.firebaseUser.uid}`, () => categoryUnsub);
      RealtimeSyncManager.register(`budgets_${user.firebaseUser.uid}_2026-08`, () => budgetUnsub);
      RealtimeSyncManager.register(`dashboard_summary_${user.firebaseUser.uid}`, () => dashboardUnsub);

      expect(RealtimeSyncManager.getActiveCount()).toBe(4);

      // Perform explicit logout
      await act(async () => {
        await result.current.logout();
      });

      expect(expenseUnsub).toHaveBeenCalledTimes(1);
      expect(categoryUnsub).toHaveBeenCalledTimes(1);
      expect(budgetUnsub).toHaveBeenCalledTimes(1);
      expect(dashboardUnsub).toHaveBeenCalledTimes(1);
      expect(RealtimeSyncManager.getActiveCount()).toBe(0);
      expect(signOut).toHaveBeenCalled();
    });

    it('performs deterministic teardown when auth state becomes null via token expiration/invalidation', async () => {
      const user = DUMMY_USERS.BOB;
      const sub1 = jest.fn();
      const sub2 = jest.fn();

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        if (authStateCallback) {
          await authStateCallback(user.firebaseUser);
        }
      });

      RealtimeSyncManager.register('key_1', () => sub1);
      RealtimeSyncManager.register('key_2', () => sub2);
      expect(RealtimeSyncManager.getActiveCount()).toBe(2);

      // Simulate unauthenticated callback triggered externally
      await act(async () => {
        if (authStateCallback) {
          await authStateCallback(null);
        }
      });

      expect(sub1).toHaveBeenCalledTimes(1);
      expect(sub2).toHaveBeenCalledTimes(1);
      expect(RealtimeSyncManager.getActiveCount()).toBe(0);
      expect(result.current.user).toBeNull();
      expect(result.current.profile).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('tolerates individual listener unsubscription failure during teardown without blocking other unsubscriptions', () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      const faultyUnsub = jest.fn(() => {
        throw new Error('Teardown listener failure');
      });
      const healthyUnsub = jest.fn();

      RealtimeSyncManager.register('faulty_key', () => faultyUnsub);
      RealtimeSyncManager.register('healthy_key', () => healthyUnsub);

      expect(RealtimeSyncManager.getActiveCount()).toBe(2);

      expect(() => {
        RealtimeSyncManager.teardownAll();
      }).not.toThrow();

      expect(faultyUnsub).toHaveBeenCalledTimes(1);
      expect(healthyUnsub).toHaveBeenCalledTimes(1);
      expect(RealtimeSyncManager.getActiveCount()).toBe(0);
      expect(consoleWarnSpy).toHaveBeenCalled();
      consoleWarnSpy.mockRestore();
    });
  });
});
