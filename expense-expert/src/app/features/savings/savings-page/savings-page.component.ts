import { Component, inject, signal, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { SavingService } from '../../../core/services/saving.service';
import { ExpenseService } from '../../../core/services/expense.service';
import { ExpenseCategory } from '../../../core/models/expense.model';
import { ToastService } from '../../../core/services/toast.service';
import { TourService } from '../../../core/services/tour.service';
import { BankAccount, SavingGoal } from '../../../core/models/saving.model';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { MonthPickerComponent } from '../../../shared/components/month-picker/month-picker.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { BankAccountListComponent } from '../bank-account-list/bank-account-list.component';
import { SavingGoalListComponent } from '../saving-goal-list/saving-goal-list.component';

@Component({
  selector: 'app-savings-page',
  standalone: true,
  imports: [
    FormsModule,
    DecimalPipe,
    PageHeaderComponent,
    MonthPickerComponent,
    LoadingSpinnerComponent,
    ConfirmDialogComponent,
    BankAccountListComponent,
    SavingGoalListComponent,
  ],
  template: `
    <app-page-header title="Savings" />

    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <app-month-picker [currentMonth]="currentMonth()" (monthChanged)="onMonthChange($event)" />
      <div class="flex flex-wrap gap-2">
        <button
          (click)="router.navigate(['/savings/accounts/new'])"
          class="rounded-lg bg-gray-100 dark:bg-gray-700 px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          + Bank Account
        </button>
        <button
          (click)="router.navigate(['/savings/goals/new'])"
          class="rounded-lg bg-primary-600 px-3 py-2 text-xs font-medium text-white hover:bg-primary-700 transition-colors whitespace-nowrap"
        >
          + Saving Goal
        </button>
        <button
          (click)="router.navigate(['/savings/history'])"
          class="rounded-lg bg-gray-100 dark:bg-gray-700 px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          History
        </button>
      </div>
    </div>

    @if (isLoading()) {
      <app-loading-spinner size="lg" [fullPage]="true" />
    } @else {
      <!-- Loans Summary -->
      <div class="mb-8">
        <h2 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Loans</h2>
        <div
          id="loans-summary-card" 
          (click)="router.navigate(['/savings/loans'])"
          class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
        >
          <div>
            <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Total Pending Loan to Pay</p>
            <p class="text-xl font-bold text-gray-900 dark:text-gray-100" [class.text-red-600]="totalPendingLoan() > 0" [class.dark:text-red-400]="totalPendingLoan() > 0">
              {{ totalPendingLoan() | number:'1.0-0' }}
            </p>
          </div>
          <div class="text-gray-400 dark:text-gray-500">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>

      <!-- Bank Accounts -->
      <div id="bank-accounts-section" class="mb-8">
        <h2 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Bank Accounts</h2>
        <app-bank-account-list
          [accounts]="bankAccounts()"
          (edit)="router.navigate(['/savings/accounts', $event.id, 'edit'])"
          (delete)="accountToDelete = $event; showDeleteConfirm.set(true)"
        />
      </div>

      <!-- Saving Goals for Month -->
      <div id="saving-goals-section" class="mb-8">
        <h2 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Saving Goals</h2>
        <app-saving-goal-list
          [goals]="goals()"
          (edit)="router.navigate(['/savings/goals', $event.id, 'edit'])"
          (addEntry)="openSaveDialog($event)"
          (withdraw)="openWithdrawDialog($event)"
          (delete)="goalToDelete = $event; showGoalDeleteConfirm.set(true)"
        />
      </div>
    }

    <!-- Quick Save Dialog -->
    @if (showSaveDialog()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center">
        <div class="fixed inset-0 bg-black/50" (click)="showSaveDialog.set(false)"></div>
        <div class="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 max-w-sm w-full mx-4">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Save to "{{ selectedGoal?.purpose }}"
          </h3>
          <input
            [(ngModel)]="saveAmount"
            type="number"
            min="1"
            placeholder="Amount"
            class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 px-4 py-2.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none mb-3"
          />
          <input
            [(ngModel)]="saveNote"
            placeholder="Note (optional)"
            class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 px-4 py-2.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none mb-3"
          />
          <label class="flex items-center gap-2 mb-4 cursor-pointer select-none">
            <input
              type="checkbox"
              [(ngModel)]="markAsExpense"
              class="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500"
            />
            <span class="text-sm text-gray-700 dark:text-gray-300">Also record as expense</span>
          </label>
          <div class="flex gap-3">
            <button
              (click)="confirmSave()"
              [disabled]="!saveAmount || saveAmount <= 0"
              class="flex-1 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50 transition-colors"
            >
              Save
            </button>
            <button
              (click)="showSaveDialog.set(false)"
              class="rounded-lg px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    }

    <!-- Withdraw Dialog -->
    @if (showWithdrawDialog()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center">
        <div class="fixed inset-0 bg-black/50" (click)="showWithdrawDialog.set(false)"></div>
        <div class="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 max-w-sm w-full mx-4">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Withdraw from "{{ withdrawGoal?.purpose }}"
          </h3>
          <p class="text-xs text-gray-500 dark:text-gray-400 mb-4">
            Available: {{ withdrawGoal?.savedAmount | number:'1.0-0' }}
          </p>
          <input
            [(ngModel)]="withdrawAmount"
            type="number"
            min="1"
            [max]="withdrawGoal?.savedAmount ?? 0"
            placeholder="Amount"
            class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 px-4 py-2.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none mb-3"
          />
          <input
            [(ngModel)]="withdrawNote"
            placeholder="Reason (optional)"
            class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 px-4 py-2.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none mb-4"
          />
          <div class="flex gap-3">
            <button
              (click)="confirmWithdraw()"
              [disabled]="!withdrawAmount || withdrawAmount <= 0 || withdrawAmount > (withdrawGoal?.savedAmount ?? 0)"
              class="flex-1 rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50 transition-colors"
            >
              Withdraw
            </button>
            <button
              (click)="showWithdrawDialog.set(false)"
              class="rounded-lg px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    }

    <app-confirm-dialog
      [isOpen]="showDeleteConfirm()"
      title="Delete Account"
      message="Are you sure you want to delete this bank account?"
      confirmLabel="Delete"
      (confirmed)="deleteAccount()"
      (cancelled)="showDeleteConfirm.set(false)"
    />

    <app-confirm-dialog
      [isOpen]="showGoalDeleteConfirm()"
      title="Delete Saving Goal"
      message="Are you sure you want to delete this saving goal? This will also remove the total savings associated with it."
      confirmLabel="Delete"
      (confirmed)="deleteGoal()"
      (cancelled)="showGoalDeleteConfirm.set(false)"
    />
  `,
})
export class SavingsPageComponent implements OnInit {
  private savingService = inject(SavingService);
  private expenseService = inject(ExpenseService);
  private toastService = inject(ToastService);
  private tourService = inject(TourService);
  router = inject(Router);

  currentMonth = signal(this.getCurrentMonth());
  bankAccounts = signal<BankAccount[]>([]);
  goals = signal<SavingGoal[]>([]);
  totalPendingLoan = signal<number>(0);
  isLoading = signal(true);

  showSaveDialog = signal(false);
  selectedGoal: SavingGoal | null = null;
  saveAmount: number | null = null;
  saveNote = '';
  markAsExpense = true;

  showDeleteConfirm = signal(false);
  accountToDelete: BankAccount | null = null;

  showGoalDeleteConfirm = signal(false);
  goalToDelete: SavingGoal | null = null;

  showWithdrawDialog = signal(false);
  withdrawGoal: SavingGoal | null = null;
  withdrawAmount: number | null = null;
  withdrawNote = '';

  ngOnInit(): void {
    this.loadData();
  }

  onMonthChange(month: string): void {
    this.currentMonth.set(month);
    this.loadGoals();
  }

  openSaveDialog(goal: SavingGoal): void {
    this.selectedGoal = goal;
    this.saveAmount = null;
    this.saveNote = '';
    this.markAsExpense = true;
    this.showSaveDialog.set(true);
  }

  async confirmSave(): Promise<void> {
    if (!this.selectedGoal || !this.saveAmount) return;

    try {
      await this.savingService.addSavingEntry(
        {
          goalId: this.selectedGoal.id,
          amount: this.saveAmount,
          type: 'deposit',
          date: new Date(),
          note: this.saveNote,
        },
        this.currentMonth()
      );

      if (this.markAsExpense) {
        await this.expenseService.addExpense({
          title: `Saving: ${this.selectedGoal.purpose}`,
          description: this.saveNote || `Saving deposit for ${this.selectedGoal.purpose}`,
          amount: this.saveAmount,
          category: ExpenseCategory.Savings,
          date: new Date(),
          isLoan: false,
          loanPersonId: null,
        });
      }

      this.toastService.success('Saved successfully');
      this.showSaveDialog.set(false);
    } catch {
      this.toastService.error('Failed to save');
    }
  }

  openWithdrawDialog(goal: SavingGoal): void {
    this.withdrawGoal = goal;
    this.withdrawAmount = null;
    this.withdrawNote = '';
    this.showWithdrawDialog.set(true);
  }

  async confirmWithdraw(): Promise<void> {
    if (!this.withdrawGoal || !this.withdrawAmount) return;

    if (this.withdrawAmount > this.withdrawGoal.savedAmount) {
      this.toastService.error('Cannot withdraw more than saved amount');
      return;
    }

    try {
      await this.savingService.addSavingEntry(
        {
          goalId: this.withdrawGoal.id,
          amount: this.withdrawAmount,
          type: 'withdrawal',
          date: new Date(),
          note: this.withdrawNote,
        },
        this.currentMonth()
      );
      this.toastService.success('Withdrawal recorded');
      this.showWithdrawDialog.set(false);
    } catch {
      this.toastService.error('Failed to withdraw');
    }
  }

  async deleteAccount(): Promise<void> {
    if (!this.accountToDelete) return;

    try {
      await this.savingService.deleteBankAccount(this.accountToDelete.id);
      this.toastService.success('Account deleted');
    } catch {
      this.toastService.error('Failed to delete account');
    }
    this.showDeleteConfirm.set(false);
    this.accountToDelete = null;
  }

  async deleteGoal(): Promise<void> {
    if (!this.goalToDelete) return;

    try {
      await this.savingService.deleteGoal(this.goalToDelete.id);
      this.toastService.success('Saving goal deleted');
      // No need to manual reload as Firestore real-time listener (if active) handles it,
      // but if using one-shot read we need to reload. Let's just reload.
      this.loadGoals();
    } catch {
      this.toastService.error('Failed to delete saving goal');
    }
    this.showGoalDeleteConfirm.set(false);
    this.goalToDelete = null;
  }

  private loadData(): void {
    this.isLoading.set(true);
    this.savingService.getBankAccounts().subscribe((accounts) => {
      this.bankAccounts.set(accounts);
      this.isLoading.set(false);

      this.tourService.loadTourState().then(() => {
        this.tourService.tryStartPageTour('savings');
      });
    });
    this.expenseService.getOutstandingLoans().subscribe((loans) => {
      const total = loans.reduce((acc, loan) => acc + (loan.amount - (loan.loanRepaid || 0)), 0);
      this.totalPendingLoan.set(total);
    });
    this.loadGoals();
  }

  private loadGoals(): void {
    this.savingService.getGoalsActiveInMonth(this.currentMonth()).subscribe((goals) => {
      this.goals.set(goals);
    });
  }

  private getCurrentMonth(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }
}
