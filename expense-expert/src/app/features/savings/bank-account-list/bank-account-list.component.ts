import { Component, Input, Output, EventEmitter } from '@angular/core';
import { BankAccount } from '../../../core/models/saving.model';
import { DecimalPipe } from '@angular/common';

export type BankAccountWithTotal = BankAccount & { totalSaved?: number };

@Component({
  selector: 'app-bank-account-list',
  standalone: true,
  imports: [DecimalPipe],
  template: `
    <div class="space-y-2">
      @for (account of accounts; track account.id) {
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700/80 px-4 py-3">
          <div class="min-w-0">
            <div class="flex flex-wrap items-center gap-1.5">
              <span class="text-sm font-medium text-gray-900 dark:text-gray-100 break-words">{{ account.accountName }}</span>
              @if (account.totalSaved !== undefined) {
                <span class="text-xs font-semibold px-2 py-0.5 rounded-md bg-primary-50 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300">
                  Total: ৳{{ account.totalSaved | number:'1.2-2' }}
                </span>
              }
            </div>
            <p class="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{{ account.bankName }} - ****{{ account.accountNumber }}</p>
          </div>
          <div class="flex items-center gap-2 self-end sm:self-auto shrink-0">
            <button
              type="button"
              (click)="edit.emit(account)"
              class="text-xs font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 px-2.5 py-1.5 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/30 transition-colors"
            >
              Edit
            </button>
            <button
              type="button"
              (click)="delete.emit(account)"
              class="text-xs font-medium text-red-600 dark:text-red-400 hover:text-red-700 px-2.5 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      } @empty {
        <p class="text-sm text-gray-400 dark:text-gray-500 text-center py-4">No bank accounts added yet.</p>
      }
    </div>
  `,
})
export class BankAccountListComponent {
  @Input() accounts: BankAccountWithTotal[] = [];
  @Output() edit = new EventEmitter<BankAccountWithTotal>();
  @Output() delete = new EventEmitter<BankAccountWithTotal>();
}
