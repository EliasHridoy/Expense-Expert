import { Component, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ExpenseDraftService } from '../../../core/services/expense-draft.service';
import { PersonService } from '../../../core/services/person.service';
import { ToastService } from '../../../core/services/toast.service';
import { EXPENSE_CATEGORIES, ExpenseCategory } from '../../../core/models/expense.model';
import { Person } from '../../../core/models/person.model';
import { PersonSelectComponent } from '../../../shared/components/person-select/person-select.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-draft-form',
  standalone: true,
  imports: [ReactiveFormsModule, PersonSelectComponent, LoadingSpinnerComponent],
  template: `
    <div class="max-w-lg mx-auto">
      <h1 class="text-2xl font-bold text-gray-900 mb-6">
        {{ isEditMode() ? 'Edit Draft' : 'New Expense Draft' }}
      </h1>

      @if (formLoading()) {
        <app-loading-spinner size="lg" [fullPage]="true" />
      } @else {
        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-5">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              formControlName="title"
              class="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
              placeholder="e.g., Electricity Bill"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              formControlName="description"
              rows="2"
              class="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none resize-none"
              placeholder="Optional"
            ></textarea>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              formControlName="category"
              class="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
            >
              @for (cat of categories; track cat.value) {
                <option [value]="cat.value">{{ cat.label }}</option>
              }
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Target Amount</label>
            <input
              formControlName="targetAmount"
              type="number"
              min="0"
              class="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
              placeholder="0"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Number of Installments</label>
            <input
              formControlName="installmentCount"
              type="number"
              min="1"
              class="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
              placeholder="1"
            />
            <p class="text-xs text-gray-400 mt-1">Use 1 for a single payment</p>
          </div>

          <div class="flex items-center gap-3">
            <input
              formControlName="isLoan"
              type="checkbox"
              id="isLoan"
              class="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <label for="isLoan" class="text-sm font-medium text-gray-700">
              This is a loan to someone
            </label>
          </div>

          @if (form.get('isLoan')?.value) {
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Person</label>
              <app-person-select
                [persons]="persons()"
                [selectedId]="form.get('loanPersonId')?.value"
                (selected)="form.patchValue({ loanPersonId: $event })"
                (personAdded)="onAddPerson($event)"
              />
            </div>
          }

          <div class="flex gap-3 pt-2">
            <button
              type="submit"
              [disabled]="form.invalid || isSaving()"
              class="flex-1 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-primary-700 disabled:opacity-50 transition-colors"
            >
              {{ isEditMode() ? 'Update' : 'Create Draft' }}
            </button>
            <button
              type="button"
              (click)="router.navigate(['/drafts'])"
              class="rounded-lg px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
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

  categories = EXPENSE_CATEGORIES;
  persons = signal<Person[]>([]);
  isEditMode = signal(false);
  formLoading = signal(false);
  isSaving = signal(false);
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

  async onSubmit(): Promise<void> {
    if (this.form.invalid) return;

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
      this.toastService.success(`Added "${name}"`);
    } catch {
      this.toastService.error('Failed to add person');
    }
  }
}
