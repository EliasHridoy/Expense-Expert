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
        <div class="h-8 w-8 rounded-lg bg-primary-600 flex items-center justify-center text-white font-bold text-sm">
          EE
        </div>
        <span class="text-lg font-bold text-gray-900 dark:text-gray-100">Expense Expert</span>
      </div>

      <!-- Navigation -->
      <nav class="flex-1 px-3 py-4 space-y-1">
        @for (item of navItems; track item.path) {
          <a
            [routerLink]="item.path"
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
    { path: '/dashboard', label: 'Dashboard', icon: '\u{1F4CA}', exact: true },
    { path: '/expenses', label: 'Expenses', icon: '\u{1F4B8}', exact: false },
    { path: '/drafts', label: 'Expense Drafts', icon: '\u{1F4CB}', exact: false },
    { path: '/savings', label: 'Savings', icon: '\u{1F3E6}', exact: false },
  ];
}
