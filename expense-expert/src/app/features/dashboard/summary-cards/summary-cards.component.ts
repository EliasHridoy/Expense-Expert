import { Component, Input } from '@angular/core';
import { AmountDisplayComponent } from '../../../shared/components/amount-display/amount-display.component';
import { MonthSummary } from '../../../core/models/dashboard.model';

@Component({
  selector: 'app-summary-cards',
  standalone: true,
  imports: [AmountDisplayComponent],
  template: `
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <!-- Total Expenses -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 transition-colors">
        <p class="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Expenses</p>
        <app-amount-display [amount]="summary.totalExpenses" type="expense" />
        <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">{{ summary.expenseCount }} transactions</p>
      </div>

      <!-- Total Savings -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 transition-colors">
        <p class="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Savings</p>
        <app-amount-display [amount]="summary.totalSavings" type="income" />
      </div>

      <!-- Balance -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 transition-colors">
        <p class="text-sm text-gray-500 dark:text-gray-400 mb-1">Balance</p>
        <app-amount-display
          [amount]="summary.balance < 0 ? -summary.balance : summary.balance"
          [type]="summary.balance >= 0 ? 'income' : 'expense'"
        />
      </div>
    </div>
  `,
})
export class SummaryCardsComponent {
  @Input({ required: true }) summary!: MonthSummary;
}
