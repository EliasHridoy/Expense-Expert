import { Component, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ExpenseService } from '../../../core/services/expense.service';
import { PersonService } from '../../../core/services/person.service';
import { ToastService } from '../../../core/services/toast.service';
import { EXPENSE_CATEGORIES, ExpenseCategory, Expense } from '../../../core/models/expense.model';
import { Person } from '../../../core/models/person.model';
import { PersonSelectComponent } from '../../../shared/components/person-select/person-select.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-expense-form',
  standalone: true,
  imports: [ReactiveFormsModule, PersonSelectComponent, LoadingSpinnerComponent],
  template: `
    <div class="max-w-lg mx-auto">
      <h1 class="text-2xl font-bold text-gray-900 mb-6">
        {{ isEditMode() ? 'Edit Expense' : 'Add Expense' }}
      </h1>

      @if (formLoading()) {
        <app-loading-spinner size="lg" [fullPage]="true" />
      } @else {
        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-5">
          <!-- Title -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              formControlName="title"
              class="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
              placeholder="e.g., Grocery shopping"
            />
          </div>

          <!-- Description -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              formControlName="description"
              rows="2"
              class="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none resize-none"
              placeholder="Optional description"
            ></textarea>
          </div>

          <!-- Amount -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Amount</label>
            <input
              formControlName="amount"
              type="number"
              min="0"
              class="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
              placeholder="0"
            />
          </div>

          <!-- Category -->
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

          <!-- Date -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              formControlName="date"
              type="date"
              class="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
            />
          </div>

          <!-- Is Loan -->
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

          <!-- Person select (shown when isLoan) -->
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

          <!-- Actions -->
          <div class="flex gap-3 pt-2">
            <button
              type="submit"
              [disabled]="form.invalid || isSaving()"
              class="flex-1 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-primary-700 disabled:opacity-50 transition-colors"
            >
              {{ isEditMode() ? 'Update' : 'Save' }}
            </button>
            <button
              type="button"
              (click)="router.navigate(['/expenses'])"
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
export class ExpenseFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private expenseService = inject(ExpenseService);
  private personService = inject(PersonService);
  private toastService = inject(ToastService);
  private route = inject(ActivatedRoute);
  router = inject(Router);

  categories = EXPENSE_CATEGORIES;
  persons = signal<Person[]>([]);
  isEditMode = signal(false);
  formLoading = signal(false);
  isSaving = signal(false);
  private expenseId: string | null = null;

  form: FormGroup = this.fb.group({
    title: ['', Validators.required],
    description: [''],
    amount: [null, [Validators.required, Validators.min(0.01)]],
    category: [ExpenseCategory.Other, Validators.required],
    date: [new Date().toISOString().split('T')[0], Validators.required],
    isLoan: [false],
    loanPersonId: [null],
  });

  ngOnInit(): void {
    this.personService.getPersons().subscribe((persons) => this.persons.set(persons));

    this.expenseId = this.route.snapshot.paramMap.get('id');
    if (this.expenseId) {
      this.isEditMode.set(true);
      this.formLoading.set(true);
      this.expenseService.getExpenseById(this.expenseId).subscribe((expense) => {
        if (expense) {
          this.form.patchValue({
            title: expense.title,
            description: expense.description,
            amount: expense.amount,
            category: expense.category,
            date: this.toDateString(expense.date),
            isLoan: expense.isLoan,
            loanPersonId: expense.loanPersonId,
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
        amount: Number(values.amount),
        category: values.category,
        date: new Date(values.date),
        isLoan: values.isLoan || false,
        loanPersonId: values.isLoan ? values.loanPersonId : null,
      };

      if (this.isEditMode() && this.expenseId) {
        await this.expenseService.updateExpense(this.expenseId, dto);
        this.toastService.success('Expense updated');
      } else {
        await this.expenseService.addExpense(dto);
        this.toastService.success('Expense added');
      }
      this.router.navigate(['/expenses']);
    } catch (error: any) {
      this.toastService.error(error.message || 'Failed to save expense');
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

  private toDateString(date: any): string {
    const d = date instanceof Date ? date : date?.toDate ? date.toDate() : new Date(date);
    return d.toISOString().split('T')[0];
  }
}
