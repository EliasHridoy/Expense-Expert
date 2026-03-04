import { Component, inject, signal, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ExpenseService } from '../../../core/services/expense.service';
import { Expense } from '../../../core/models/expense.model';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { MonthPickerComponent } from '../../../shared/components/month-picker/month-picker.component';
import { CategoryBadgeComponent } from '../../../shared/components/category-badge/category-badge.component';
import { AmountDisplayComponent } from '../../../shared/components/amount-display/amount-display.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { RelativeDatePipe } from '../../../shared/pipes/relative-date.pipe';

@Component({
  selector: 'app-expense-list',
  standalone: true,
  imports: [
    PageHeaderComponent,
    MonthPickerComponent,
    CategoryBadgeComponent,
    AmountDisplayComponent,
    EmptyStateComponent,
    LoadingSpinnerComponent,
    RelativeDatePipe,
  ],
  template: `
    <app-page-header
      title="Expenses"
      actionLabel="+ Add Expense"
      (actionClick)="router.navigate(['/expenses/new'])"
    />

    <div class="flex items-center justify-between mb-6">
      <app-month-picker [currentMonth]="currentMonth()" (monthChanged)="onMonthChange($event)" />
      <p class="text-sm text-gray-500 dark:text-gray-400">
        Total: <app-amount-display [amount]="totalAmount()" type="expense" />
      </p>
    </div>

    @if (isLoading()) {
      <app-loading-spinner size="lg" [fullPage]="true" />
    } @else if (expenses().length === 0) {
      <app-empty-state
        message="No expenses for this month"
        actionLabel="Add your first expense"
        (actionClick)="router.navigate(['/expenses/new'])"
      />
    } @else {
      <div class="space-y-3">
        @for (expense of expenses(); track expense.id) {
          <div
            (click)="router.navigate(['/expenses', expense.id])"
            class="flex items-center justify-between bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 cursor-pointer hover:shadow-md transition-shadow"
          >
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-1">
                <h3 class="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{{ expense.title }}</h3>
                <app-category-badge [category]="expense.category" />
                @if (expense.isLoan) {
                  <span class="text-xs bg-amber-100 text-amber-800 rounded-full px-2 py-0.5">Loan</span>
                }
              </div>
              <p class="text-xs text-gray-400">{{ expense.date | relativeDate }}</p>
            </div>
            <app-amount-display [amount]="expense.amount" type="expense" />
          </div>
        }
      </div>
    }
  `,
})
export class ExpenseListComponent implements OnInit {
  private expenseService = inject(ExpenseService);
  router = inject(Router);

  currentMonth = signal(this.getCurrentMonth());
  expenses = signal<Expense[]>([]);
  isLoading = signal(true);
  totalAmount = signal(0);

  ngOnInit(): void {
    this.loadExpenses();
  }

  onMonthChange(month: string): void {
    this.currentMonth.set(month);
    this.loadExpenses();
  }

  private loadExpenses(): void {
    this.isLoading.set(true);
    this.expenseService.getExpensesByMonth(this.currentMonth()).subscribe((expenses) => {
      this.expenses.set(expenses);
      this.totalAmount.set(expenses.reduce((sum, e) => sum + e.amount, 0));
      this.isLoading.set(false);
    });
  }

  private getCurrentMonth(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }
}
