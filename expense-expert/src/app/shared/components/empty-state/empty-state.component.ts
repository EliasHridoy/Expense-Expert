import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  template: `
    <div class="flex flex-col items-center justify-center py-12 text-center">
      <div class="text-4xl mb-4 text-gray-300">{{ icon }}</div>
      <p class="text-gray-500 mb-4">{{ message }}</p>
      @if (actionLabel) {
        <button
          (click)="actionClick.emit()"
          class="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 transition-colors"
        >
          {{ actionLabel }}
        </button>
      }
    </div>
  `,
})
export class EmptyStateComponent {
  @Input() icon = '📭';
  @Input({ required: true }) message!: string;
  @Input() actionLabel?: string;
  @Output() actionClick = new EventEmitter<void>();
}
