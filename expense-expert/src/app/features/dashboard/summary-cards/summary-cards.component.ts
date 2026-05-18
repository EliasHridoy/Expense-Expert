import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AmountDisplayComponent } from '../../../shared/components/amount-display/amount-display.component';
import { MonthSummary } from '../../../core/models/dashboard.model';

@Component({
  selector: 'app-summary-cards',
  standalone: true,
  imports: [AmountDisplayComponent, RouterLink],
  template: `
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
      <!-- Total Income -->
      <a routerLink="/profile" id="summary-card-income" class="block bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
        <p class="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Income</p>
        <app-amount-display [amount]="summary.totalIncome" type="income" />
      </a>

      <!-- Total Expenses -->
      <div id="summary-card-expenses" class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 transition-colors">
        <p class="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Expenses</p>
        <app-amount-display [amount]="summary.totalExpenses" type="expense" />
        <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">{{ summary.expenseCount }} transactions</p>
      </div>

      <!-- Total Savings -->
      <div id="summary-card-savings" class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 transition-colors">
        <p class="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Savings</p>
        <app-amount-display [amount]="summary.totalSavings" type="income" />
      </div>

      <!-- Remaining -->
      <div id="summary-card-remaining" class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 transition-colors">
        <p class="text-sm text-gray-500 dark:text-gray-400 mb-1">Remaining</p>
        <app-amount-display
          [amount]="summary.remaining < 0 ? -summary.remaining : summary.remaining"
          [type]="summary.remaining >= 0 ? 'income' : 'expense'"
        />
      </div>
    </div>
  `,
})
export class SummaryCardsComponent {
  @Input({ required: true }) summary!: MonthSummary;
}
