import { Component, Output, EventEmitter } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

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
}
