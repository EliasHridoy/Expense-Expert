import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormArray, FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ShoppingListService } from '../../../../core/services/shopping-list.service';
import { ToastService } from '../../../../core/services/toast.service';
import { ExpenseCategory, EXPENSE_CATEGORIES } from '../../../../core/models/expense.model';
import { ShoppingList, ShoppingListStatus, ShoppingItem } from '../../../../core/models/shopping-list.model';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { CategoryCardPickerComponent } from '../../../../shared/components/category-card-picker/category-card-picker.component';
import { SubcategoryComboboxComponent } from '../../../../shared/components/subcategory-combobox/subcategory-combobox.component';
import { CategoryService } from '../../../../core/services/category.service';

@Component({
  selector: 'app-shopping-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    LoadingSpinnerComponent,
    ConfirmDialogComponent,
    CategoryCardPickerComponent,
    SubcategoryComboboxComponent,
  ],
  template: `
    <div class="max-w-2xl mx-auto pb-12">
      <!-- Top Navigation / Header -->
      <div class="flex items-center justify-between mb-6">
        <div class="flex items-center gap-3">
          <button
            type="button"
            (click)="goBack()"
            class="p-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" />
            </svg>
          </button>
          <div>
            <h1 class="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <span>🛒</span> {{ isEditMode() ? 'Edit Shopping List' : 'New Shopping List' }}
            </h1>
            <p class="text-xs text-gray-500 dark:text-gray-400">
              {{ isCompleted() ? 'Linked with Expenses' : 'Plan items or log store purchases' }}
            </p>
          </div>
        </div>

        @if (isEditMode()) {
          <button
            type="button"
            (click)="showDeleteConfirm.set(true)"
            class="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition-colors"
            title="Delete List"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
            </svg>
          </button>
        }
      </div>

      @if (isLoading()) {
        <app-loading-spinner size="lg" [fullPage]="true" />
      } @else {
        <form [formGroup]="form" class="space-y-6">
          <!-- Meta Details Card -->
          <div class="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-200 dark:border-gray-700 space-y-4">
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <!-- List Name -->
              <div class="sm:col-span-2">
                <label class="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
                  Shopping List Name *
                </label>
                <input
                  formControlName="name"
                  type="text"
                  placeholder="e.g., Weekly Groceries, Target run..."
                  class="w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-gray-100 px-3.5 py-2.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition-all"
                />
              </div>

              <!-- Date -->
              <div>
                <label class="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
                  Date *
                </label>
                <input
                  formControlName="date"
                  type="date"
                  class="w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-gray-100 px-3.5 py-2.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition-all"
                />
              </div>
            </div>

            <!-- Category Picker -->
            <div>
              <div class="flex items-center justify-between mb-2">
                <label class="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Expense Category
                </label>
                <span class="text-xs text-primary-600 dark:text-primary-400 font-medium">
                  Default: Food
                </span>
              </div>
              <app-category-card-picker
                [selectedValue]="form.get('category')?.value"
                (selected)="form.patchValue({ category: $event })"
              />

              <div class="mt-4">
                <app-subcategory-combobox
                  label="Default Subcategory (Optional)"
                  placeholder="e.g., Food, Groceries, Supplies..."
                  [value]="form.get('subcategory')?.value"
                  (valueChange)="form.patchValue({ subcategory: $event })"
                />
              </div>
            </div>
          </div>

          <!-- Items Table Card -->
          <div class="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-200 dark:border-gray-700 space-y-4">
            <!-- Datalist for fast subcategory auto-suggestions across items -->
            <datalist id="shopping-subcat-options">
              @for (subcat of availableSubcategories(); track subcat) {
                <option [value]="subcat"></option>
              }
            </datalist>

            <div class="flex items-center justify-between">
              <div>
                <h2 class="text-base font-bold text-gray-900 dark:text-white">Shopping Items</h2>
                <p class="text-xs text-gray-500 dark:text-gray-400">
                  Type price and press <kbd class="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-mono text-[10px]">Enter</kbd> to add the next item.
                </p>
              </div>

              <button
                type="button"
                (click)="addItem()"
                class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 font-medium text-xs hover:bg-primary-100 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
                </svg>
                Add Item
              </button>
            </div>

            <!-- Column Headers -->
            <div class="hidden sm:grid grid-cols-12 gap-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400 px-2">
              <div class="col-span-1 text-center">Done</div>
              <div class="col-span-3">Item Name *</div>
              <div class="col-span-3">Subcategory</div>
              <div class="col-span-2">Qty</div>
              <div class="col-span-2">Price ($)</div>
              <div class="col-span-1 text-center"></div>
            </div>

            <!-- Items List -->
            <div formArrayName="items" class="space-y-2.5">
              @for (itemCtrl of itemsArray.controls; track $index) {
                <div
                  [formGroupName]="$index"
                  class="flex flex-col sm:grid sm:grid-cols-12 gap-2 p-2.5 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 transition-all items-center"
                  [class.opacity-60]="itemCtrl.get('checked')?.value"
                >
                  <!-- Checkbox -->
                  <div class="w-full sm:w-auto sm:col-span-1 flex items-center justify-between sm:justify-center">
                    <label class="flex items-center gap-2 cursor-pointer sm:block">
                      <input
                        formControlName="checked"
                        type="checkbox"
                        class="w-5 h-5 rounded-lg text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600 dark:bg-gray-700 cursor-pointer"
                      />
                      <span class="sm:hidden text-xs text-gray-500">Mark as collected</span>
                    </label>

                    <!-- Mobile Delete Button -->
                    <button
                      type="button"
                      (click)="removeItem($index)"
                      class="sm:hidden p-1.5 text-gray-400 hover:text-red-500"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                      </svg>
                    </button>
                  </div>

                  <!-- Name -->
                  <div class="w-full sm:col-span-3">
                    <input
                      formControlName="name"
                      type="text"
                      [id]="'item-name-' + $index"
                      placeholder="e.g. Milk, Soap"
                      class="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-1.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
                      [class.line-through]="itemCtrl.get('checked')?.value"
                    />
                  </div>

                  <!-- Subcategory -->
                  <div class="w-full sm:col-span-3">
                    <input
                      formControlName="subcategory"
                      list="shopping-subcat-options"
                      type="text"
                      placeholder="Subcat (e.g. Food, Cleaning)"
                      class="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-2.5 py-1.5 text-xs focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
                    />
                  </div>

                  <!-- Quantity & Price Side-by-Side on Mobile -->
                  <div class="grid grid-cols-2 gap-2 w-full sm:contents">
                    <!-- Quantity -->
                    <div class="w-full sm:col-span-2">
                      <input
                        formControlName="quantity"
                        type="text"
                        placeholder="Qty (e.g. 2 kg)"
                        class="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-2.5 py-1.5 text-xs focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
                      />
                    </div>

                    <!-- Price -->
                    <div class="w-full sm:col-span-2 relative">
                      <span class="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">$</span>
                      <input
                        formControlName="price"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        (keydown.enter)="onPriceEnter($event, $index)"
                        class="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 pl-6 pr-2.5 py-1.5 text-sm font-semibold focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
                      />
                    </div>
                  </div>

                  <!-- Desktop Delete Button -->
                  <div class="hidden sm:flex sm:col-span-1 justify-center">
                    <button
                      type="button"
                      (click)="removeItem($index)"
                      [disabled]="itemsArray.length === 1"
                      class="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors disabled:opacity-30 disabled:hover:text-gray-400"
                      title="Remove item"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>
              }
            </div>

            <!-- Bottom Add Item Row -->
            <button
              type="button"
              (click)="addItem()"
              class="w-full py-2.5 border-2 border-dashed border-gray-200 dark:border-gray-700 hover:border-primary-400 dark:hover:border-primary-500 rounded-xl text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors flex items-center justify-center gap-1.5"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
              </svg>
              Add Another Item
            </button>
          </div>

          <!-- Total Calculation Banner -->
          <div class="bg-gradient-to-r from-primary-500/10 to-emerald-500/10 dark:from-primary-950/40 dark:to-emerald-950/40 border border-primary-200/60 dark:border-primary-800/40 rounded-2xl p-5 flex items-center justify-between">
            <div>
              <span class="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300 block">
                Calculated Total
              </span>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {{ validItemsCount() }} item(s) with prices
              </p>
            </div>
            <div class="text-right">
              <span class="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">
                <span>$</span>{{ computedTotal() | number:'1.2-2' }}
              </span>
            </div>
          </div>

          <!-- Bottom Actions Bar -->
          <div class="sticky bottom-16 sm:static p-3 sm:p-0 bg-white/95 dark:bg-gray-900/95 sm:bg-transparent backdrop-blur-md sm:backdrop-blur-none border-t sm:border-t-0 border-gray-200 dark:border-gray-800 z-20 mt-6 rounded-2xl shadow-lg sm:shadow-none">
            <div class="max-w-2xl mx-auto flex flex-col sm:flex-row gap-2.5 sm:gap-3">
              <!-- Save as Plan (always available unless already completed) -->
              @if (!isCompleted()) {
                <button
                  type="button"
                  (click)="saveAsPlan()"
                  [disabled]="isSaving() || form.invalid"
                  class="flex-1 rounded-xl bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 px-4 py-3 text-sm font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all disabled:opacity-50"
                >
                  {{ isSaving() ? 'Saving...' : 'Save as Plan' }}
                </button>
              }

              <!-- Save as Expense / Complete (Main Action) -->
              <button
                type="button"
                (click)="saveAsExpense()"
                [disabled]="isSaving() || form.invalid || computedTotal() <= 0"
                class="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-600/30 hover:shadow-emerald-600/40 transition-all active:scale-[0.98] disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                </svg>
                <span>
                  {{ isSaving() ? 'Saving...' : (isCompleted() ? 'Update Expense' : 'Save as Expense') }}
                </span>
              </button>
            </div>
          </div>
        </form>
      }

      <app-confirm-dialog
        [isOpen]="showDeleteConfirm()"
        title="Delete Shopping List"
        [message]="deleteDialogMessage()"
        confirmLabel="Delete"
        (confirmed)="deleteList()"
        (cancelled)="showDeleteConfirm.set(false)"
      />
    </div>
  `,
})
export class ShoppingFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private shoppingListService = inject(ShoppingListService);
  private categoryService = inject(CategoryService);
  private toastService = inject(ToastService);
  private route = inject(ActivatedRoute);
  router = inject(Router);

  isEditMode = signal(false);
  isCompleted = signal(false);
  isLoading = signal(false);
  isSaving = signal(false);
  showDeleteConfirm = signal(false);

  availableSubcategories = computed(() => this.categoryService.allSubcategories());

  private existingList: ShoppingList | null = null;
  private listId: string | null = null;

  form: FormGroup = this.fb.group({
    name: ['Grocery Shopping', Validators.required],
    date: [new Date().toISOString().split('T')[0], Validators.required],
    category: [ExpenseCategory.Food, Validators.required],
    subcategory: [''],
    items: this.fb.array([]),
  });

  get itemsArray(): FormArray {
    return this.form.get('items') as FormArray;
  }

  itemsSignal = signal<ShoppingItem[]>([]);

  computedTotal = computed(() => {
    const items = this.itemsSignal();
    if (!items || !items.length) return 0;
    const sum = items.reduce((acc, item) => acc + (Number(item.price) || 0), 0);
    return Math.round(sum * 100) / 100;
  });

  validItemsCount = computed(() => {
    const items = this.itemsSignal();
    if (!items || !items.length) return 0;
    return items.filter((item) => Number(item.price) > 0).length;
  });

  deleteDialogMessage = computed(() => {
    if (this.existingList?.expenseId) {
      return `Are you sure you want to delete "${this.existingList.name}"? This shopping list is linked to an expense, so the corresponding expense will also be removed.`;
    }
    return `Are you sure you want to delete this shopping list? This cannot be undone.`;
  });

  ngOnInit(): void {
    this.form.valueChanges.subscribe(() => {
      this.itemsSignal.set(this.itemsArray.value || []);
    });

    this.listId = this.route.snapshot.paramMap.get('id');
    if (this.listId && this.listId !== 'new') {
      this.isEditMode.set(true);
      this.isLoading.set(true);
      this.shoppingListService.getShoppingListById(this.listId).subscribe({
        next: (list) => {
          if (list) {
            this.existingList = list;
            this.isCompleted.set(list.status === ShoppingListStatus.Completed);
            this.populateForm(list);
          } else {
            this.toastService.error('Shopping list not found');
            this.router.navigate(['/expenses/shopping']);
          }
          this.isLoading.set(false);
        },
        error: () => {
          this.toastService.error('Failed to load shopping list');
          this.isLoading.set(false);
          this.router.navigate(['/expenses/shopping']);
        },
      });
    } else {
      // Initialize with 3 empty item rows for rapid entry
      this.addItem();
      this.addItem();
      this.addItem();
    }
  }

  private toDateString(date: any): string {
    if (!date) return new Date().toISOString().split('T')[0];
    const d = date instanceof Date ? date : date?.toDate ? date.toDate() : new Date(date);
    return isNaN(d.getTime()) ? new Date().toISOString().split('T')[0] : d.toISOString().split('T')[0];
  }

  private populateForm(list: ShoppingList): void {
    const dateStr = this.toDateString(list.date);
    this.form.patchValue({
      name: list.name,
      date: dateStr,
      category: list.category || ExpenseCategory.Food,
      subcategory: list.subcategory || '',
    });

    this.itemsArray.clear();
    if (list.items && list.items.length > 0) {
      for (const item of list.items) {
        this.itemsArray.push(this.createItemGroup(item));
      }
    } else {
      this.addItem();
    }
    this.itemsSignal.set(this.itemsArray.value || []);
  }

  private createItemGroup(item?: Partial<ShoppingItem>): FormGroup {
    return this.fb.group({
      id: [item?.id || crypto.randomUUID()],
      name: [item?.name || ''],
      subcategory: [item?.subcategory || ''],
      quantity: [item?.quantity || ''],
      price: [item?.price ?? null],
      checked: [item?.checked ?? false],
    });
  }

  addItem(): void {
    this.itemsArray.push(this.createItemGroup());
    this.itemsSignal.set(this.itemsArray.value || []);
  }

  removeItem(index: number): void {
    if (this.itemsArray.length > 1) {
      this.itemsArray.removeAt(index);
      this.itemsSignal.set(this.itemsArray.value || []);
    }
  }

  onPriceEnter(event: Event, index: number): void {
    event.preventDefault();
    this.addItem();
    // Focus the name input of the newly added row
    setTimeout(() => {
      const nextInput = document.getElementById('item-name-' + (index + 1));
      nextInput?.focus();
    }, 50);
  }

  /**
   * Save as Plan (Status: Planned)
   */
  async saveAsPlan(): Promise<void> {
    if (this.form.invalid) {
      this.toastService.error('Please fill in required fields');
      return;
    }

    this.isSaving.set(true);
    const formVal = this.form.value;
    const items: ShoppingItem[] = formVal.items
      .filter((i: any) => i.name && i.name.trim() !== '')
      .map((i: any) => {
        const subcat = i.subcategory?.trim() || null;
        if (subcat) {
          this.categoryService.registerSubcategory(subcat);
        }
        return {
          id: i.id || crypto.randomUUID(),
          name: i.name.trim(),
          subcategory: subcat,
          quantity: i.quantity?.trim() || '',
          price: Number(i.price) || 0,
          checked: Boolean(i.checked),
        };
      });

    if (items.length === 0) {
      this.toastService.error('Please add at least one item');
      this.isSaving.set(false);
      return;
    }

    const listSubcat = formVal.subcategory?.trim() || null;
    if (listSubcat) {
      this.categoryService.registerSubcategory(listSubcat);
    }

    try {
      const date = new Date(formVal.date);
      if (this.isEditMode() && this.existingList) {
        await this.shoppingListService.updateShoppingList(this.existingList.id, {
          name: formVal.name,
          date,
          category: formVal.category,
          subcategory: listSubcat,
          status: ShoppingListStatus.Planned,
          items,
          expenseId: this.existingList.expenseId,
        });
        this.toastService.success('Shopping plan updated');
      } else {
        await this.shoppingListService.createShoppingList({
          name: formVal.name,
          date,
          category: formVal.category,
          subcategory: listSubcat,
          status: ShoppingListStatus.Planned,
          items,
        });
        this.toastService.success('Shopping plan saved');
      }
      this.router.navigate(['/expenses/shopping']);
    } catch {
      this.toastService.error('Failed to save shopping plan');
    } finally {
      this.isSaving.set(false);
    }
  }

  /**
   * Save as Expense (One-click complete flow)
   */
  async saveAsExpense(): Promise<void> {
    if (this.form.invalid) {
      this.toastService.error('Please fill in required fields');
      return;
    }

    const formVal = this.form.value;
    const items: ShoppingItem[] = formVal.items
      .filter((i: any) => i.name && i.name.trim() !== '')
      .map((i: any) => {
        const subcat = i.subcategory?.trim() || null;
        if (subcat) {
          this.categoryService.registerSubcategory(subcat);
        }
        return {
          id: i.id || crypto.randomUUID(),
          name: i.name.trim(),
          subcategory: subcat,
          quantity: i.quantity?.trim() || '',
          price: Number(i.price) || 0,
          checked: true,
        };
      });

    if (items.length === 0) {
      this.toastService.error('Please add at least one item');
      return;
    }

    const total = Math.round(items.reduce((sum, item) => sum + item.price, 0) * 100) / 100;
    if (total <= 0) {
      this.toastService.error('Please enter prices for items before saving as an expense');
      return;
    }

    this.isSaving.set(true);
    const date = new Date(formVal.date);
    const listSubcat = formVal.subcategory?.trim() || null;
    if (listSubcat) {
      this.categoryService.registerSubcategory(listSubcat);
    }

    try {
      if (this.isEditMode() && this.existingList) {
        // If already completed and has expenseId, update both
        if (this.existingList.expenseId) {
          await this.shoppingListService.updateShoppingList(this.existingList.id, {
            name: formVal.name,
            date,
            category: formVal.category,
            subcategory: listSubcat,
            status: ShoppingListStatus.Completed,
            items,
            totalAmount: total,
            expenseId: this.existingList.expenseId,
          });
          this.toastService.success('Expense and shopping list updated');
        } else {
          // Previously planned, now converting to completed
          await this.shoppingListService.updateShoppingList(this.existingList.id, {
            name: formVal.name,
            date,
            category: formVal.category,
            subcategory: listSubcat,
            items,
            totalAmount: total,
          });
          const updatedList = { ...this.existingList, name: formVal.name, date, category: formVal.category, subcategory: listSubcat, items };
          await this.shoppingListService.completeShoppingList(updatedList);
          this.toastService.success('Shopping list converted and added to expenses!');
        }
      } else {
        // Direct in-store flow: create list and expense simultaneously
        await this.shoppingListService.saveDirectShoppingExpense({
          name: formVal.name,
          date,
          category: formVal.category,
          subcategory: listSubcat,
          items,
          totalAmount: total,
        });
        this.toastService.success('Expense added successfully from shopping list!');
      }

      this.router.navigate(['/expenses']);
    } catch {
      this.toastService.error('Failed to record shopping expense');
    } finally {
      this.isSaving.set(false);
    }
  }

  async deleteList(): Promise<void> {
    if (!this.existingList) return;
    try {
      await this.shoppingListService.deleteShoppingList(this.existingList.id, this.existingList.expenseId);
      this.toastService.success('Shopping list deleted');
      this.router.navigate(['/expenses/shopping']);
    } catch {
      this.toastService.error('Failed to delete shopping list');
    }
  }

  goBack(): void {
    if (this.isEditMode()) {
      this.router.navigate(['/expenses/shopping']);
    } else {
      this.router.navigate(['/expenses']);
    }
  }
}
