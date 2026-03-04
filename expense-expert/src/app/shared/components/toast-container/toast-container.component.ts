import { Component, inject } from '@angular/core';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  template: `
    <div class="fixed top-4 right-4 z-50 flex flex-col gap-2">
      @for (toast of toastService.toasts(); track toast.id) {
        <div
          class="rounded-lg px-4 py-3 text-sm font-medium shadow-lg animate-slide-in min-w-[280px]"
          [class]="getToastClass(toast.type)"
        >
          <div class="flex items-center justify-between gap-3">
            <span>{{ toast.message }}</span>
            <button
              (click)="toastService.dismiss(toast.id)"
              class="text-current opacity-70 hover:opacity-100"
            >
              &times;
            </button>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    .animate-slide-in {
      animation: slideIn 0.3s ease-out;
    }
  `],
})
export class ToastContainerComponent {
  toastService = inject(ToastService);

  getToastClass(type: string): string {
    const classes: Record<string, string> = {
      success: 'bg-green-600 text-white',
      error: 'bg-red-600 text-white',
      info: 'bg-blue-600 text-white',
    };
    return classes[type] || classes['info'];
  }
}
