import { Component, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { SavingService } from '../../../core/services/saving.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-bank-account-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <div class="max-w-lg mx-auto">
      <h1 class="text-2xl font-bold text-gray-900 mb-6">
        {{ isEditMode() ? 'Edit Account' : 'Add Bank Account' }}
      </h1>

      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-5">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Account Name</label>
          <input
            formControlName="accountName"
            class="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
            placeholder="e.g., Savings Account"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
          <input
            formControlName="bankName"
            class="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
            placeholder="e.g., HDFC Bank"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Account Number (last 4 digits)</label>
          <input
            formControlName="accountNumber"
            maxlength="4"
            class="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
            placeholder="1234"
          />
        </div>

        <div class="flex gap-3 pt-2">
          <button
            type="submit"
            [disabled]="form.invalid || isSaving()"
            class="flex-1 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-primary-700 disabled:opacity-50 transition-colors"
          >
            {{ isEditMode() ? 'Update' : 'Add Account' }}
          </button>
          <button
            type="button"
            (click)="router.navigate(['/savings'])"
            class="rounded-lg px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  `,
})
export class BankAccountFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private savingService = inject(SavingService);
  private toastService = inject(ToastService);
  private route = inject(ActivatedRoute);
  router = inject(Router);

  isEditMode = signal(false);
  isSaving = signal(false);
  private accountId: string | null = null;

  form: FormGroup = this.fb.group({
    accountName: ['', Validators.required],
    bankName: ['', Validators.required],
    accountNumber: ['', Validators.required],
  });

  ngOnInit(): void {
    this.accountId = this.route.snapshot.paramMap.get('id');
    if (this.accountId) {
      this.isEditMode.set(true);
      // Load existing account data via query params or service
    }
  }

  async onSubmit(): Promise<void> {
    if (this.form.invalid) return;

    this.isSaving.set(true);
    try {
      if (this.isEditMode() && this.accountId) {
        await this.savingService.updateBankAccount(this.accountId, this.form.value);
        this.toastService.success('Account updated');
      } else {
        await this.savingService.addBankAccount(this.form.value);
        this.toastService.success('Account added');
      }
      this.router.navigate(['/savings']);
    } catch {
      this.toastService.error('Failed to save account');
    } finally {
      this.isSaving.set(false);
    }
  }
}
