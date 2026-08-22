import { createContext } from 'react';
import { AuthContextValue } from '../types/auth.types';

export const AuthContext = createContext<AuthContextValue | null>(null);
