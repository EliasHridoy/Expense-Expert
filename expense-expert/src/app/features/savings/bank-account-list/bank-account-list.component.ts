import { Component, Input, Output, EventEmitter } from '@angular/core';
import { BankAccount } from '../../../core/models/saving.model';

@Component({
  selector: 'app-bank-account-list',
  standalone: true,
  template: `
    <div class="space-y-2">
      @for (account of accounts; track account.id) {
        <div class="flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded-lg border border-transparent dark:border-gray-700 px-4 py-3">
          <div>
            <p class="text-sm font-medium text-gray-900 dark:text-gray-100">{{ account.accountName }}</p>
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
  @Input() accounts: BankAccount[] = [];
  @Output() edit = new EventEmitter<BankAccount>();
  @Output() delete = new EventEmitter<BankAccount>();
}
