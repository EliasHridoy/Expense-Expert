import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { SavingService } from '../../../core/services/saving.service';
import { ToastService } from '../../../core/services/toast.service';
import { BankAccount, DurationUnit } from '../../../core/models/saving.model';
import { CommonModule } from '@angular/common';

const DURATION_PRESETS: { label: string; value: number; unit: DurationUnit }[] = [
  { label: '1 Month', value: 1, unit: 'months' },
  { label: '3 Months', value: 3, unit: 'months' },
  { label: '6 Months', value: 6, unit: 'months' },
  { label: '1 Year', value: 1, unit: 'years' },
  { label: '2 Years', value: 2, unit: 'years' },
  { label: '3 Years', value: 3, unit: 'years' },
];

@Component({
  selector: 'app-saving-goal-form',
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
            {{ isEditMode() ? 'Edit Saving Goal' : 'New Saving Goal' }}
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

        <!-- STEP 1: Purpose & Target Amount -->
        @if (currentStep() === 1) {
          <div class="space-y-6">
            <div class="text-center mb-2">
              <h2 class="text-xl font-bold text-gray-900 dark:text-white">What are you saving for?</h2>
              <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Name your goal and set a target.</p>
            </div>

            <div class="space-y-5 bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700/50">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Purpose</label>
                <input
                  formControlName="purpose"
                  class="w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-gray-100 px-4 py-3 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition-all"
                  placeholder="e.g., Shopping, Travel, Device"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Target Amount</label>
                <div class="relative">
                  <span class="absolute left-4 top-1/2 -translate-y-1/2 text-xl text-gray-400">$</span>
                  <input
                    formControlName="targetAmount"
                    type="number"
                    min="1"
                    class="w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-gray-100 pl-10 pr-4 py-4 text-2xl font-bold text-center focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>
          </div>
        }

        <!-- STEP 2: Bank Account & Duration -->
        @if (currentStep() === 2) {
          <div class="space-y-6">
            <div class="text-center mb-2">
              <h2 class="text-xl font-bold text-gray-900 dark:text-white">How will you save?</h2>
              <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Link an account and set your timeline.</p>
            </div>

            <div class="space-y-5 bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700/50">
              <!-- Bank Account -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bank Account</label>
                <select
                  formControlName="bankAccountId"
                  class="w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-gray-100 px-4 py-3 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition-all"
                >
                  <option value="" disabled>Select account</option>
                  @for (account of bankAccounts(); track account.id) {
                    <option [value]="account.id">{{ account.accountName }} ({{ account.bankName }})</option>
                  }
                </select>
              </div>

              <!-- Start Month -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Month</label>
                <input
                  formControlName="startMonth"
                  type="month"
                  class="w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-gray-100 px-4 py-3 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition-all"
                />
              </div>

              <!-- Saving Duration -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Saving Duration</label>
                <div class="grid grid-cols-3 gap-2">
                  @for (preset of durationPresets; track preset.label) {
                    <button
                      type="button"
                      (click)="selectDuration(preset.value, preset.unit)"
                      [class]="isDurationSelected(preset.value, preset.unit)
                        ? 'rounded-xl px-3 py-2.5 text-xs font-semibold bg-primary-600 text-white border-2 border-primary-600 transition-all'
                        : 'rounded-xl px-3 py-2.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 border-2 border-transparent hover:border-primary-400 transition-all'"
                    >
                      {{ preset.label }}
                    </button>
                  }
                </div>

                <!-- Custom Duration -->
                <div class="mt-3 flex gap-2 items-center">
                  <input
                    type="number"
                    min="1"
                    [value]="customDurationValue()"
                    (input)="onCustomDurationChange($event)"
                    class="w-24 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-gray-100 px-3 py-2.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition-all"
                    placeholder="Custom"
                  />
                  <select
                    [value]="customDurationUnit()"
                    (change)="onCustomUnitChange($event)"
                    class="flex-1 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-gray-100 px-3 py-2.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition-all"
                  >
                    <option value="months">Months</option>
                    <option value="years">Years</option>
                  </select>
                </div>
              </div>

              <!-- Computed End Month -->
              @if (form.get('startMonth')?.value && form.get('durationValue')?.value) {
                <div class="rounded-2xl bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-700 px-4 py-3">
                  <p class="text-sm text-primary-700 dark:text-primary-300">
                    <span class="font-medium">Saving period:</span>
                    {{ formatMonth(form.get('startMonth')?.value) }}
                    →
                    {{ computedEndMonthLabel() }}
                  </p>
                </div>
              }
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
                {{ isSaving() ? 'Saving...' : (isEditMode() ? 'Update Goal' : 'Create Goal') }}
              </button>
            }
          </div>
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

  currentStep = signal(1);
  totalSteps = 2;
  steps = [1, 2];

  private goalId: string | null = null;

  durationPresets = DURATION_PRESETS;

  customDurationValue = signal<number>(6);
  customDurationUnit = signal<DurationUnit>('months');

  form: FormGroup = this.fb.group({
    purpose: ['', Validators.required],
    targetAmount: [null, [Validators.required, Validators.min(1)]],
    bankAccountId: ['', Validators.required],
    startMonth: [this.getCurrentMonth(), Validators.required],
    durationValue: [6, [Validators.required, Validators.min(1)]],
    durationUnit: ['months', Validators.required],
  });

  computedEndMonthLabel = computed(() => {
    const start = this.form.get('startMonth')?.value as string;
    const val = this.form.get('durationValue')?.value as number;
    const unit = this.form.get('durationUnit')?.value as DurationUnit;
    if (!start || !val || !unit) return '';
    const endMonth = this.savingService.computeEndMonth(start, val, unit);
    return this.formatMonth(endMonth);
  });

  ngOnInit(): void {
    this.savingService.getBankAccounts().subscribe((accounts) => this.bankAccounts.set(accounts));

    this.goalId = this.route.snapshot.paramMap.get('id');
    if (this.goalId) {
      this.isEditMode.set(true);
    }
  }

  canProceed(): boolean {
    const step = this.currentStep();
    if (step === 1) {
      return (this.form.get('purpose')?.valid || false) &&
             this.form.get('targetAmount')?.value > 0;
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

  selectDuration(value: number, unit: DurationUnit): void {
    this.form.patchValue({ durationValue: value, durationUnit: unit });
    this.customDurationValue.set(value);
    this.customDurationUnit.set(unit);
  }

  isDurationSelected(value: number, unit: DurationUnit): boolean {
    return (
      this.form.get('durationValue')?.value === value &&
      this.form.get('durationUnit')?.value === unit
    );
  }

  onCustomDurationChange(event: Event): void {
    const val = Number((event.target as HTMLInputElement).value);
    if (val >= 1) {
      this.customDurationValue.set(val);
      this.form.patchValue({ durationValue: val });
    }
  }

  onCustomUnitChange(event: Event): void {
    const unit = (event.target as HTMLSelectElement).value as DurationUnit;
    this.customDurationUnit.set(unit);
    this.form.patchValue({ durationUnit: unit });
  }

  formatMonth(monthStr: string): string {
    if (!monthStr) return '';
    const [year, month] = monthStr.split('-').map(Number);
    const date = new Date(year, month - 1, 1);
    return date.toLocaleString('default', { month: 'long', year: 'numeric' });
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
    return now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
  }
}
