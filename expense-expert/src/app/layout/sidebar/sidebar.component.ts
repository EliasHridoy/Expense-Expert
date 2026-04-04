import { Component, Output, EventEmitter, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <aside class="flex flex-col h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 w-64 transition-colors">
      <!-- Logo -->
      <div class="flex items-center gap-3 px-6 py-5 border-b border-gray-200 dark:border-gray-700">
        <img src="icons8-taka-64.png" alt="Logo" class="h-12 w-12 object-contain -ml-1" />
        <span class="text-lg font-bold text-gray-900 dark:text-gray-100">Expense Expert</span>
      </div>

      <!-- Navigation -->
      <nav id="sidebar-nav" class="flex-1 px-3 py-4 space-y-1">
        @for (item of navItems; track item.path) {
          <a
            [routerLink]="item.path"
            [attr.id]="item.id"
            routerLinkActive="bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 font-medium"
            [routerLinkActiveOptions]="{ exact: item.exact }"
            class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            (click)="linkClicked.emit()"
          >
            <span class="text-lg">{{ item.icon }}</span>
            <span>{{ item.label }}</span>
          </a>
        }
      </nav>

      <div class="px-3 py-4 border-t border-gray-200 dark:border-gray-700">
        <button
          (click)="logout()"
          class="flex items-center w-full gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  `,
})
export class SidebarComponent {
  @Output() linkClicked = new EventEmitter<void>();

  navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '\u{1F4CA}', exact: true, id: 'nav-dashboard' },
    { path: '/expenses', label: 'Expenses', icon: '\u{1F4B8}', exact: false, id: 'nav-expenses' },
    { path: '/drafts', label: 'Expense Drafts', icon: '\u{1F4CB}', exact: false, id: 'nav-drafts' },
    { path: '/savings', label: 'Savings', icon: '\u{1F3E6}', exact: false, id: 'nav-savings' },
    { path: '/profile', label: 'Profile', icon: '\u{1F464}', exact: false, id: 'nav-profile' },
  ];

  private authService = inject(AuthService);
  private router = inject(Router);
  private toastService = inject(ToastService);

  async logout(): Promise<void> {
    await this.authService.signOut();
    this.toastService.success('Signed out successfully');
    this.router.navigate(['/auth/login']);
  }
}
