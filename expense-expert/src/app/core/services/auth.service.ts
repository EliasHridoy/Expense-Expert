import { Injectable, inject, signal, computed } from '@angular/core';
import {
  Auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  FacebookAuthProvider,
  updateProfile,
  signOut,
  onAuthStateChanged,
  User,
} from '@angular/fire/auth';
import { Firestore, doc, getDoc, setDoc, serverTimestamp } from '@angular/fire/firestore';

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

  /** Register a new user with email and password */
  async register(email: string, password: string, displayName: string): Promise<void> {
    const credential = await createUserWithEmailAndPassword(this.auth, email, password);
    await updateProfile(credential.user, { displayName });
  }

  /** Sign in with email and password */
  async login(email: string, password: string): Promise<void> {
    await signInWithEmailAndPassword(this.auth, email, password);
  }

  /** Sign in with Google popup */
  async signInWithGoogle(): Promise<void> {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(this.auth, provider);
  }

  /** Sign in with Facebook popup */
  async signInWithFacebook(): Promise<void> {
    const provider = new FacebookAuthProvider();
    await signInWithPopup(this.auth, provider);
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
