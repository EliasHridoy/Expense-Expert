import { Component, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SavingService } from '../../../core/services/saving.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-bank-account-form',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  template: `
    <div class="max-w-lg mx-auto pb-20">
      <div class="flex items-center justify-between mb-6">
        <div class="flex items-center gap-3">
          @if (currentStep() > 1) {
            <button
              type="button"
              (click)="previousStep()"
              class="p-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" />
              </svg>
            </button>
          }
          <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {{ isEditMode() ? 'Edit Account' : 'Add Bank Account' }}
          </h1>
        </div>
        <button
          type="button"
          (click)="router.navigate(['/savings'])"
          class="p-2 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Step Indicator -->
      <div class="flex gap-2 mb-8 px-2">
        @for (step of steps; track step) {
          <div
            class="h-1.5 flex-1 rounded-full transition-all duration-300"
            [class.bg-primary-500]="currentStep() >= step"
            [class.bg-gray-200]="currentStep() < step"
            [class.dark:bg-gray-700]="currentStep() < step"
          ></div>
        }
      </div>

      <form [formGroup]="form" (ngSubmit)="onSubmit()">

        <!-- STEP 1: Account Name & Bank Name -->
        @if (currentStep() === 1) {
          <div class="space-y-6">
            <div class="text-center mb-2">
              <h2 class="text-xl font-bold text-gray-900 dark:text-white">What account is this?</h2>
              <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Give your account a name and tell us which bank.</p>
            </div>

            <div class="space-y-5 bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700/50">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Account Name</label>
                <input
                  formControlName="accountName"
                  class="w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-gray-100 px-4 py-3 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition-all"
                  placeholder="e.g., Savings Account"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bank Name</label>
                <input
                  formControlName="bankName"
                  class="w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-gray-100 px-4 py-3 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition-all"
                  placeholder="e.g., HDFC Bank"
                />
              </div>
            </div>
          </div>
        }

        <!-- STEP 2: Account Number & Confirm -->
        @if (currentStep() === 2) {
          <div class="space-y-6">
            <div class="text-center mb-2">
              <h2 class="text-xl font-bold text-gray-900 dark:text-white">Account Details</h2>
              <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Enter the last 4 digits of your account number.</p>
            </div>

            <div class="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700/50">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Account Number (last 4 digits)</label>
                <input
                  formControlName="accountNumber"
                  maxlength="4"
                  class="w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-gray-100 px-4 py-4 text-2xl font-bold text-center tracking-[0.5em] focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
                  placeholder="••••"
                />
              </div>
            </div>

            <!-- Summary Card -->
            <div class="bg-gray-50 dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800">
              <h3 class="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">Summary</h3>
              <div class="flex justify-between mb-2">
                <span class="text-sm text-gray-600 dark:text-gray-300">{{ form.get('accountName')?.value || 'Untitled' }}</span>
                <span class="text-sm font-bold text-gray-900 dark:text-white">{{ form.get('bankName')?.value }}</span>
              </div>
              <div class="text-xs text-gray-500">
                •••• {{ form.get('accountNumber')?.value || '----' }}
              </div>
            </div>
          </div>
        }

        <!-- Fixed Bottom Action Bar -->
        <div class="fixed bottom-0 left-0 right-0 p-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-t border-gray-200 dark:border-gray-800 z-10 md:static md:bg-transparent md:p-0 md:border-t-0 md:backdrop-blur-none md:mt-8 md:pt-4">
          <div class="max-w-lg mx-auto flex gap-3">
            @if (currentStep() < totalSteps) {
              <button
                type="button"
                (click)="nextStep()"
                [disabled]="!canProceed()"
                class="w-full rounded-2xl bg-primary-600 px-4 py-4 text-base font-bold text-white shadow-lg shadow-primary-500/30 hover:bg-primary-700 hover:shadow-primary-500/40 disabled:opacity-50 disabled:shadow-none transition-all active:scale-[0.98]"
              >
                Continue
              </button>
            } @else {
              <button
                type="submit"
                [disabled]="form.invalid || isSaving()"
                class="w-full rounded-2xl bg-green-600 px-4 py-4 text-base font-bold text-white shadow-lg shadow-green-500/30 hover:bg-green-700 hover:shadow-green-500/40 disabled:opacity-50 disabled:shadow-none transition-all active:scale-[0.98]"
              >
                {{ isSaving() ? 'Saving...' : (isEditMode() ? 'Update Account' : 'Add Account') }}
              </button>
            }
          </div>
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

  currentStep = signal(1);
  totalSteps = 2;
  steps = [1, 2];

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
    }
  }

  canProceed(): boolean {
    const step = this.currentStep();
    if (step === 1) {
      return (this.form.get('accountName')?.valid || false) && (this.form.get('bankName')?.valid || false);
    }
    return true;
  }

  nextStep() {
    if (this.canProceed() && this.currentStep() < this.totalSteps) {
      this.currentStep.update(v => v + 1);
    }
  }

  previousStep() {
    if (this.currentStep() > 1) {
      this.currentStep.update(v => v - 1);
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
