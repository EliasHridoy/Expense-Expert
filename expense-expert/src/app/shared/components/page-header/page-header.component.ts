import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-page-header',
  standalone: true,
  template: `
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">{{ title }}</h1>
      @if (actionLabel) {
        <button
          [attr.id]="actionId || null"
          (click)="actionClick.emit()"
          class="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 transition-colors"
        >
          @if (actionIcon) {
            <span>{{ actionIcon }}</span>
          }
          {{ actionLabel }}
        </button>
      }
    </div>
  `,
})
export class PageHeaderComponent {
  @Input({ required: true }) title!: string;
  @Input() actionLabel?: string;
  @Input() actionIcon?: string;
  @Input() actionId?: string;
  @Output() actionClick = new EventEmitter<void>();
}

