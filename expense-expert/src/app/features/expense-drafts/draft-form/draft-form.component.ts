import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ExpenseDraftService } from '../../../core/services/expense-draft.service';
import { PersonService } from '../../../core/services/person.service';
import { ToastService } from '../../../core/services/toast.service';
import { ExpenseCategory } from '../../../core/models/expense.model';
import { Person } from '../../../core/models/person.model';
import { PersonSelectComponent } from '../../../shared/components/person-select/person-select.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { CategoryCardPickerComponent } from '../../../shared/components/category-card-picker/category-card-picker.component';

@Component({
  selector: 'app-draft-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    PersonSelectComponent,
    LoadingSpinnerComponent,
    CategoryCardPickerComponent
  ],
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
            {{ isEditMode() ? 'Edit Draft' : 'New Plan' }}
          </h1>
        </div>
        <button
          type="button"
          (click)="router.navigate(['/drafts'])"
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

      @if (formLoading()) {
        <app-loading-spinner size="lg" [fullPage]="true" />
      } @else {
        <form [formGroup]="form" (ngSubmit)="onSubmit()">

          <!-- STEP 1: Amount & Installments -->
          @if (currentStep() === 1) {
            <div class="space-y-6">
              <div class="text-center mb-2">
                <h2 class="text-xl font-bold text-gray-900 dark:text-white">What's your target amount?</h2>
                <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Set the total amount you need for this draft.</p>
              </div>

              <div class="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700/50">
                <label class="block text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 text-center">Target Amount</label>
                <div class="relative">
                  <span class="absolute left-4 top-1/2 -translate-y-1/2 text-xl text-gray-400">$</span>
                  <input
                    formControlName="targetAmount"
                    type="number"
                    min="1"
                    step="1"
                    class="w-full rounded-2xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-gray-100 pl-10 pr-4 py-4 text-3xl font-bold text-center focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
                    placeholder="0"
                  />
                </div>
              </div>

              <div class="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700/50">
                <label class="flex justify-between items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  <span>Number of Installments</span>
                  <span class="text-primary-600 font-bold bg-primary-50 dark:bg-primary-900/30 px-3 py-1 rounded-full">
                    {{ form.get('installmentCount')?.value }}x
                  </span>
                </label>
                <div class="flex items-center gap-4">
                  <input
                    type="range"
                    min="1"
                    max="24"
                    formControlName="installmentCount"
                    class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-primary-600"
                  />
                </div>
                <div class="mt-4 flex items-center gap-3">
                  <span class="text-xs text-gray-400 flex-1">Or enter manually:</span>
                  <input
                    formControlName="installmentCount"
                    type="number"
                    min="1"
                    class="w-20 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-center py-1.5 focus:ring-1 focus:ring-primary-500 outline-none"
                  />
                </div>
              </div>
            </div>
          }

          <!-- STEP 2: Category -->
          @if (currentStep() === 2) {
            <div class="space-y-6">
              <div class="text-center mb-2">
                <h2 class="text-xl font-bold text-gray-900 dark:text-white">What category does this fall under?</h2>
              </div>
              <app-category-card-picker
                [selectedValue]="form.get('category')?.value"
                (selected)="form.patchValue({ category: $event })"
              />
            </div>
          }

          <!-- STEP 3: Details -->
          @if (currentStep() === 3) {
            <div class="space-y-6">
              <div class="text-center mb-2">
                <h2 class="text-xl font-bold text-gray-900 dark:text-white">Give it a name</h2>
              </div>

              <div class="space-y-5 bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700/50">
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
                  <input
                    formControlName="title"
                    class="w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900/50 px-4 py-3 text-sm focus:border-primary-500 focus:ring-1 outline-none transition-all text-gray-900 dark:text-gray-100"
                    placeholder="e.g., iPhone 16 Pro"
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description (Optional)</label>
                  <textarea
                    formControlName="description"
                    rows="3"
                    class="w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900/50 px-4 py-3 text-sm focus:border-primary-500 focus:ring-1 outline-none resize-none transition-all text-gray-900 dark:text-gray-100"
                    placeholder="Any specific details you want to remember..."
                  ></textarea>
                </div>
              </div>
            </div>
          }

          <!-- STEP 4: Person/Loan & Confirm -->
          @if (currentStep() === 4) {
            <div class="space-y-6">
              <div class="text-center mb-2">
                <h2 class="text-xl font-bold text-gray-900 dark:text-white">Almost done!</h2>
                <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Is this draft for a loan?</p>
              </div>

              <div class="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700/50 space-y-6">

                <div class="flex items-center gap-3 bg-primary-50 dark:bg-primary-900/20 p-4 rounded-2xl">
                  <input
                    formControlName="isLoan"
                    type="checkbox"
                    id="isLoan"
                    class="h-5 w-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <label for="isLoan" class="text-base font-medium text-primary-900 dark:text-primary-100">
                    Yes, this is a loan to someone.
                  </label>
                </div>

                @if (form.get('isLoan')?.value) {
                  <div class="animate-in fade-in slide-in-from-top-2">
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Who is this for?</label>
                    <app-person-select
                      [persons]="persons()"
                      [selectedId]="form.get('loanPersonId')?.value"
                      (selected)="form.patchValue({ loanPersonId: $event })"
                      (personAdded)="onAddPerson($event)"
                    />
                  </div>
                }

                <!-- Summary Card -->
                <div class="bg-gray-50 dark:bg-gray-900 p-4 rounded-2xl mt-6 border border-gray-100 dark:border-gray-800">
                  <h3 class="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">Summary</h3>
                  <div class="flex justify-between mb-2">
                    <span class="text-sm text-gray-600 dark:text-gray-300">{{ form.get('title')?.value || 'Untitled' }}</span>
                    <span class="text-sm font-bold text-gray-900 dark:text-white">{{ form.get('targetAmount')?.value | currency }}</span>
                  </div>
                  <div class="flex justify-between text-xs text-gray-500">
                    <span>{{ form.get('category')?.value }}</span>
                    <span>{{ form.get('installmentCount')?.value }} installment(s)</span>
                  </div>
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
                  {{ isSaving() ? 'Saving...' : (isEditMode() ? 'Update Draft' : 'Save Draft') }}
                </button>
              }
            </div>
          </div>
        </form>
      }
    </div>
  `,
})
export class DraftFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private draftService = inject(ExpenseDraftService);
  private personService = inject(PersonService);
  private toastService = inject(ToastService);
  private route = inject(ActivatedRoute);
  router = inject(Router);

  persons = signal<Person[]>([]);
  isEditMode = signal(false);
  formLoading = signal(false);
  isSaving = signal(false);

  currentStep = signal(1);
  totalSteps = 4;
  steps = [1, 2, 3, 4];

  private draftId: string | null = null;

  form: FormGroup = this.fb.group({
    title: ['', Validators.required],
    description: [''],
    category: [ExpenseCategory.Other, Validators.required],
    targetAmount: [null, [Validators.required, Validators.min(1)]],
    installmentCount: [1, [Validators.required, Validators.min(1)]],
    isLoan: [false],
    loanPersonId: [null],
  });

  ngOnInit(): void {
    this.personService.getPersons().subscribe((persons) => this.persons.set(persons));

    this.draftId = this.route.snapshot.paramMap.get('id');
    if (this.draftId) {
      this.isEditMode.set(true);
      this.formLoading.set(true);
      this.draftService.getDraftById(this.draftId).subscribe((draft) => {
        if (draft) {
          this.form.patchValue({
            title: draft.title,
            description: draft.description,
            category: draft.category,
            targetAmount: draft.targetAmount,
            installmentCount: draft.installmentCount,
            isLoan: draft.isLoan,
            loanPersonId: draft.loanPersonId,
          });
        }
        this.formLoading.set(false);
      });
    }
  }

  canProceed(): boolean {
    const step = this.currentStep();
    if (step === 1) {
      const amt = this.form.get('targetAmount')?.value;
      return amt != null && amt > 0;
    }
    if (step === 2) {
      return !!this.form.get('category')?.value;
    }
    if (step === 3) {
      return this.form.get('title')?.valid || false;
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
    if (this.form.invalid || !this.canProceed()) return;

    this.isSaving.set(true);
    const values = this.form.value;

    try {
      const dto = {
        title: values.title,
        description: values.description || '',
        category: values.category,
        targetAmount: Number(values.targetAmount),
        installmentCount: Number(values.installmentCount),
        isLoan: values.isLoan || false,
        loanPersonId: values.isLoan ? values.loanPersonId : null,
      };

      if (this.isEditMode() && this.draftId) {
        await this.draftService.updateDraft(this.draftId, dto);
        this.toastService.success('Draft updated');
      } else {
        await this.draftService.createDraft(dto);
        this.toastService.success('Draft created');
      }
      this.router.navigate(['/drafts']);
    } catch (error: any) {
      this.toastService.error(error.message || 'Failed to save draft');
    } finally {
      this.isSaving.set(false);
    }
  }

  async onAddPerson(name: string): Promise<void> {
    try {
      const id = await this.personService.addPerson(name);
      this.form.patchValue({ loanPersonId: id });
      this.toastService.success('Added "' + name + '"');
    } catch {
      this.toastService.error('Failed to add person');
    }
  }
}
