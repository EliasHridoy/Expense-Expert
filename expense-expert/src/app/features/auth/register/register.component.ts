import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, RouterLink, LoadingSpinnerComponent],
  template: `
    <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Create account</h2>
    <p class="text-gray-500 dark:text-gray-400 text-sm mb-6">Start tracking your expenses today.</p>

    <form (ngSubmit)="register()">
      <div class="mb-4">
        <label for="displayName" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Display name
        </label>
        <input
          id="displayName"
          type="text"
          [(ngModel)]="displayName"
          name="displayName"
          required
          placeholder="John Doe"
          class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-4 py-2.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition-colors"
          [disabled]="isLoading()"
        />
      </div>

      <div class="mb-4">
        <label for="email" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Email address
        </label>
        <input
          id="email"
          type="email"
          [(ngModel)]="email"
          name="email"
          required
          placeholder="you&#64;example.com"
          class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-4 py-2.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition-colors"
          [disabled]="isLoading()"
        />
      </div>

      <div class="mb-4">
        <label for="password" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Password
        </label>
        <input
          id="password"
          type="password"
          [(ngModel)]="password"
          name="password"
          required
          minlength="6"
          placeholder="••••••••"
          class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-4 py-2.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition-colors"
          [disabled]="isLoading()"
        />
      </div>

      <div class="mb-5">
        <label for="confirmPassword" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Confirm password
        </label>
        <input
          id="confirmPassword"
          type="password"
          [(ngModel)]="confirmPassword"
          name="confirmPassword"
          required
          placeholder="••••••••"
          class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-4 py-2.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition-colors"
          [disabled]="isLoading()"
        />
        @if (password && confirmPassword && password !== confirmPassword) {
          <p class="text-red-500 text-xs mt-1">Passwords do not match</p>
        }
      </div>

      <button
        type="submit"
        [disabled]="isLoading() || !isFormValid()"
        class="w-full rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        @if (isLoading()) {
          <app-loading-spinner size="sm" />
        } @else {
          Create account
        }
      </button>
    </form>

    <!-- Divider -->
    <div class="relative my-6">
      <div class="absolute inset-0 flex items-center">
        <div class="w-full border-t border-gray-300 dark:border-gray-600"></div>
      </div>
      <div class="relative flex justify-center text-sm">
        <span class="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">Or sign up with</span>
      </div>
    </div>

    <!-- Social Login Buttons -->
    <div class="space-y-3">
      <button
        (click)="googleSignUp()"
        [disabled]="isLoading()"
        class="w-full flex items-center justify-center gap-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <svg class="h-5 w-5" viewBox="0 0 24 24">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        Google
      </button>

      <button
        (click)="facebookSignUp()"
        [disabled]="isLoading()"
        class="w-full flex items-center justify-center gap-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-[#1877F2] px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-[#166FE5] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
        Facebook
      </button>
    </div>

    <!-- Sign in link -->
    <p class="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
      Already have an account?
      <a routerLink="/auth/login" class="font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300">
        Sign in
      </a>
    </p>
  `,
})
export class RegisterComponent {
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private router = inject(Router);

  displayName = '';
  email = '';
  password = '';
  confirmPassword = '';
  isLoading = signal(false);

  isFormValid(): boolean {
    return !!(
      this.displayName &&
      this.email &&
      this.password &&
      this.confirmPassword &&
      this.password === this.confirmPassword &&
      this.password.length >= 6
    );
  }

  async register(): Promise<void> {
    if (!this.isFormValid()) return;

    this.isLoading.set(true);
    try {
      await this.authService.register(this.email, this.password, this.displayName);
      this.toastService.success('Account created successfully!');
      this.router.navigate(['/dashboard']);
    } catch (error: any) {
      const msg = this.getErrorMessage(error.code);
      this.toastService.error(msg);
    } finally {
      this.isLoading.set(false);
    }
  }

  async googleSignUp(): Promise<void> {
    this.isLoading.set(true);
    try {
      await this.authService.signInWithGoogle();
      this.toastService.success('Signed up with Google!');
      this.router.navigate(['/dashboard']);
    } catch (error: any) {
      if (error.code !== 'auth/popup-closed-by-user') {
        this.toastService.error(error.message || 'Google sign-up failed');
      }
    } finally {
      this.isLoading.set(false);
    }
  }

  async facebookSignUp(): Promise<void> {
    this.isLoading.set(true);
    try {
      await this.authService.signInWithFacebook();
      this.toastService.success('Signed up with Facebook!');
      this.router.navigate(['/dashboard']);
    } catch (error: any) {
      if (error.code !== 'auth/popup-closed-by-user') {
        this.toastService.error(error.message || 'Facebook sign-up failed');
      }
    } finally {
      this.isLoading.set(false);
    }
  }

  private getErrorMessage(code: string): string {
    switch (code) {
      case 'auth/email-already-in-use':
        return 'An account with this email already exists';
      case 'auth/weak-password':
        return 'Password must be at least 6 characters';
      case 'auth/invalid-email':
        return 'Invalid email address';
      default:
        return 'Registration failed. Please try again.';
    }
  }
}
