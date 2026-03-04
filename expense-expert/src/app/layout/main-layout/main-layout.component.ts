import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { NavbarComponent } from '../navbar/navbar.component';
import { ToastContainerComponent } from '../../shared/components/toast-container/toast-container.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, NavbarComponent, ToastContainerComponent],
  template: `
    <div class="flex h-screen overflow-hidden bg-gray-50">
      <!-- Sidebar overlay for mobile -->
      @if (sidebarOpen()) {
        <div
          class="fixed inset-0 z-40 bg-black/50 lg:hidden"
          (click)="sidebarOpen.set(false)"
        ></div>
      }

      <!-- Sidebar -->
      <div
        class="fixed inset-y-0 left-0 z-50 transform transition-transform duration-200 lg:relative lg:translate-x-0"
        [class.translate-x-0]="sidebarOpen()"
        [class.-translate-x-full]="!sidebarOpen()"
      >
        <app-sidebar (linkClicked)="sidebarOpen.set(false)" />
      </div>

      <!-- Main content -->
      <div class="flex-1 flex flex-col min-w-0">
        <app-navbar (menuToggle)="sidebarOpen.set(!sidebarOpen())" />
        <main class="flex-1 overflow-y-auto p-6">
          <router-outlet />
        </main>
      </div>
    </div>

    <app-toast-container />
  `,
})
export class MainLayoutComponent {
  sidebarOpen = signal(false);
}
