import { Component, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { SavingService } from '../../../core/services/saving.service';
import { ToastService } from '../../../core/services/toast.service';
import { BankAccount } from '../../../core/models/saving.model';

@Component({
  selector: 'app-saving-goal-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <div class="max-w-lg mx-auto">
      <h1 class="text-2xl font-bold text-gray-900 mb-6">
        {{ isEditMode() ? 'Edit Saving Goal' : 'New Saving Goal' }}
      </h1>

      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-5">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Purpose</label>
          <input
            formControlName="purpose"
            class="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
            placeholder="e.g., Shopping, Travel, Donation"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Target Amount</label>
          <input
            formControlName="targetAmount"
            type="number"
            min="1"
            class="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
            placeholder="0"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Bank Account</label>
          <select
            formControlName="bankAccountId"
            class="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
          >
            <option value="" disabled>Select account</option>
            @for (account of bankAccounts(); track account.id) {
              <option [value]="account.id">{{ account.accountName }} ({{ account.bankName }})</option>
            }
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Month</label>
          <input
            formControlName="month"
            type="month"
            class="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
          />
        </div>

        <div class="flex gap-3 pt-2">
          <button
            type="submit"
            [disabled]="form.invalid || isSaving()"
            class="flex-1 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-primary-700 disabled:opacity-50 transition-colors"
          >
            {{ isEditMode() ? 'Update' : 'Create Goal' }}
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
export class SavingGoalFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private savingService = inject(SavingService);
  private toastService = inject(ToastService);
  private route = inject(ActivatedRoute);
  router = inject(Router);

  bankAccounts = signal<BankAccount[]>([]);
  isEditMode = signal(false);
  isSaving = signal(false);
  private goalId: string | null = null;

  form: FormGroup = this.fb.group({
    purpose: ['', Validators.required],
    targetAmount: [null, [Validators.required, Validators.min(1)]],
    bankAccountId: ['', Validators.required],
    month: [this.getCurrentMonth(), Validators.required],
  });

  ngOnInit(): void {
    this.savingService.getBankAccounts().subscribe((accounts) => this.bankAccounts.set(accounts));

    this.goalId = this.route.snapshot.paramMap.get('id');
    if (this.goalId) {
      this.isEditMode.set(true);
    }
  }

  async onSubmit(): Promise<void> {
    if (this.form.invalid) return;

    this.isSaving.set(true);
    try {
      if (this.isEditMode() && this.goalId) {
        await this.savingService.updateGoal(this.goalId, this.form.value);
        this.toastService.success('Goal updated');
      } else {
        await this.savingService.addGoal(this.form.value);
        this.toastService.success('Goal created');
      }
      this.router.navigate(['/savings']);
    } catch {
      this.toastService.error('Failed to save goal');
    } finally {
      this.isSaving.set(false);
    }
  }

  private getCurrentMonth(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }
}
