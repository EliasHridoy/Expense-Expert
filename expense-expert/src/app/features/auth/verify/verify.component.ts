import { Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-verify',
  standalone: true,
  imports: [LoadingSpinnerComponent],
  template: `
    @if (isLoading()) {
      <div class="text-center py-8">
        <app-loading-spinner size="lg" />
        <p class="text-gray-500 mt-4">Verifying your sign-in link...</p>
      </div>
    } @else if (error()) {
      <div class="text-center py-8">
        <div class="text-4xl mb-4">&#x26A0;&#xFE0F;</div>
        <h2 class="text-xl font-semibold text-gray-900 mb-2">Verification failed</h2>
        <p class="text-gray-500 text-sm mb-6">{{ error() }}</p>
        <a
          routerLink="/auth/login"
          class="text-sm text-primary-600 hover:text-primary-700 font-medium"
        >
          Try again
        </a>
      </div>
    }
  `,
})
export class VerifyComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  private toastService = inject(ToastService);

  isLoading = signal(true);
  error = signal<string | null>(null);

  async ngOnInit(): Promise<void> {
    try {
      await this.authService.completeSignIn(window.location.href);
      this.toastService.success('Signed in successfully!');
      this.router.navigate(['/dashboard']);
    } catch (err: any) {
      this.error.set(err.message || 'Failed to verify sign-in link');
      this.toastService.error(this.error()!);
    } finally {
      this.isLoading.set(false);
    }
  }
}
