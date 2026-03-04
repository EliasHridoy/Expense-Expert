import { Component, inject, signal, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { SavingService } from '../../../core/services/saving.service';
import { SavingSummary } from '../../../core/models/saving.model';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-saving-history',
  standalone: true,
  imports: [DecimalPipe, PageHeaderComponent, LoadingSpinnerComponent, EmptyStateComponent],
  template: `
    <app-page-header title="Saving History" />

    @if (isLoading()) {
      <app-loading-spinner size="lg" [fullPage]="true" />
    } @else if (summaries().length === 0) {
      <app-empty-state message="No savings history yet" />
    } @else {
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-gray-100">
              <th class="text-left px-4 py-3 font-medium text-gray-500">Purpose</th>
              <th class="text-right px-4 py-3 font-medium text-gray-500">Total Saved</th>
              <th class="text-right px-4 py-3 font-medium text-gray-500">Months Active</th>
            </tr>
          </thead>
          <tbody>
            @for (row of summaries(); track row.purpose) {
              <tr class="border-b border-gray-50">
                <td class="px-4 py-3 font-medium text-gray-900 capitalize">{{ row.purpose }}</td>
                <td class="px-4 py-3 text-right text-green-600 font-medium">{{ row.totalSaved | number:'1.0-0' }}</td>
                <td class="px-4 py-3 text-right text-gray-500">{{ row.months }}</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    }

    <button
      (click)="router.navigate(['/savings'])"
      class="mt-6 text-sm text-gray-500 hover:text-gray-700"
    >
      &larr; Back to Savings
    </button>
  `,
})
export class SavingHistoryComponent implements OnInit {
  private savingService = inject(SavingService);
  router = inject(Router);

  summaries = signal<SavingSummary[]>([]);
  isLoading = signal(true);

  ngOnInit(): void {
    this.savingService.getSavingSummaryByPurpose().subscribe((summaries) => {
      this.summaries.set(summaries);
      this.isLoading.set(false);
    });
  }
}
