import { User } from 'firebase/auth';

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
  createdAt?: any;
  updatedAt?: any;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  displayName?: string;
}

export interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<User>;
  register: (credentials: RegisterCredentials) => Promise<User>;
  logout: () => Promise<void>;
  signInWithGoogle: () => Promise<User>;
}
