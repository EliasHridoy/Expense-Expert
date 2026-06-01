import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-month-picker',
  standalone: true,
  template: `
    <div class="flex items-center gap-2">
      <button
        (click)="navigate(-1)"
        class="rounded-lg p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      >
        &larr;
      </button>
      <span class="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[120px] text-center">
        {{ displayMonth }}
      </span>
      <button
        (click)="navigate(1)"
        [disabled]="isNextDisabled"
        [class.opacity-50]="isNextDisabled"
        [class.cursor-not-allowed]="isNextDisabled"
        class="rounded-lg p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:hover:bg-transparent dark:disabled:hover:bg-transparent"
      >
        &rarr;
      </button>
    </div>
  `,
})
export class MonthPickerComponent {
  @Input({ required: true }) currentMonth!: string; // "YYYY-MM"
  @Output() monthChanged = new EventEmitter<string>();

  get displayMonth(): string {
    const [year, month] = this.currentMonth.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }

  get isNextDisabled(): boolean {
    if (!this.currentMonth) return false;
    const [year, month] = this.currentMonth.split('-').map(Number);
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    
    return year > currentYear || (year === currentYear && month >= currentMonth);
  }

  navigate(delta: number): void {
    if (delta > 0 && this.isNextDisabled) return;

    const [year, month] = this.currentMonth.split('-').map(Number);
    const date = new Date(year, month - 1 + delta, 1);
    const newYear = date.getFullYear();
    const newMonth = String(date.getMonth() + 1).padStart(2, '0');
    this.monthChanged.emit(`${newYear}-${newMonth}`);
  }
}
