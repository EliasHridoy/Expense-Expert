import { Component, inject, signal, computed, OnInit } from '@angular/core';
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
                <app-category-badge [category]="expense()!.category" [subcategory]="expense()!.subcategory" />
                @if (expense()!.isLoan) {
                  <span class="text-xs bg-amber-100 text-amber-800 rounded-full px-2 py-0.5">Loan</span>
                }
                @if (expense()!.shoppingListId) {
                  <span class="inline-flex items-center gap-1 text-xs bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 rounded-full px-2.5 py-0.5 font-medium">
                    <span>🛒</span> {{ expense()!.shoppingListName || 'Shopping List' }}
                  </span>
                }
              </div>
            </div>
            <app-amount-display [amount]="expense()!.amount" type="expense" />
          </div>

          @if (expense()!.description) {
            <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">{{ expense()!.description }}</p>
          }

          <p class="text-xs text-gray-400">{{ expense()!.date | relativeDate }}</p>

          @if (expense()!.shoppingListId) {
            <div class="mt-5 p-4 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-800/60 flex items-center justify-between gap-3">
              <div class="flex items-center gap-3">
                <span class="text-2xl">🛒</span>
                <div>
                  <h4 class="text-xs font-bold text-gray-900 dark:text-white">Itemized Shopping List</h4>
                  <p class="text-[11px] text-gray-500 dark:text-gray-400">View and edit individual items, quantities, and prices.</p>
                </div>
              </div>
              <button
                type="button"
                (click)="router.navigate(['/expenses/shopping', expense()!.shoppingListId])"
                class="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-colors shrink-0 flex items-center gap-1"
              >
                <span>View List</span>
                <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
                </svg>
              </button>
            </div>
          }

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
        [message]="deleteDialogMessage()"
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

  deleteDialogMessage = computed(() => {
    if (this.expense()?.shoppingListId) {
      return 'Are you sure you want to delete this expense? This expense is linked to a shopping list, so the associated shopping list will also be deleted.';
    }
    return 'Are you sure you want to delete this expense? This cannot be undone.';
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.expenseService.getExpenseById(id).subscribe((expense) => {
      this.expense.set(expense);
      this.isLoading.set(false);
    });
  }

  async deleteExpense(): Promise<void> {
    try {
      await this.expenseService.deleteExpense(this.expense()!.id, this.expense()!.shoppingListId);
      this.toastService.success('Expense deleted');
      this.router.navigate(['/expenses']);
    } catch {
      this.toastService.error('Failed to delete expense');
    }
    this.showDeleteConfirm.set(false);
  }
}
