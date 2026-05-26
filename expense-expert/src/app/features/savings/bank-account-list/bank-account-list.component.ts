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
        <div class="flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded-lg border border-transparent dark:border-gray-700 px-4 py-3">
          <div>
            <p class="text-sm font-medium text-gray-900 dark:text-gray-100">
              {{ account.accountName }}
              @if (account.totalSaved !== undefined) {
                <span class="text-xs ml-2 text-primary-600 dark:text-primary-400 font-semibold">Total Saved: ৳{{ account.totalSaved | number:'1.2-2' }}</span>
              }
            </p>
            <p class="text-xs text-gray-400 dark:text-gray-500">{{ account.bankName }} - ****{{ account.accountNumber }}</p>
          </div>
          <div class="flex gap-2">
            <button
              (click)="edit.emit(account)"
              class="text-xs text-primary-600 hover:text-primary-700 px-2 py-1"
            >
              Edit
            </button>
            <button
              (click)="delete.emit(account)"
              class="text-xs text-red-600 hover:text-red-700 px-2 py-1"
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
