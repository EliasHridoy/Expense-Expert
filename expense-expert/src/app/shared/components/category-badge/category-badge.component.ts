import { Component, Input } from '@angular/core';
import { ExpenseCategory } from '../../../core/models/expense.model';

@Component({
  selector: 'app-category-badge',
  standalone: true,
  template: `
    <span
      class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize"
      [class]="badgeClass"
    >
      {{ category }}
    </span>
  `,
})
export class CategoryBadgeComponent {
  @Input({ required: true }) category!: ExpenseCategory | string;

  get badgeClass(): string {
    const classes: Record<string, string> = {
      food: 'bg-orange-100 text-orange-800',
      transport: 'bg-blue-100 text-blue-800',
      entertainment: 'bg-purple-100 text-purple-800',
      utilities: 'bg-yellow-100 text-yellow-800',
      other: 'bg-gray-100 text-gray-800',
    };
    return classes[this.category] || classes['other'];
  }
}
