import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ExpenseService } from '../../../core/services/expense.service';
import { DashboardService } from '../../../core/services/dashboard.service';
import { Expense } from '../../../core/models/expense.model';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { MonthPickerComponent } from '../../../shared/components/month-picker/month-picker.component';
import { CategoryBadgeComponent } from '../../../shared/components/category-badge/category-badge.component';
import { AmountDisplayComponent } from '../../../shared/components/amount-display/amount-display.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { RelativeDatePipe } from '../../../shared/pipes/relative-date.pipe';
import { TourService } from '../../../core/services/tour.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-expense-list',
  standalone: true,
  imports: [
    FormsModule,
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
      actionId="expense-add-btn"
      (actionClick)="router.navigate(['/expenses/new'])"
    />

    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div class="flex flex-wrap items-center gap-2">
        <app-month-picker [currentMonth]="currentMonth()" (monthChanged)="onMonthChange($event)" />
        <button
          id="expense-drafts-btn"
          (click)="router.navigate(['/drafts'])"
          class="px-3 py-1.5 text-sm font-medium bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          title="Expense Drafts"
        >
          Drafts
        </button>
        <button
          id="expense-shopping-btn"
          (click)="router.navigate(['/expenses/shopping'])"
          class="px-3 py-1.5 text-sm font-medium bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-1.5"
          title="Shopping & Grocery Lists"
        >
          <span>🛒</span> Shopping
        </button>
      </div>
      <div class="flex flex-wrap items-center gap-4">
        <p class="text-sm text-gray-500 dark:text-gray-400">
          Spent: <app-amount-display [amount]="totalAmount()" type="expense" />
        </p>
        <p class="text-sm text-gray-500 dark:text-gray-400">
          Remaining:
          <app-amount-display
            [amount]="remainingAmount() < 0 ? -remainingAmount() : remainingAmount()"
            [type]="remainingAmount() >= 0 ? 'income' : 'expense'"
          />
        </p>
      </div>
    </div>

    @if (expenses().length > 0) {
      <div class="flex flex-wrap items-center gap-3 mb-6 p-3 sm:p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800">
        <div class="w-full sm:flex-1 min-w-[180px]">
          <div class="relative">
            <input
              type="text"
              [(ngModel)]="searchQuery"
              placeholder="Search by title, category..."
              class="w-full pl-9 pr-4 py-1.5 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:ring-1 focus:ring-primary-500 outline-none"
            />
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
        <div class="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
          <div class="flex items-center gap-1.5">
            <label class="text-xs font-medium text-gray-700 dark:text-gray-300">Group:</label>
            <select [(ngModel)]="groupBy" class="text-xs rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white py-1.5 pl-2 pr-6 shadow-sm focus:border-primary-500 focus:ring-primary-500">
              <option value="none">None</option>
              <option value="category">Category</option>
            </select>
          </div>
          <div class="flex items-center gap-1.5">
            <label class="text-xs font-medium text-gray-700 dark:text-gray-300">Sort:</label>
            <select [(ngModel)]="sortBy" class="text-xs rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white py-1.5 pl-2 pr-6 shadow-sm focus:border-primary-500 focus:ring-primary-500">
              <option value="date">Date</option>
              <option value="amount">Amount</option>
              <option value="alpha">Name</option>
            </select>
          </div>
          <div class="flex items-center gap-1 ml-auto sm:ml-0">
            <button
              (click)="viewMode.set('list')"
              [class.bg-white]="viewMode() === 'list'"
              [class.dark:bg-gray-700]="viewMode() === 'list'"
              [class.shadow-sm]="viewMode() === 'list'"
              class="p-2 rounded-lg text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
              title="List View"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clip-rule="evenodd" />
              </svg>
            </button>
            <button
              (click)="viewMode.set('grid')"
              [class.bg-white]="viewMode() === 'grid'"
              [class.dark:bg-gray-700]="viewMode() === 'grid'"
              [class.shadow-sm]="viewMode() === 'grid'"
              class="p-2 rounded-lg text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
              title="Grid View"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    }

    @if (isLoading()) {
      <app-loading-spinner size="lg" [fullPage]="true" />
    } @else if (expenses().length === 0) {
      <app-empty-state
        message="No expenses for this month"
        actionLabel="Add your first expense"
        (actionClick)="router.navigate(['/expenses/new'])"
      />
    } @else {
      <div id="expense-list-area" class="space-y-6">
        @for (group of processedExpenses(); track group.name) {
          <div>
            @if (groupBy() === 'category') {
              <div class="flex items-center justify-between mb-3 border-b border-gray-100 dark:border-gray-800 pb-2">
                <app-category-badge [category]="group.name" />
                <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
                  <app-amount-display [amount]="group.total" type="expense" />
                </span>
              </div>
            }

            <div [class]="viewMode() === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-3'">
              @for (expense of group.items; track expense.id) {
                <div
                  (click)="router.navigate(['/expenses', expense.id])"
                  [class]="viewMode() === 'grid' ? 'flex flex-col justify-between h-full gap-4' : 'flex items-center justify-between gap-3'"
                  class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 cursor-pointer hover:shadow-md transition-shadow"
                >
                  <div class="flex-1 min-w-0">
                    <div class="flex flex-wrap items-center gap-1.5 mb-1">
                      <h3 class="text-sm font-medium text-gray-900 dark:text-gray-100 break-words">{{ expense.title }}</h3>
                      @if (groupBy() !== 'category') {
                        <app-category-badge [category]="expense.category" [subcategory]="expense.subcategory" />
                      }
                      @if (expense.isLoan) {
                        <span class="text-xs bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 rounded-full px-2 py-0.5 shrink-0">Loan</span>
                      }
                      @if (expense.shoppingListId) {
                        <span class="inline-flex items-center gap-1 text-[11px] font-medium bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50 rounded-full px-2 py-0.5 shrink-0">
                          <span>🛒</span> {{ expense.shoppingListName || 'Shopping' }}
                        </span>
                      }
                    </div>
                    <p class="text-xs text-gray-400">{{ expense.date | relativeDate }}</p>
                  </div>

                  <div [class]="viewMode() === 'grid' ? 'flex justify-end mt-auto' : 'shrink-0'">
                    <app-amount-display [amount]="expense.amount" type="expense" />
                  </div>
                </div>
              }
            </div>
          </div>
        }
      </div>
    }
  `,
})
export class ExpenseListComponent implements OnInit {
  private expenseService = inject(ExpenseService);
  private dashboardService = inject(DashboardService);
  private tourService = inject(TourService);
  router = inject(Router);

  currentMonth = signal(this.getCurrentMonth());
  expenses = signal<Expense[]>([]);
  isLoading = signal(true);
  totalAmount = signal(0);
  remainingAmount = signal(0);

  viewMode = signal<'list' | 'grid'>('list');
  groupBy = signal<'none' | 'category'>('none');
  sortBy = signal<'date' | 'amount' | 'alpha'>('date');
  searchQuery = signal<string>('');

  processedExpenses = computed(() => {
    let sorted = [...this.expenses()];

    const query = this.searchQuery().trim().toLowerCase();
    if (query) {
      sorted = sorted.filter((e) =>
        e.title.toLowerCase().includes(query) ||
        e.category.toLowerCase().includes(query) ||
        (e.subcategory && e.subcategory.toLowerCase().includes(query)) ||
        (e.shoppingListName && e.shoppingListName.toLowerCase().includes(query))
      );
    }

    // Sorting
    const sort = this.sortBy();
    if (sort === 'date') {
      sorted.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } else if (sort === 'amount') {
      sorted.sort((a, b) => b.amount - a.amount);
    } else if (sort === 'alpha') {
      sorted.sort((a, b) => a.title.localeCompare(b.title));
    }

    // Grouping
    const group = this.groupBy();
    if (group === 'category') {
      const groupsMap = new Map<string, { name: string; total: number; items: Expense[] }>();
      for (const expense of sorted) {
        if (!groupsMap.has(expense.category)) {
          groupsMap.set(expense.category, { name: expense.category, total: 0, items: [] });
        }
        const g = groupsMap.get(expense.category)!;
        g.items.push(expense);
        g.total += expense.amount;
      }
      return Array.from(groupsMap.values()).sort((a, b) => a.name.localeCompare(b.name));
    } else {
      return [{ name: 'All Expenses', total: this.totalAmount(), items: sorted }];
    }
  });

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

      this.tourService.loadTourState().then(() => {
        this.tourService.tryStartPageTour('expenses');
      });
    });

    this.dashboardService.getCurrentMonthSummary(this.currentMonth()).subscribe((summary) => {
      this.remainingAmount.set(summary.remaining);
    });
  }

  private getCurrentMonth(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }
}
