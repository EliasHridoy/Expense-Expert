import { Component, inject, signal, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { ExpenseDraftService } from '../../../core/services/expense-draft.service';
import { ToastService } from '../../../core/services/toast.service';
import { ExpenseDraft, DraftApplication } from '../../../core/models/expense-draft.model';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { MonthPickerComponent } from '../../../shared/components/month-picker/month-picker.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { CategoryBadgeComponent } from '../../../shared/components/category-badge/category-badge.component';
import { InstallmentTrackerComponent } from '../installment-tracker/installment-tracker.component';

@Component({
  selector: 'app-draft-list',
  standalone: true,
  imports: [
    DecimalPipe,
    PageHeaderComponent,
    MonthPickerComponent,
    EmptyStateComponent,
    LoadingSpinnerComponent,
    CategoryBadgeComponent,
    InstallmentTrackerComponent,
  ],
  template: `
    <app-page-header
      title="Expense Drafts"
      actionLabel="+ New Draft"
      (actionClick)="router.navigate(['/drafts/new'])"
    />

    <div class="flex items-center justify-between mb-6">
      <app-month-picker [currentMonth]="currentMonth()" (monthChanged)="onMonthChange($event)" />
      <a
        (click)="router.navigate(['/drafts/loans'])"
        class="text-sm text-primary-600 hover:text-primary-700 font-medium cursor-pointer"
      >
        View Loan Summary
      </a>
    </div>

    @if (isLoading()) {
      <app-loading-spinner size="lg" [fullPage]="true" />
    } @else if (drafts().length === 0) {
      <app-empty-state
        message="No expense drafts yet"
        actionLabel="Create your first draft"
        (actionClick)="router.navigate(['/drafts/new'])"
      />
    } @else {
      <div class="space-y-3">
        @for (draft of drafts(); track draft.id) {
          <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div class="flex items-start justify-between mb-2">
              <div>
                <div class="flex items-center gap-2">
                  <h3 class="text-sm font-medium text-gray-900">{{ draft.title }}</h3>
                  <app-category-badge [category]="draft.category" />
                  @if (draft.isLoan) {
                    <span class="text-xs bg-amber-100 text-amber-800 rounded-full px-2 py-0.5">Loan</span>
                  }
                </div>
                <p class="text-xs text-gray-400 mt-0.5">
                  Target: {{ draft.targetAmount | number:'1.0-0' }} | {{ draft.installmentCount }} installment(s)
                </p>
              </div>
              <div class="flex items-center gap-2">
                <button
                  (click)="router.navigate(['/drafts', draft.id, 'edit'])"
                  class="text-xs text-gray-500 hover:text-gray-700 px-2 py-1"
                >
                  Edit
                </button>
              </div>
            </div>

            <!-- Show application status for this month -->
            @if (getApplication(draft.id); as app) {
              <app-installment-tracker [application]="app" />
              @if (app.status !== 'completed') {
                <button
                  (click)="router.navigate(['/drafts', app.id])"
                  class="mt-2 text-xs text-primary-600 hover:text-primary-700 font-medium"
                >
                  Record Payment
                </button>
              }
            } @else {
              <button
                (click)="applyDraft(draft)"
                class="mt-2 text-xs text-primary-600 hover:text-primary-700 font-medium"
              >
                Apply to {{ displayMonth }}
              </button>
            }
          </div>
        }
      </div>
    }
  `,
})
export class DraftListComponent implements OnInit {
  private draftService = inject(ExpenseDraftService);
  private toastService = inject(ToastService);
  router = inject(Router);

  currentMonth = signal(this.getCurrentMonth());
  drafts = signal<ExpenseDraft[]>([]);
  applications = signal<DraftApplication[]>([]);
  isLoading = signal(true);

  get displayMonth(): string {
    const [year, month] = this.currentMonth().split('-');
    return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric',
    });
  }

  ngOnInit(): void {
    this.loadData();
  }

  onMonthChange(month: string): void {
    this.currentMonth.set(month);
    this.loadData();
  }

  getApplication(draftId: string): DraftApplication | undefined {
    return this.applications().find((a) => a.draftId === draftId);
  }

  async applyDraft(draft: ExpenseDraft): Promise<void> {
    try {
      await this.draftService.applyDraftToMonth(draft, this.currentMonth());
      this.toastService.success(`"${draft.title}" applied to ${this.displayMonth}`);
    } catch {
      this.toastService.error('Failed to apply draft');
    }
  }

  private loadData(): void {
    this.isLoading.set(true);

    this.draftService.getDrafts().subscribe((drafts) => {
      this.drafts.set(drafts);
      this.isLoading.set(false);
    });

    this.draftService.getApplicationsForMonth(this.currentMonth()).subscribe((apps) => {
      this.applications.set(apps);
    });
  }

  private getCurrentMonth(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }
}
