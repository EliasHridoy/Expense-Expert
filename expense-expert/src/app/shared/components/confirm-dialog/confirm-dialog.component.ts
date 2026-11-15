import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  template: `
    @if (isOpen) {
      <div class="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div class="fixed inset-0 bg-black/50" (click)="cancelled.emit()"></div>
        <div class="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-5 sm:p-6 max-w-md w-full mx-auto">
          <h3 class="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">{{ title }}</h3>
          <p class="text-gray-600 dark:text-gray-400 mb-6 text-sm sm:text-base">{{ message }}</p>
          <div class="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3">
            <button
              type="button"
              (click)="cancelled.emit()"
              class="w-full sm:w-auto rounded-xl px-4 py-2.5 sm:py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-center"
            >
              Cancel
            </button>
            <button
              type="button"
              (click)="confirmed.emit()"
              class="w-full sm:w-auto rounded-xl px-4 py-2.5 sm:py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition-colors text-center"
            >
              {{ confirmLabel }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class ConfirmDialogComponent {
  @Input() isOpen = false;
  @Input() title = 'Confirm';
  @Input() message = 'Are you sure?';
  @Input() confirmLabel = 'Confirm';
  @Output() confirmed = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();
}
