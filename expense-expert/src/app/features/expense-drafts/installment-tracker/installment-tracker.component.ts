import { Component, Input } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { DraftApplication } from '../../../core/models/expense-draft.model';

@Component({
  selector: 'app-installment-tracker',
  standalone: true,
  imports: [DecimalPipe],
  template: `
    <div>
      <div class="flex items-center justify-between text-xs text-gray-500 mb-1">
        <span>{{ application.installmentsPaid }}/{{ application.totalInstallments }} installments</span>
        <span>{{ application.paidAmount | number:'1.0-0' }}/{{ application.targetAmount | number:'1.0-0' }}</span>
      </div>
      <div class="w-full bg-gray-200 rounded-full h-2">
        <div
          class="h-2 rounded-full transition-all"
          [class]="statusColor"
          [style.width.%]="progressPercent"
        ></div>
      </div>
    </div>
  `,
})
export class InstallmentTrackerComponent {
  @Input({ required: true }) application!: DraftApplication;

  get progressPercent(): number {
    if (this.application.targetAmount === 0) return 0;
    return Math.min((this.application.paidAmount / this.application.targetAmount) * 100, 100);
  }

  get statusColor(): string {
    if (this.application.status === 'completed') return 'bg-green-500';
    if (this.application.status === 'partial') return 'bg-yellow-500';
    return 'bg-gray-400';
  }
}
