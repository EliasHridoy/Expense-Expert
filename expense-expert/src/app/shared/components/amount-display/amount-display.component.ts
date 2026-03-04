import { Component, Input } from '@angular/core';
import { DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-amount-display',
  standalone: true,
  imports: [DecimalPipe],
  template: `
    <span [class]="colorClass" class="font-semibold tabular-nums">
      {{ prefix }}{{ amount | number: '1.0-0' }}
    </span>
  `,
})
export class AmountDisplayComponent {
  @Input({ required: true }) amount!: number;
  @Input() type: 'expense' | 'income' | 'neutral' = 'neutral';

  get prefix(): string {
    if (this.type === 'expense') return '-';
    if (this.type === 'income') return '+';
    return '';
  }

  get colorClass(): string {
    if (this.type === 'expense') return 'text-red-600 dark:text-red-400';
    if (this.type === 'income') return 'text-green-600 dark:text-green-400';
    return 'text-gray-900 dark:text-gray-100';
  }
}
