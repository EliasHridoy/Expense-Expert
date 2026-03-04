import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastContainerComponent } from '../../../shared/components/toast-container/toast-container.component';

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [RouterOutlet, ToastContainerComponent],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-blue-100 px-4">
      <div class="w-full max-w-md">
        <!-- Logo -->
        <div class="text-center mb-8">
          <div class="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-primary-600 text-white font-bold text-xl mb-4">
            EE
          </div>
          <h1 class="text-2xl font-bold text-gray-900">Expense Expert</h1>
          <p class="text-sm text-gray-500 mt-1">Track your expenses smarter</p>
        </div>

        <!-- Content card -->
        <div class="bg-white rounded-2xl shadow-xl p-8">
          <router-outlet />
        </div>
      </div>
    </div>

    <app-toast-container />
  `,
})
export class AuthLayoutComponent {}
