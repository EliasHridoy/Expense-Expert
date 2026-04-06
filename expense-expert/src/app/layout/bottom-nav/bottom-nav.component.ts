import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-bottom-nav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <nav class="fixed bottom-0 left-0 right-0 z-50 lg:hidden">
      <div class="bg-white/80 dark:bg-gray-900/85 backdrop-blur-xl border-t border-gray-200/60 dark:border-gray-700/60 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.3)]">
        <div class="flex items-stretch justify-around px-1 pt-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))]">

          <!-- Dashboard -->
          <a routerLink="/dashboard" routerLinkActive="active-nav-item" [routerLinkActiveOptions]="{ exact: true }"
             class="nav-item group flex flex-col items-center justify-center gap-0.5 flex-1 py-1.5 rounded-xl transition-all duration-200 relative">
            <span class="active-pill absolute top-0.5 w-8 h-1 rounded-full bg-primary-600 dark:bg-primary-400 opacity-0 scale-x-0 transition-all duration-300"></span>
            <span class="icon-wrapper flex items-center justify-center w-10 h-7 rounded-xl transition-all duration-200">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1h-2z" />
              </svg>
            </span>
            <span class="text-[10px] font-medium text-gray-500 dark:text-gray-400 transition-colors duration-200 leading-tight">Dashboard</span>
          </a>

          <!-- Expenses -->
          <a routerLink="/expenses" routerLinkActive="active-nav-item" [routerLinkActiveOptions]="{ exact: false }"
             class="nav-item group flex flex-col items-center justify-center gap-0.5 flex-1 py-1.5 rounded-xl transition-all duration-200 relative">
            <span class="active-pill absolute top-0.5 w-8 h-1 rounded-full bg-primary-600 dark:bg-primary-400 opacity-0 scale-x-0 transition-all duration-300"></span>
            <span class="icon-wrapper flex items-center justify-center w-10 h-7 rounded-xl transition-all duration-200">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </span>
            <span class="text-[10px] font-medium text-gray-500 dark:text-gray-400 transition-colors duration-200 leading-tight">Expenses</span>
          </a>

          <!-- Drafts -->
          <a routerLink="/drafts" routerLinkActive="active-nav-item" [routerLinkActiveOptions]="{ exact: false }"
             class="nav-item group flex flex-col items-center justify-center gap-0.5 flex-1 py-1.5 rounded-xl transition-all duration-200 relative">
            <span class="active-pill absolute top-0.5 w-8 h-1 rounded-full bg-primary-600 dark:bg-primary-400 opacity-0 scale-x-0 transition-all duration-300"></span>
            <span class="icon-wrapper flex items-center justify-center w-10 h-7 rounded-xl transition-all duration-200">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </span>
            <span class="text-[10px] font-medium text-gray-500 dark:text-gray-400 transition-colors duration-200 leading-tight">Drafts</span>
          </a>

          <!-- Savings -->
          <a routerLink="/savings" routerLinkActive="active-nav-item" [routerLinkActiveOptions]="{ exact: false }"
             class="nav-item group flex flex-col items-center justify-center gap-0.5 flex-1 py-1.5 rounded-xl transition-all duration-200 relative">
            <span class="active-pill absolute top-0.5 w-8 h-1 rounded-full bg-primary-600 dark:bg-primary-400 opacity-0 scale-x-0 transition-all duration-300"></span>
            <span class="icon-wrapper flex items-center justify-center w-10 h-7 rounded-xl transition-all duration-200">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </span>
            <span class="text-[10px] font-medium text-gray-500 dark:text-gray-400 transition-colors duration-200 leading-tight">Savings</span>
          </a>

          <!-- Profile -->
          <a routerLink="/profile" routerLinkActive="active-nav-item" [routerLinkActiveOptions]="{ exact: false }"
             class="nav-item group flex flex-col items-center justify-center gap-0.5 flex-1 py-1.5 rounded-xl transition-all duration-200 relative">
            <span class="active-pill absolute top-0.5 w-8 h-1 rounded-full bg-primary-600 dark:bg-primary-400 opacity-0 scale-x-0 transition-all duration-300"></span>
            <span class="icon-wrapper flex items-center justify-center w-10 h-7 rounded-xl transition-all duration-200">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </span>
            <span class="text-[10px] font-medium text-gray-500 dark:text-gray-400 transition-colors duration-200 leading-tight">Profile</span>
          </a>

        </div>
      </div>
    </nav>
  `,
  styles: [`
    .nav-item.active-nav-item .icon-wrapper {
      color: var(--color-primary-600);
      background-color: color-mix(in srgb, var(--color-primary-600) 12%, transparent);
    }

    :host-context(.dark) .nav-item.active-nav-item .icon-wrapper {
      color: var(--color-primary-400);
      background-color: color-mix(in srgb, var(--color-primary-400) 15%, transparent);
    }

    .nav-item.active-nav-item span:last-child {
      color: var(--color-primary-600);
      font-weight: 600;
    }

    :host-context(.dark) .nav-item.active-nav-item span:last-child {
      color: var(--color-primary-400);
    }

    .nav-item.active-nav-item .active-pill {
      opacity: 1;
      transform: scaleX(1);
    }

    .nav-item:not(.active-nav-item) .icon-wrapper {
      color: #6b7280;
    }

    :host-context(.dark) .nav-item:not(.active-nav-item) .icon-wrapper {
      color: #9ca3af;
    }

    .nav-item:active .icon-wrapper {
      transform: scale(0.9);
    }
  `],
})
export class BottomNavComponent {}
