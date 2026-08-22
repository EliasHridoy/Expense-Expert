import { getAuthErrorMessage } from '../../../src/features/auth/utils/auth-errors';

describe('getAuthErrorMessage', () => {
  it('maps invalid credentials / user not found / wrong password correctly', () => {
    expect(getAuthErrorMessage('auth/user-not-found')).toBe('Invalid email or password');
    expect(getAuthErrorMessage('auth/wrong-password')).toBe('Invalid email or password');
    expect(getAuthErrorMessage('auth/invalid-credential')).toBe('Invalid email or password');
  });

  it('maps email already in use error', () => {
    expect(getAuthErrorMessage('auth/email-already-in-use')).toBe('An account with this email already exists');
  });

  it('maps weak password error', () => {
    expect(getAuthErrorMessage('auth/weak-password')).toBe('Password must be at least 6 characters');
  });

  it('maps invalid email error', () => {
    expect(getAuthErrorMessage('auth/invalid-email')).toBe('Invalid email address');
  });

  it('maps too many requests error', () => {
    expect(getAuthErrorMessage('auth/too-many-requests')).toBe('Too many attempts. Please try again later.');
  });

  it('maps user disabled error', () => {
    expect(getAuthErrorMessage('auth/user-disabled')).toBe('This account has been disabled');
  });

  it('maps network request failed error', () => {
    expect(getAuthErrorMessage('auth/network-request-failed')).toBe('Network error. Please check your internet connection.');
  });

  it('maps popup closed by user error', () => {
    expect(getAuthErrorMessage('auth/popup-closed-by-user')).toBe('Sign-in cancelled');
  });

  it('returns default fallback message for unknown error codes', () => {
    expect(getAuthErrorMessage('auth/unknown-error')).toBe('Authentication failed. Please try again.');
    expect(getAuthErrorMessage('')).toBe('Authentication failed. Please try again.');
  });
});
