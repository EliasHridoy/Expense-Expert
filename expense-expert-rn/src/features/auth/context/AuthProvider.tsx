import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../../config/firebase';
import { AuthService } from '../services/auth.service';
import { AuthContextValue, UserProfile } from '../types/auth.types';
import { AuthContext } from './AuthContext';
import { RealtimeSyncManager } from '../../sync/services/RealtimeSyncManager';

export interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const logout = useCallback(async () => {
    RealtimeSyncManager.teardownAll();
    await AuthService.logout();
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          const userDoc = await AuthService.ensureUserDocument(firebaseUser);
          setProfile(userDoc);
        } catch (err) {
          console.error('Error ensuring user document:', err);
        }
      } else {
        RealtimeSyncManager.teardownAll();
        setProfile(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      profile,
      isAuthenticated: !!user,
      isLoading,
      login: AuthService.login,
      register: AuthService.register,
      logout,
      signInWithGoogle: AuthService.signInWithGoogle,
    }),
    [user, profile, isLoading, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
