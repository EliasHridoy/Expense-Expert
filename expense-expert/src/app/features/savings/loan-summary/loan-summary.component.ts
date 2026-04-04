import { Component, inject, signal, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { ExpenseService } from '../../../core/services/expense.service';
import { PersonService } from '../../../core/services/person.service';
import { ToastService } from '../../../core/services/toast.service';
import { Expense } from '../../../core/models/expense.model';
import { Person } from '../../../core/models/person.model';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

interface LoanSummaryRow {
  person: Person;
  totalLoaned: number;
  totalRepaid: number;
  outstanding: number;
  loans: Expense[];
}

@Component({
  selector: 'app-loan-summary',
  standalone: true,
  imports: [
    FormsModule,
    DecimalPipe,
    PageHeaderComponent,
    LoadingSpinnerComponent,
    EmptyStateComponent,
    ConfirmDialogComponent,
  ],
  template: `
    <app-page-header title="Loan Summary" />

    @if (isLoading()) {
      <app-loading-spinner size="lg" [fullPage]="true" />
    } @else if (summaryRows().length === 0) {
      <app-empty-state message="No loans tracked yet" />
    } @else {
      <!-- Summary Table -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden mb-6">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-gray-200 dark:border-gray-700">
              <th class="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Person</th>
              <th class="text-right px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Total Loaned</th>
              <th class="text-right px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Repaid</th>
              <th class="text-right px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Outstanding</th>
              <th class="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            @for (row of summaryRows(); track row.person.id) {
              <tr class="border-b border-gray-100 dark:border-gray-700">
                <td class="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{{ row.person.name }}</td>
                <td class="px-4 py-3 text-right text-gray-600 dark:text-gray-300">{{ row.totalLoaned | number:'1.0-0' }}</td>
                <td class="px-4 py-3 text-right text-green-600">{{ row.totalRepaid | number:'1.0-0' }}</td>
                <td class="px-4 py-3 text-right font-medium" [class]="row.outstanding > 0 ? 'text-red-600' : 'text-green-600'">
                  {{ row.outstanding | number:'1.0-0' }}
                </td>
                <td class="px-4 py-3 text-right">
                  @if (row.outstanding > 0) {
                    <div class="flex items-center gap-2 justify-end">
                      <button
                        (click)="openRepayDialog(row)"
                        class="text-xs text-primary-600 hover:text-primary-700 font-medium"
                      >
                        Record Payment
                      </button>
                      <button
                        (click)="selectedRow = row; showClearConfirm.set(true)"
                        class="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                      >
                        Clear All
                      </button>
                    </div>
                  } @else {
                    <span class="text-xs text-green-600">Fully Repaid</span>
                  }
                </td>
              </tr>

              <!-- Expanded loan details when repay dialog is open for this row -->
              @if (repayRow === row && showRepayDialog()) {
                <tr>
                  <td colspan="5" class="px-4 py-3 bg-gray-50 dark:bg-gray-700/50">
                    <div class="space-y-3">
                      <p class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Outstanding loans for {{ row.person.name }}:
                      </p>
                      @for (loan of getOutstandingLoans(row); track loan.id) {
                        <div class="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg px-3 py-2 border border-gray-200 dark:border-gray-600">
                          <div>
                            <p class="text-sm text-gray-900 dark:text-gray-100">{{ loan.title }}</p>
                            <p class="text-xs text-gray-500 dark:text-gray-400">
                              Loaned: {{ loan.amount | number:'1.0-0' }} |
                              Repaid: {{ (loan.loanRepaid) | number:'1.0-0' }} |
                              Left: {{ loan.amount - (loan.loanRepaid) | number:'1.0-0' }}
                            </p>
                          </div>
                          <div class="flex items-center gap-2">
                            <input
                              type="number"
                              [(ngModel)]="repayAmounts[loan.id]"
                              [max]="loan.amount - (loan.loanRepaid)"
                              min="0"
                              placeholder="0"
                              class="w-24 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-2 py-1 text-sm text-right text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            />
                            <button
                              (click)="recordSingleRepayment(loan)"
                              [disabled]="!repayAmounts[loan.id] || repayAmounts[loan.id] <= 0"
                              class="rounded-lg bg-green-600 px-3 py-1 text-xs font-medium text-white hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Pay
                            </button>
                          </div>
                        </div>
                      }
                      <button
                        (click)="showRepayDialog.set(false); repayRow = null"
                        class="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                      >
                        Close
                      </button>
                    </div>
                  </td>
                </tr>
              }
            }
          </tbody>
        </table>
      </div>

      <button
        (click)="router.navigate(['/savings'])"
        class="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
      >
        &larr; Back to Savings
      </button>

      <app-confirm-dialog
        [isOpen]="showClearConfirm()"
        title="Clear All Loans"
        [message]="'Mark all outstanding loans for ' + (selectedRow?.person?.name || '') + ' as fully repaid?'"
        confirmLabel="Clear All"
        (confirmed)="clearLoans()"
        (cancelled)="showClearConfirm.set(false)"
      />
    }
  `,
})
export class LoanSummaryComponent implements OnInit {
  private expenseService = inject(ExpenseService);
  private personService = inject(PersonService);
  private toastService = inject(ToastService);
  router = inject(Router);

  summaryRows = signal<LoanSummaryRow[]>([]);
  isLoading = signal(true);
  showClearConfirm = signal(false);
  showRepayDialog = signal(false);
  selectedRow: LoanSummaryRow | null = null;
  repayRow: LoanSummaryRow | null = null;
  repayAmounts: Record<string, number> = {};

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    this.personService.getPersons().subscribe((persons) => {
      const personMap = new Map<string, Person>();
      for (const p of persons) {
        personMap.set(p.id, p);
      }

      this.expenseService.getAllLoans().subscribe((loans) => {
        this.buildSummary(loans, personMap);
        this.isLoading.set(false);
      });
    });
  }

  private buildSummary(allLoans: Expense[], personMap: Map<string, Person>): void {
    const rowMap = new Map<string, LoanSummaryRow>();

    for (const loan of allLoans) {
      if (!loan.loanPersonId) continue;
      const person = personMap.get(loan.loanPersonId);
      if (!person) continue;

      const existing = rowMap.get(loan.loanPersonId) || {
        person,
        totalLoaned: 0,
        totalRepaid: 0,
        outstanding: 0,
        loans: [],
      };

      existing.totalLoaned += loan.amount;
      const repaid = loan.loanRepaid;
      existing.totalRepaid += repaid;
      existing.outstanding += loan.amount - repaid;
      existing.loans.push(loan);
      rowMap.set(loan.loanPersonId, existing);
    }

    this.summaryRows.set(Array.from(rowMap.values()));
  }

  getOutstandingLoans(row: LoanSummaryRow): Expense[] {
    return row.loans.filter((l) => !l.loanCleared);
  }

  openRepayDialog(row: LoanSummaryRow): void {
    this.repayRow = row;
    this.repayAmounts = {};
    this.showRepayDialog.set(true);
  }

  async recordSingleRepayment(loan: Expense): Promise<void> {
    const amount = this.repayAmounts[loan.id];
    if (!amount || amount <= 0) return;

    const maxAllowed = loan.amount - (loan.loanRepaid);
    if (amount > maxAllowed) {
      this.toastService.error(`Maximum repayment is ${maxAllowed}`);
      return;
    }

    try {
      await this.expenseService.recordLoanRepayment(loan, amount);
      this.repayAmounts[loan.id] = 0;
      this.toastService.success(`Recorded payment of ${amount}`);
    } catch {
      this.toastService.error('Failed to record payment');
    }
  }

  async clearLoans(): Promise<void> {
    if (!this.selectedRow) return;

    try {
      const unclearedLoans = this.selectedRow.loans.filter((l) => !l.loanCleared);
      for (const loan of unclearedLoans) {
        await this.expenseService.clearLoan(loan.id);
      }
      this.toastService.success(`Loans cleared for ${this.selectedRow.person.name}`);
    } catch {
      this.toastService.error('Failed to clear loans');
    }
    this.showClearConfirm.set(false);
    this.selectedRow = null;
  }
}
