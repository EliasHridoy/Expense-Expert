import re

with open('expense-expert/src/app/features/expenses/expense-list/expense-list.component.ts', 'r') as f:
    content = f.read()


search_toolbar = """    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <app-month-picker [currentMonth]="currentMonth()" (monthChanged)="onMonthChange($event)" />
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
    </div>"""

replace_toolbar = """    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <app-month-picker [currentMonth]="currentMonth()" (monthChanged)="onMonthChange($event)" />
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
      <div class="flex flex-wrap items-center gap-4 mb-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800">
        <div class="flex items-center gap-2">
          <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Group By:</label>
          <select [(ngModel)]="groupBy" class="text-sm rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500">
            <option value="none">None</option>
            <option value="category">Category</option>
          </select>
        </div>
        <div class="flex items-center gap-2">
          <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Sort By:</label>
          <select [(ngModel)]="sortBy" class="text-sm rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500">
            <option value="date">Date (Newest)</option>
            <option value="amount">Amount (Highest)</option>
            <option value="alpha">Alphabetical</option>
          </select>
        </div>
        <div class="flex items-center gap-1 ml-auto">
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
    }"""


search_list = """      <div id="expense-list-area" class="space-y-3">
        @for (expense of expenses(); track expense.id) {
          <div
            (click)="router.navigate(['/expenses', expense.id])"
            class="flex items-center justify-between bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 cursor-pointer hover:shadow-md transition-shadow"
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
      </div>"""


replace_list = """      <div id="expense-list-area" class="space-y-6">
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
                  [class]="viewMode() === 'grid' ? 'flex flex-col justify-between h-full gap-4' : 'flex items-center justify-between'"
                  class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 cursor-pointer hover:shadow-md transition-shadow"
                >
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 mb-1">
                      <h3 class="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{{ expense.title }}</h3>
                      @if (groupBy() !== 'category') {
                        <app-category-badge [category]="expense.category" />
                      }
                      @if (expense.isLoan) {
                        <span class="text-xs bg-amber-100 text-amber-800 rounded-full px-2 py-0.5 shrink-0">Loan</span>
                      }
                    </div>
                    <p class="text-xs text-gray-400">{{ expense.date | relativeDate }}</p>
                  </div>

                  <div [class]="viewMode() === 'grid' ? 'flex justify-end mt-auto' : ''">
                    <app-amount-display [amount]="expense.amount" type="expense" />
                  </div>
                </div>
              }
            </div>
          </div>
        }
      </div>"""

content = content.replace(search_toolbar, replace_toolbar)
content = content.replace(search_list, replace_list)

with open('expense-expert/src/app/features/expenses/expense-list/expense-list.component.ts', 'w') as f:
    f.write(content)
