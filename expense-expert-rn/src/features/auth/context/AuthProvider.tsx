import React, { useEffect, useState, useMemo } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../../config/firebase';
import { AuthService } from '../services/auth.service';
import { AuthContextValue, UserProfile } from '../types/auth.types';
import { AuthContext } from './AuthContext';

export interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

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
      logout: AuthService.logout,
      signInWithGoogle: AuthService.signInWithGoogle,
    }),
    [user, profile, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
