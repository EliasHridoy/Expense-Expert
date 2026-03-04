import { Component, inject, signal, OnInit } from '@angular/core';
import { Router } from '@angular/router';
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
  totalCleared: number;
  outstanding: number;
  loans: Expense[];
}

@Component({
  selector: 'app-loan-summary',
  standalone: true,
  imports: [
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
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-gray-100">
              <th class="text-left px-4 py-3 font-medium text-gray-500">Person</th>
              <th class="text-right px-4 py-3 font-medium text-gray-500">Total Loaned</th>
              <th class="text-right px-4 py-3 font-medium text-gray-500">Cleared</th>
              <th class="text-right px-4 py-3 font-medium text-gray-500">Outstanding</th>
              <th class="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            @for (row of summaryRows(); track row.person.id) {
              <tr class="border-b border-gray-50">
                <td class="px-4 py-3 font-medium text-gray-900">{{ row.person.name }}</td>
                <td class="px-4 py-3 text-right text-gray-600">{{ row.totalLoaned | number:'1.0-0' }}</td>
                <td class="px-4 py-3 text-right text-green-600">{{ row.totalCleared | number:'1.0-0' }}</td>
                <td class="px-4 py-3 text-right font-medium" [class]="row.outstanding > 0 ? 'text-red-600' : 'text-gray-400'">
                  {{ row.outstanding | number:'1.0-0' }}
                </td>
                <td class="px-4 py-3 text-right">
                  @if (row.outstanding > 0) {
                    <button
                      (click)="selectedRow = row; showClearConfirm.set(true)"
                      class="text-xs text-primary-600 hover:text-primary-700 font-medium"
                    >
                      Clear All
                    </button>
                  }
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      <button
        (click)="router.navigate(['/drafts'])"
        class="mt-6 text-sm text-gray-500 hover:text-gray-700"
      >
        &larr; Back to Drafts
      </button>

      <app-confirm-dialog
        [isOpen]="showClearConfirm()"
        title="Clear All Loans"
        [message]="'Mark all outstanding loans for ' + (selectedRow?.person?.name || '') + ' as cleared?'"
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
  selectedRow: LoanSummaryRow | null = null;

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    this.personService.getPersons().subscribe((persons) => {
      this.expenseService.getOutstandingLoans().subscribe(() => {
        // Get all loan expenses
        const personMap = new Map<string, Person>();
        for (const p of persons) {
          personMap.set(p.id, p);
        }

        // We need all loan expenses (cleared and not)
        // Use outstanding + cleared to build the summary
        this.expenseService
          .getOutstandingLoans()
          .subscribe((loans) => {
            this.buildSummary(loans, personMap);
            this.isLoading.set(false);
          });
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
        totalCleared: 0,
        outstanding: 0,
        loans: [],
      };

      existing.totalLoaned += loan.amount;
      if (loan.loanCleared) {
        existing.totalCleared += loan.amount;
      } else {
        existing.outstanding += loan.amount;
      }
      existing.loans.push(loan);
      rowMap.set(loan.loanPersonId, existing);
    }

    this.summaryRows.set(Array.from(rowMap.values()));
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
