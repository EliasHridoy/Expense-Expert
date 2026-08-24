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
import { auth, db } from '../../../config/firebase';
import { UserProfile, LoginCredentials, RegisterCredentials } from '../types/auth.types';

export const AuthService = {
  /** Sign in with email and password */
  async login({ email, password }: LoginCredentials): Promise<User> {
    const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
    await AuthService.ensureUserDocument(credential.user);
    return credential.user;
  },

  /** Register with email, password, and optional display name */
  async register({ email, password, displayName }: RegisterCredentials): Promise<User> {
    const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
    if (displayName && displayName.trim()) {
      await updateProfile(credential.user, { displayName: displayName.trim() });
    }
    await AuthService.ensureUserDocument(credential.user, displayName?.trim());
    return credential.user;
  },

  /** Web Google Sign In */
  async signInWithGoogle(): Promise<User> {
    if (Platform.OS !== 'web') {
      throw new Error('Google Sign-In via popup is only supported on web');
    }
    const provider = new GoogleAuthProvider();
    const credential = await signInWithPopup(auth, provider);
    await AuthService.ensureUserDocument(credential.user);
    return credential.user;
  },

  /** Sign out */
  async logout(): Promise<void> {
    await signOut(auth);
  },

  /** Synchronize user document in Firestore users/{uid} */
  async ensureUserDocument(user: User, customDisplayName?: string): Promise<UserProfile> {
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);

    const displayName =
      customDisplayName ||
      user.displayName ||
      user.email?.split('@')[0] ||
      'User';

    if (!userSnap.exists()) {
      const newProfile = {
        uid: user.uid,
        email: user.email || '',
        displayName,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      await setDoc(userRef, newProfile);
      return {
        uid: user.uid,
        email: user.email || '',
        displayName,
      };
    }

    const data = userSnap.data();
    return {
      uid: user.uid,
      email: data.email || user.email || '',
      displayName: data.displayName || displayName,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      ...data,
    };
  },

  /** Update profile data in Firestore users/{uid} */
  async updateProfileData(uid: string, data: Partial<UserProfile>): Promise<UserProfile> {
    const userRef = doc(db, 'users', uid);
    const updatePayload: Record<string, any> = {
      ...data,
      updatedAt: serverTimestamp(),
    };
    await setDoc(userRef, updatePayload, { merge: true });
    const snap = await getDoc(userRef);
    const updated = snap.data() || {};
    return {
      uid,
      email: updated.email || '',
      displayName: updated.displayName || '',
      ...updated,
    };
  },
};
