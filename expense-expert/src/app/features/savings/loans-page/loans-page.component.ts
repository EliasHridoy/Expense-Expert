import { Component, inject, signal, computed, OnInit, effect } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DecimalPipe, DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { combineLatest } from 'rxjs';
import { LoanService } from '../../../core/services/loan.service';
import { PersonService } from '../../../core/services/person.service';
import { ExpenseService } from '../../../core/services/expense.service';
import { ToastService } from '../../../core/services/toast.service';
import { LoanTaken, LoanStatus } from '../../../core/models/loan.model';
import { Person } from '../../../core/models/person.model';
import { Expense } from '../../../core/models/expense.model';
import { MonthPickerComponent } from '../../../shared/components/month-picker/month-picker.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';

type Tab = 'taken' | 'given';

interface LoanGivenRow {
  person: Person;
  totalLoaned: number;
  totalRepaid: number;
  outstanding: number;
  loans: Expense[];
}

@Component({
  selector: 'app-loans-page',
  standalone: true,
  imports: [FormsModule, DecimalPipe, DatePipe, MonthPickerComponent, PageHeaderComponent, ConfirmDialogComponent, LoadingSpinnerComponent, EmptyStateComponent],
  template: `
    <app-page-header title="Loans" />

    <!-- Tab Switcher -->
    <div class="flex gap-1 mb-6 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl w-fit">
      <button (click)="activeTab.set('taken')"
        [class]="activeTab() === 'taken'
          ? 'px-5 py-2 rounded-lg text-sm font-semibold bg-white dark:bg-gray-700 text-red-600 dark:text-red-400 shadow-sm transition-all'
          : 'px-5 py-2 rounded-lg text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-all'">
        💸 Loan Taken
      </button>
      <button (click)="activeTab.set('given')"
        [class]="activeTab() === 'given'
          ? 'px-5 py-2 rounded-lg text-sm font-semibold bg-white dark:bg-gray-700 text-green-600 dark:text-green-400 shadow-sm transition-all'
          : 'px-5 py-2 rounded-lg text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-all'">
        🤝 Loan Given
      </button>
    </div>

    @if (isLoading()) {
      <app-loading-spinner size="lg" [fullPage]="true" />
    } @else {

      <!-- ===================== LOAN TAKEN TAB ===================== -->
      @if (activeTab() === 'taken') {
        <!-- Summary Cards -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div class="bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 rounded-xl border border-red-100 dark:border-red-800/30 p-4">
            <p class="text-xs font-medium text-red-500 dark:text-red-400 uppercase tracking-wide mb-1">Borrowed This Month</p>
            <p class="text-2xl font-bold text-red-600 dark:text-red-400">{{ takenThisMonth() | number:'1.0-0' }}</p>
          </div>
          <div class="bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 rounded-xl border border-amber-100 dark:border-amber-800/30 p-4">
            <p class="text-xs font-medium text-amber-600 dark:text-amber-400 uppercase tracking-wide mb-1">Outstanding</p>
            <p class="text-2xl font-bold text-amber-600 dark:text-amber-400">{{ takenOutstanding() | number:'1.0-0' }}</p>
          </div>
          <div class="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-100 dark:border-green-800/30 p-4">
            <p class="text-xs font-medium text-green-600 dark:text-green-400 uppercase tracking-wide mb-1">Repaid</p>
            <p class="text-2xl font-bold text-green-600 dark:text-green-400">{{ takenRepaid() | number:'1.0-0' }}</p>
          </div>
        </div>

        <!-- Month Picker + Add Button -->
        <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
          <app-month-picker [currentMonth]="currentMonth()" (monthChanged)="currentMonth.set($event)" />
          <button (click)="showAddTaken.set(!showAddTaken())"
            class="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors">
            {{ showAddTaken() ? 'Cancel' : '+ Record Loan Taken' }}
          </button>
        </div>

        <!-- Add Loan Taken Form -->
        @if (showAddTaken()) {
          <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 mb-5 shadow-sm">
            <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-4">Record Money Borrowed</h3>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              <div>
                <label class="block text-xs text-gray-500 dark:text-gray-400 mb-1">From Person</label>
                <select [(ngModel)]="newTaken.personId"
                  class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-red-500">
                  <option value="">— Select person —</option>
                  @for (p of persons(); track p.id) {
                    <option [value]="p.id">{{ p.name }}</option>
                  }
                </select>
              </div>
              <div>
                <label class="block text-xs text-gray-500 dark:text-gray-400 mb-1">Or Add New Person</label>
                <div class="flex gap-2">
                  <input type="text" [(ngModel)]="newPersonName" placeholder="New person name"
                    class="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-red-500" />
                  <button (click)="addNewPerson()" [disabled]="!newPersonName.trim()"
                    class="rounded-lg bg-gray-200 dark:bg-gray-600 px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500 disabled:opacity-50">Add</button>
                </div>
              </div>
              <div>
                <label class="block text-xs text-gray-500 dark:text-gray-400 mb-1">Amount</label>
                <input type="number" [(ngModel)]="newTaken.amount" min="1" placeholder="0"
                  class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-red-500" />
              </div>
              <div>
                <label class="block text-xs text-gray-500 dark:text-gray-400 mb-1">Date</label>
                <input type="date" [(ngModel)]="newTaken.date"
                  class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-red-500" />
              </div>
              <div class="sm:col-span-2">
                <label class="block text-xs text-gray-500 dark:text-gray-400 mb-1">Note (optional)</label>
                <input type="text" [(ngModel)]="newTaken.note" placeholder="e.g. emergency, business"
                  class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-red-500" />
              </div>
            </div>
            <button (click)="saveLoanTaken()" [disabled]="!newTaken.personId || !newTaken.amount || !newTaken.date"
              class="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              Save Loan
            </button>
          </div>
        }

        <!-- Loans Taken List -->
        @if (loansForMonth().length === 0) {
          <app-empty-state icon="💸" message="No loans taken this month" />
        } @else {
          <div class="space-y-3">
            @for (loan of loansForMonth(); track loan.id) {
              <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
                <div class="flex items-start justify-between gap-3 mb-3">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-lg font-bold text-red-600 dark:text-red-400">
                      {{ getPersonName(loan.personId).charAt(0).toUpperCase() }}
                    </div>
                    <div>
                      <p class="font-semibold text-gray-900 dark:text-gray-100">{{ getPersonName(loan.personId) }}</p>
                      <p class="text-xs text-gray-400 dark:text-gray-500">{{ loan.date | date:'mediumDate' }}{{ loan.note ? ' · ' + loan.note : '' }}</p>
                    </div>
                  </div>
                  <div class="flex items-center gap-2">
                    <span [class]="getStatusClass(loan.status)" class="px-2.5 py-1 rounded-full text-xs font-semibold">
                      {{ getStatusLabel(loan.status) }}
                    </span>
                    <p class="text-lg font-bold text-gray-900 dark:text-gray-100">{{ loan.amount | number:'1.0-0' }}</p>
                  </div>
                </div>
                <!-- Progress Bar -->
                <div class="mb-3">
                  <div class="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                    <span>Repaid: {{ loan.repaid | number:'1.0-0' }}</span>
                    <span>Remaining: {{ (loan.amount - loan.repaid) | number:'1.0-0' }}</span>
                  </div>
                  <div class="w-full h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div class="h-2 rounded-full transition-all duration-500"
                      [class]="loan.status === 'cleared' ? 'bg-green-500' : 'bg-red-500'"
                      [style.width]="getRepaidPercent(loan) + '%'"></div>
                  </div>
                </div>
                @if (loan.status !== 'cleared') {
                  <div class="flex items-center gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                    <input type="number" [(ngModel)]="repayAmounts[loan.id]" min="1" [max]="loan.amount - loan.repaid" placeholder="Amount to repay"
                      class="flex-1 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-3 py-1.5 text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-red-500" />
                    <input type="date" [(ngModel)]="repayDates[loan.id]"
                      class="rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-3 py-1.5 text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-red-500" />
                    <button (click)="recordRepayment(loan)" [disabled]="!repayAmounts[loan.id] || !repayDates[loan.id]"
                      class="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap">
                      Repay
                    </button>
                  </div>
                }
              </div>
            }
          </div>
        }
      }

      <!-- ===================== LOAN GIVEN TAB ===================== -->
      @if (activeTab() === 'given') {
        <!-- Summary Cards -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div class="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-100 dark:border-blue-800/30 p-4">
            <p class="text-xs font-medium text-blue-500 dark:text-blue-400 uppercase tracking-wide mb-1">Total Lent</p>
            <p class="text-2xl font-bold text-blue-600 dark:text-blue-400">{{ givenTotal() | number:'1.0-0' }}</p>
          </div>
          <div class="bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 rounded-xl border border-amber-100 dark:border-amber-800/30 p-4">
            <p class="text-xs font-medium text-amber-600 dark:text-amber-400 uppercase tracking-wide mb-1">Outstanding</p>
            <p class="text-2xl font-bold text-amber-600 dark:text-amber-400">{{ givenOutstanding() | number:'1.0-0' }}</p>
          </div>
          <div class="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-100 dark:border-green-800/30 p-4">
            <p class="text-xs font-medium text-green-600 dark:text-green-400 uppercase tracking-wide mb-1">Received Back</p>
            <p class="text-2xl font-bold text-green-600 dark:text-green-400">{{ givenRepaid() | number:'1.0-0' }}</p>
          </div>
        </div>

        @if (givenRows().length === 0) {
          <app-empty-state message="No loans given yet. Add a loan expense with a person assigned." />
        } @else {
          <div class="space-y-3">
            @for (row of givenRows(); track row.person.id) {
              <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                <div class="flex items-center justify-between px-5 py-4">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-lg font-bold text-blue-600 dark:text-blue-400">
                      {{ row.person.name.charAt(0).toUpperCase() }}
                    </div>
                    <div>
                      <p class="font-semibold text-gray-900 dark:text-gray-100">{{ row.person.name }}</p>
                      <p class="text-xs text-gray-400">{{ row.loans.length }} loan{{ row.loans.length !== 1 ? 's' : '' }}</p>
                    </div>
                  </div>
                  <div class="text-right">
                    <p class="text-xs text-gray-400 mb-0.5">Outstanding</p>
                    <p [class]="row.outstanding > 0 ? 'text-red-600 dark:text-red-400 font-bold text-lg' : 'text-green-600 dark:text-green-400 font-bold text-lg'">
                      {{ row.outstanding | number:'1.0-0' }}
                    </p>
                  </div>
                </div>
                @if (row.outstanding > 0) {
                  <div class="border-t border-gray-100 dark:border-gray-700 px-5 py-3 flex items-center gap-3 flex-wrap">
                    @for (loan of getOutstandingGivenLoans(row); track loan.id) {
                      <div class="flex-1 min-w-[220px] flex items-center gap-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg px-3 py-2">
                        <div class="flex-1">
                          <p class="text-xs font-medium text-gray-700 dark:text-gray-200">{{ loan.title }}</p>
                          <p class="text-xs text-gray-400">Left: {{ (loan.amount - loan.loanRepaid) | number:'1.0-0' }}</p>
                        </div>
                        <input type="number" [(ngModel)]="givenRepayAmounts[loan.id]" [max]="loan.amount - loan.loanRepaid" min="1" placeholder="0"
                          class="w-20 rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-2 py-1 text-xs text-right" />
                        <button (click)="recordGivenRepayment(loan)" [disabled]="!givenRepayAmounts[loan.id]"
                          class="rounded bg-green-600 px-2 py-1 text-xs text-white hover:bg-green-700 disabled:opacity-50">Pay</button>
                      </div>
                    }
                    <button (click)="selectedGivenRow = row; showClearConfirm.set(true)"
                      class="text-xs text-gray-400 hover:text-red-500 whitespace-nowrap">Clear All</button>
                  </div>
                } @else {
                  <div class="border-t border-gray-100 dark:border-gray-700 px-5 py-2">
                    <span class="text-xs text-green-600 dark:text-green-400 font-medium">✓ Fully Repaid</span>
                  </div>
                }
              </div>
            }
          </div>
        }
      }
    }

    <app-confirm-dialog
      [isOpen]="showClearConfirm()"
      title="Clear All Loans"
      [message]="'Mark all outstanding loans for ' + (selectedGivenRow?.person?.name || '') + ' as fully repaid?'"
      confirmLabel="Clear All"
      (confirmed)="clearGivenLoans()"
      (cancelled)="showClearConfirm.set(false)"
    />
  `,
})
export class LoansPageComponent implements OnInit {
  private loanService = inject(LoanService);
  private personService = inject(PersonService);
  private expenseService = inject(ExpenseService);
  private toastService = inject(ToastService);
  router = inject(Router);

  activeTab = signal<Tab>('taken');
  currentMonth = signal(this.getMonth(new Date()));
  isLoading = signal(true);

  persons = signal<Person[]>([]);
  loansForMonth = signal<LoanTaken[]>([]);
  allLoansTaken = signal<LoanTaken[]>([]);
  givenRows = signal<LoanGivenRow[]>([]);

  showAddTaken = signal(false);
  showClearConfirm = signal(false);

  newPersonName = '';
  newTaken = { personId: '', amount: 0, date: '', note: '' };
  repayAmounts: Record<string, number> = {};
  repayDates: Record<string, string> = {};
  givenRepayAmounts: Record<string, number> = {};
  selectedGivenRow: LoanGivenRow | null = null;

  takenThisMonth = computed(() => this.loansForMonth().reduce((s, l) => s + l.amount, 0));
  takenRepaid = computed(() => this.loansForMonth().reduce((s, l) => s + l.repaid, 0));
  takenOutstanding = computed(() => this.takenThisMonth() - this.takenRepaid());

  givenTotal = computed(() => this.givenRows().reduce((s, r) => s + r.totalLoaned, 0));
  givenRepaid = computed(() => this.givenRows().reduce((s, r) => s + r.totalRepaid, 0));
  givenOutstanding = computed(() => this.givenRows().reduce((s, r) => s + r.outstanding, 0));

  private personMap = new Map<string, Person>();

  constructor() {
    effect(() => {
      const month = this.currentMonth();
      this.loanService.getLoansForMonth(month).subscribe((loans) => this.loansForMonth.set(loans));
    }, { allowSignalWrites: true });
  }

  ngOnInit(): void {
    combineLatest([
      this.personService.getPersons(),
      this.expenseService.getAllLoans(),
      this.loanService.getAllLoansTaken(),
    ]).subscribe(([persons, loans, allTaken]) => {
      this.persons.set(persons);
      this.personMap.clear();
      persons.forEach((p) => this.personMap.set(p.id, p));
      this.allLoansTaken.set(allTaken);
      this.buildGivenRows(loans, persons);
      this.isLoading.set(false);
    });
  }

  private buildGivenRows(loans: any[], persons: Person[]): void {
    const personMap = new Map<string, Person>(persons.map((p) => [p.id, p]));
    const rowMap = new Map<string, LoanGivenRow>();
    for (const loan of loans) {
      if (!loan.loanPersonId) continue;
      const person = personMap.get(loan.loanPersonId);
      if (!person) continue;
      const row = rowMap.get(loan.loanPersonId) || { person, totalLoaned: 0, totalRepaid: 0, outstanding: 0, loans: [] };
      row.totalLoaned += loan.amount;
      row.totalRepaid += loan.loanRepaid ?? 0;
      row.outstanding += loan.amount - (loan.loanRepaid ?? 0);
      row.loans.push(loan);
      rowMap.set(loan.loanPersonId, row);
    }
    this.givenRows.set(Array.from(rowMap.values()));
  }

  getPersonName(id: string): string {
    return this.personMap.get(id)?.name ?? id;
  }

  getStatusLabel(status: LoanStatus): string {
    return status === 'cleared' ? 'Cleared' : status === 'partially_repaid' ? 'Partial' : 'Active';
  }

  getStatusClass(status: LoanStatus): string {
    if (status === 'cleared') return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
    if (status === 'partially_repaid') return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
    return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
  }

  getRepaidPercent(loan: LoanTaken): number {
    return loan.amount > 0 ? Math.min(100, (loan.repaid / loan.amount) * 100) : 0;
  }

  getOutstandingGivenLoans(row: LoanGivenRow): any[] {
    return row.loans.filter((l) => !l.loanCleared);
  }

  async addNewPerson(): Promise<void> {
    if (!this.newPersonName.trim()) return;
    try {
      const id = await this.personService.addPersonIfNotExists(this.newPersonName.trim());
      this.newTaken.personId = id;
      this.newPersonName = '';
      this.toastService.success('Person added');
    } catch {
      this.toastService.error('Failed to add person');
    }
  }

  async saveLoanTaken(): Promise<void> {
    if (!this.newTaken.personId || !this.newTaken.amount || !this.newTaken.date) return;
    try {
      await this.loanService.addLoanTaken({
        personId: this.newTaken.personId,
        amount: this.newTaken.amount,
        note: this.newTaken.note,
        date: new Date(this.newTaken.date),
      });
      this.newTaken = { personId: '', amount: 0, date: '', note: '' };
      this.showAddTaken.set(false);
      this.toastService.success('Loan recorded');
    } catch {
      this.toastService.error('Failed to save loan');
    }
  }

  async recordRepayment(loan: LoanTaken): Promise<void> {
    const amount = this.repayAmounts[loan.id];
    const date = this.repayDates[loan.id];
    if (!amount || !date) return;
    const max = loan.amount - loan.repaid;
    if (amount > max) { this.toastService.error(`Max repayment is ${max}`); return; }
    try {
      await this.loanService.recordRepayment(loan, amount, new Date(date));
      this.repayAmounts[loan.id] = 0;
      this.repayDates[loan.id] = '';
      this.toastService.success('Repayment recorded');
    } catch {
      this.toastService.error('Failed to record repayment');
    }
  }

  async recordGivenRepayment(loan: any): Promise<void> {
    const amount = this.givenRepayAmounts[loan.id];
    if (!amount) return;
    const max = loan.amount - (loan.loanRepaid ?? 0);
    if (amount > max) { this.toastService.error(`Max is ${max}`); return; }
    try {
      await this.expenseService.recordLoanRepayment(loan, amount);
      this.givenRepayAmounts[loan.id] = 0;
      this.toastService.success('Payment recorded');
    } catch {
      this.toastService.error('Failed to record payment');
    }
  }

  async clearGivenLoans(): Promise<void> {
    if (!this.selectedGivenRow) return;
    try {
      for (const loan of this.selectedGivenRow.loans.filter((l) => !l.loanCleared)) {
        await this.expenseService.clearLoan(loan.id);
      }
      this.toastService.success('Loans cleared');
    } catch {
      this.toastService.error('Failed to clear loans');
    }
    this.showClearConfirm.set(false);
    this.selectedGivenRow = null;
  }

  private getMonth(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }
}
