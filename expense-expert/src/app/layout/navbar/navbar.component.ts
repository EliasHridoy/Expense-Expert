import { Component, inject, Output, EventEmitter } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';
import { Router } from '@angular/router';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  template: `
    <header class="flex items-center justify-between h-16 px-6 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 transition-colors">
      <div class="flex items-center gap-3">
        <button
          (click)="menuToggle.emit()"
          class="lg:hidden rounded-lg p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          &#9776;
        </button>
        <h2 class="text-sm text-gray-500 dark:text-gray-400">Welcome back!</h2>
      </div>

      <div class="flex items-center gap-3">
        <!-- Dark mode toggle -->
        <button
          (click)="themeService.toggle()"
          class="rounded-lg p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          [title]="themeService.isDark() ? 'Switch to light mode' : 'Switch to dark mode'"
        >
          @if (themeService.isDark()) {
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          } @else {
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          }
        </button>

        <span class="text-sm text-gray-700 dark:text-gray-300">{{ userEmail }}</span>
        <button
          (click)="logout()"
          class="rounded-lg px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
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
  themeService = inject(ThemeService);

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
