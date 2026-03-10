import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ExpenseService } from '../../../core/services/expense.service';
import { ToastService } from '../../../core/services/toast.service';
import { Expense } from '../../../core/models/expense.model';
import { AmountDisplayComponent } from '../../../shared/components/amount-display/amount-display.component';
import { CategoryBadgeComponent } from '../../../shared/components/category-badge/category-badge.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { RelativeDatePipe } from '../../../shared/pipes/relative-date.pipe';

@Component({
  selector: 'app-expense-detail',
  standalone: true,
  imports: [
    AmountDisplayComponent,
    CategoryBadgeComponent,
    ConfirmDialogComponent,
    LoadingSpinnerComponent,
    RelativeDatePipe,
  ],
  template: `
    @if (isLoading()) {
      <app-loading-spinner size="lg" [fullPage]="true" />
    } @else if (expense()) {
      <div class="max-w-lg mx-auto">
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-colors">
          <div class="flex items-start justify-between mb-4">
            <div>
              <h1 class="text-xl font-bold text-gray-900 dark:text-gray-100">{{ expense()!.title }}</h1>
              <div class="flex items-center gap-2 mt-1">
                <app-category-badge [category]="expense()!.category" />
                @if (expense()!.isLoan) {
                  <span class="text-xs bg-amber-100 text-amber-800 rounded-full px-2 py-0.5">Loan</span>
                }
              </div>
            </div>
            <app-amount-display [amount]="expense()!.amount" type="expense" />
          </div>

          @if (expense()!.description) {
            <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">{{ expense()!.description }}</p>
          }

          <p class="text-xs text-gray-400">{{ expense()!.date | relativeDate }}</p>

          <div class="flex gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              (click)="router.navigate(['/expenses', expense()!.id, 'edit'])"
              class="flex-1 rounded-lg px-4 py-2 text-sm font-medium text-primary-700 bg-primary-50 hover:bg-primary-100 transition-colors"
            >
              Edit
            </button>
            <button
              (click)="showDeleteConfirm.set(true)"
              class="rounded-lg px-4 py-2 text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 transition-colors"
            >
              Delete
            </button>
            <button
              (click)="router.navigate(['/expenses'])"
              class="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Back
            </button>
          </div>
        </div>
      </div>

      <app-confirm-dialog
        [isOpen]="showDeleteConfirm()"
        title="Delete Expense"
        message="Are you sure you want to delete this expense? This cannot be undone."
        confirmLabel="Delete"
        (confirmed)="deleteExpense()"
        (cancelled)="showDeleteConfirm.set(false)"
      />
    }
  `,
})
export class ExpenseDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private expenseService = inject(ExpenseService);
  private toastService = inject(ToastService);
  router = inject(Router);

  expense = signal<Expense | null>(null);
  isLoading = signal(true);
  showDeleteConfirm = signal(false);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.expenseService.getExpenseById(id).subscribe((expense) => {
      this.expense.set(expense);
      this.isLoading.set(false);
    });
  }

  async deleteExpense(): Promise<void> {
    try {
      await this.expenseService.deleteExpense(this.expense()!.id);
      this.toastService.success('Expense deleted');
      this.router.navigate(['/expenses']);
    } catch {
      this.toastService.error('Failed to delete expense');
    }
    this.showDeleteConfirm.set(false);
  }
}
