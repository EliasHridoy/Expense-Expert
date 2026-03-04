import { Component, inject, Output, EventEmitter } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { Router } from '@angular/router';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  template: `
    <header class="flex items-center justify-between h-16 px-6 bg-white border-b border-gray-200">
      <div class="flex items-center gap-3">
        <button
          (click)="menuToggle.emit()"
          class="lg:hidden rounded-lg p-2 text-gray-600 hover:bg-gray-100 transition-colors"
        >
          &#9776;
        </button>
        <h2 class="text-sm text-gray-500">Welcome back!</h2>
      </div>

      <div class="flex items-center gap-4">
        <span class="text-sm text-gray-700">{{ userEmail }}</span>
        <button
          (click)="logout()"
          class="rounded-lg px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
        >
          Sign out
        </button>
      </div>
    </header>
  `,
})
export class NavbarComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  private toastService = inject(ToastService);

  @Output() menuToggle = new EventEmitter<void>();

  get userEmail(): string {
    return this.authService.currentUser()?.email || '';
  }

  async logout(): Promise<void> {
    await this.authService.signOut();
    this.toastService.success('Signed out successfully');
    this.router.navigate(['/auth/login']);
  }
}
