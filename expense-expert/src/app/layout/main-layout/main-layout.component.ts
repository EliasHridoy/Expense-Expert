import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { NavbarComponent } from '../navbar/navbar.component';
import { BottomNavComponent } from '../bottom-nav/bottom-nav.component';
import { ToastContainerComponent } from '../../shared/components/toast-container/toast-container.component';
import { TourOverlayComponent } from '../../shared/components/tour-overlay/tour-overlay.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, NavbarComponent, BottomNavComponent, ToastContainerComponent, TourOverlayComponent],
  template: `
    <div class="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-900 transition-colors">
      <!-- Sidebar (desktop only) -->
      <div class="hidden lg:block">
        <app-sidebar />
      </div>

      <!-- Main content -->
      <div class="flex-1 flex flex-col min-w-0">
        <app-navbar (menuToggle)="sidebarOpen.set(!sidebarOpen())" />
        <main class="flex-1 overflow-y-auto p-6 pb-24 lg:pb-6 flex flex-col">
          <div class="flex-1">
            <router-outlet />
          </div>
          <footer class="mt-auto pt-8 pb-2 text-center text-xs text-gray-500 dark:text-gray-400">
            &copy; {{ currentYear }} All rights reserved by Lord Elias.
          </footer>
        </main>
      </div>
    </div>

    <!-- Mobile bottom navigation -->
    <app-bottom-nav />

    <app-toast-container />
    <app-tour-overlay />
  `,
})
export class MainLayoutComponent {
  sidebarOpen = signal(false);
  currentYear = new Date().getFullYear();
}
