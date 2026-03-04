import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, LoadingSpinnerComponent],
  template: `
    @if (linkSent()) {
      <div class="text-center">
        <div class="text-4xl mb-4">&#x2709;&#xFE0F;</div>
        <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Check your email</h2>
        <p class="text-gray-500 dark:text-gray-400 text-sm mb-6">
          We sent a sign-in link to <strong>{{ email }}</strong>. Click the link to sign in.
        </p>
        <button
          (click)="linkSent.set(false)"
          class="text-sm text-primary-600 hover:text-primary-700 font-medium"
        >
          Use a different email
        </button>
      </div>
    } @else {
      <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Sign in</h2>
      <p class="text-gray-500 dark:text-gray-400 text-sm mb-6">Enter your email and we'll send you a magic link.</p>

      <form (ngSubmit)="sendLink()">
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
            placeholder="you@example.com"
            class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-4 py-2.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition-colors"
            [disabled]="isLoading()"
          />
        </div>

        <button
          type="submit"
          [disabled]="isLoading() || !email"
          class="w-full rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          @if (isLoading()) {
            <app-loading-spinner size="sm" />
          } @else {
            Send magic link
          }
        </button>
      </form>
    }
  `,
})
export class LoginComponent {
  private authService = inject(AuthService);
  private toastService = inject(ToastService);

  email = '';
  isLoading = signal(false);
  linkSent = signal(false);

  async sendLink(): Promise<void> {
    if (!this.email) return;

    this.isLoading.set(true);
    try {
      await this.authService.sendSignInLink(this.email);
      this.linkSent.set(true);
      this.toastService.success('Sign-in link sent! Check your email.');
    } catch (error: any) {
      this.toastService.error(error.message || 'Failed to send sign-in link');
    } finally {
      this.isLoading.set(false);
    }
  }
}
