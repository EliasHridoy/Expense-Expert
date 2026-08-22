import { AuthService } from '../../../src/features/auth/services/auth.service';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
  signInWithPopup,
  GoogleAuthProvider,
  User,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Platform } from 'react-native';

jest.mock('firebase/auth', () => ({
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

jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(() => ({ type: 'firestore' })),
  doc: jest.fn(),
  getDoc: jest.fn(),
  setDoc: jest.fn(),
  serverTimestamp: jest.fn(() => 'MOCK_TIMESTAMP'),
}));

describe('AuthService', () => {
  const mockUser = {
    uid: 'user-123',
    email: 'test@example.com',
    displayName: 'Test User',
  } as unknown as User;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('trims email, authenticates with Firebase and ensures user document', async () => {
      (signInWithEmailAndPassword as jest.Mock).mockResolvedValueOnce({
        user: mockUser,
      });
      (getDoc as jest.Mock).mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          uid: 'user-123',
          email: 'test@example.com',
          displayName: 'Test User',
        }),
      });

      const result = await AuthService.login({
        email: '  test@example.com  ',
        password: 'password123',
      });

      expect(signInWithEmailAndPassword).toHaveBeenCalledWith(
        expect.anything(),
        'test@example.com',
        'password123'
      );
      expect(result).toBe(mockUser);
      expect(getDoc).toHaveBeenCalled();
    });
  });

  describe('register', () => {
    it('creates user with email/password, updates profile, and sets user document', async () => {
      (createUserWithEmailAndPassword as jest.Mock).mockResolvedValueOnce({
        user: mockUser,
      });
      (updateProfile as jest.Mock).mockResolvedValueOnce(undefined);
      (getDoc as jest.Mock).mockResolvedValueOnce({
        exists: () => false,
      });
      (setDoc as jest.Mock).mockResolvedValueOnce(undefined);

      const result = await AuthService.register({
        email: ' newuser@example.com ',
        password: 'password123',
        displayName: ' New User ',
      });

      expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(
        expect.anything(),
        'newuser@example.com',
        'password123'
      );
      expect(updateProfile).toHaveBeenCalledWith(mockUser, {
        displayName: 'New User',
      });
      expect(setDoc).toHaveBeenCalledWith(
        undefined,
        expect.objectContaining({
          uid: 'user-123',
          email: 'test@example.com',
          displayName: 'New User',
          createdAt: 'MOCK_TIMESTAMP',
          updatedAt: 'MOCK_TIMESTAMP',
        })
      );
      expect(result).toBe(mockUser);
    });

    it('creates user without calling updateProfile if displayName is empty', async () => {
      (createUserWithEmailAndPassword as jest.Mock).mockResolvedValueOnce({
        user: mockUser,
      });
      (getDoc as jest.Mock).mockResolvedValueOnce({
        exists: () => false,
      });
      (setDoc as jest.Mock).mockResolvedValueOnce(undefined);

      await AuthService.register({
        email: 'newuser@example.com',
        password: 'password123',
      });

      expect(updateProfile).not.toHaveBeenCalled();
    });
  });

  describe('ensureUserDocument', () => {
    it('creates a new Firestore document if one does not exist', async () => {
      const mockDocRef = { path: 'users/user-123' };
      (doc as jest.Mock).mockReturnValueOnce(mockDocRef);
      (getDoc as jest.Mock).mockResolvedValueOnce({
        exists: () => false,
      });
      (setDoc as jest.Mock).mockResolvedValueOnce(undefined);

      const profile = await AuthService.ensureUserDocument(mockUser);

      expect(doc).toHaveBeenCalledWith(expect.anything(), 'users', 'user-123');
      expect(setDoc).toHaveBeenCalledWith(mockDocRef, {
        uid: 'user-123',
        email: 'test@example.com',
        displayName: 'Test User',
        createdAt: 'MOCK_TIMESTAMP',
        updatedAt: 'MOCK_TIMESTAMP',
      });
      expect(profile).toEqual({
        uid: 'user-123',
        email: 'test@example.com',
        displayName: 'Test User',
      });
    });

    it('falls back to email prefix if user has no displayName', async () => {
      const anonymousUser = {
        uid: 'user-456',
        email: 'hello@world.com',
        displayName: null,
      } as unknown as User;

      (getDoc as jest.Mock).mockResolvedValueOnce({
        exists: () => false,
      });
      (setDoc as jest.Mock).mockResolvedValueOnce(undefined);

      const profile = await AuthService.ensureUserDocument(anonymousUser);

      expect(profile.displayName).toBe('hello');
    });

    it('returns existing profile data if document exists', async () => {
      const existingData = {
        uid: 'user-123',
        email: 'test@example.com',
        displayName: 'Existing Name',
        createdAt: '2026-01-01',
        updatedAt: '2026-01-02',
      };

      (getDoc as jest.Mock).mockResolvedValueOnce({
        exists: () => true,
        data: () => existingData,
      });

      const profile = await AuthService.ensureUserDocument(mockUser);

      expect(setDoc).not.toHaveBeenCalled();
      expect(profile).toEqual(existingData);
    });
  });

  describe('logout', () => {
    it('calls Firebase signOut', async () => {
      (signOut as jest.Mock).mockResolvedValueOnce(undefined);

      await AuthService.logout();

      expect(signOut).toHaveBeenCalledWith(expect.anything());
    });
  });

  describe('signInWithGoogle', () => {
    const originalPlatform = Platform.OS;

    afterEach(() => {
      Platform.OS = originalPlatform;
    });

    it('authenticates with popup on web and ensures user document', async () => {
      Platform.OS = 'web';
      (signInWithPopup as jest.Mock).mockResolvedValueOnce({
        user: mockUser,
      });
      (getDoc as jest.Mock).mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          uid: 'user-123',
          email: 'test@example.com',
          displayName: 'Test User',
        }),
      });

      const result = await AuthService.signInWithGoogle();

      expect(signInWithPopup).toHaveBeenCalled();
      expect(result).toBe(mockUser);
    });

    it('throws an error on non-web platforms', async () => {
      Platform.OS = 'ios';

      await expect(AuthService.signInWithGoogle()).rejects.toThrow(
        'Google Sign-In via popup is only supported on web'
      );
      expect(signInWithPopup).not.toHaveBeenCalled();
    });
  });
});
