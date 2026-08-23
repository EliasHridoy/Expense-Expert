import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  initializeAuth,
  getReactNativePersistence,
  getAuth,
  Auth,
} from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

export const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || 'AIzaSyBoy87DRqSspwHhxsB6BKgVeDNcxJdXy-w',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || 'expense-expert-d155a.firebaseapp.com',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'expense-expert-d155a',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || 'expense-expert-d155a.firebasestorage.app',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '324719342364',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '1:324719342364:web:ebc95f68dc800dede140d9',
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID || 'G-7FG0N551WW',
};

// Singleton Firebase App instance
export const app: FirebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Platform-aware Auth persistence
let authInstance: Auth;
if (Platform.OS === 'web') {
  authInstance = getAuth(app);
} else {
  try {
    authInstance = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch (_error) {
    authInstance = getAuth(app);
  }
}

export const auth: Auth = authInstance;
export const db: Firestore = getFirestore(app);
