import { Injectable, inject, signal, computed } from '@angular/core';
import {
  Auth,
  sendSignInLinkToEmail,
  signInWithEmailLink,
  isSignInWithEmailLink,
  signOut,
  onAuthStateChanged,
  User,
} from '@angular/fire/auth';
import { Firestore, doc, getDoc, setDoc, serverTimestamp } from '@angular/fire/firestore';

const EMAIL_STORAGE_KEY = 'emailForSignIn';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private auth = inject(Auth);
  private firestore = inject(Firestore);

  currentUser = signal<User | null>(null);
  isAuthenticated = computed(() => this.currentUser() !== null);
  isLoading = signal<boolean>(true);

  /** Resolves once Firebase has restored (or failed to restore) the auth session. */
  readonly authReady: Promise<void>;
  private resolveAuthReady!: () => void;

  constructor() {
    this.authReady = new Promise<void>((resolve) => {
      this.resolveAuthReady = resolve;
    });
    this.initAuthListener();
  }

  private initAuthListener(): void {
    onAuthStateChanged(this.auth, async (user) => {
      this.currentUser.set(user);
      this.isLoading.set(false);
      this.resolveAuthReady();

      if (user) {
        await this.ensureUserDocument(user);
      }
    });
  }

  async sendSignInLink(email: string): Promise<void> {
    const actionCodeSettings = {
      url: `${window.location.origin}/auth/verify`,
      handleCodeInApp: true,
    };

    await sendSignInLinkToEmail(this.auth, email, actionCodeSettings);
    window.localStorage.setItem(EMAIL_STORAGE_KEY, email);
  }

  async completeSignIn(url: string): Promise<void> {
    if (!isSignInWithEmailLink(this.auth, url)) {
      throw new Error('Invalid sign-in link');
    }

    let email = window.localStorage.getItem(EMAIL_STORAGE_KEY);
    if (!email) {
      email = window.prompt('Please provide your email for confirmation') || '';
    }

    if (!email) {
      throw new Error('Email is required to complete sign-in');
    }

    await signInWithEmailLink(this.auth, email, url);
    window.localStorage.removeItem(EMAIL_STORAGE_KEY);
  }

  async signOut(): Promise<void> {
    await signOut(this.auth);
  }

  private async ensureUserDocument(user: User): Promise<void> {
    const userRef = doc(this.firestore, `users/${user.uid}`);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      await setDoc(userRef, {
        email: user.email,
        displayName: user.displayName || user.email?.split('@')[0] || '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  }
}
