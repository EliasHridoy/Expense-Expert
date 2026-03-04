import { Component, inject, Input, Output, EventEmitter, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CategoryService, CategoryItem } from '../../../core/services/category.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-category-select',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="flex items-center gap-2">
      <select
        [ngModel]="selectedValue"
        (ngModelChange)="selected.emit($event)"
        class="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
      >
        @for (cat of categoryService.allCategories(); track cat.value) {
          <option [value]="cat.value">{{ cat.label }}</option>
        }
      </select>

      @if (!showAddForm()) {
        <button
          type="button"
          (click)="showAddForm.set(true)"
          class="rounded-lg bg-gray-100 dark:bg-gray-700 px-3 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors whitespace-nowrap"
        >
          + Add
        </button>
      } @else {
        <div class="flex items-center gap-1">
          <input
            [(ngModel)]="newCategoryName"
            placeholder="Category"
            class="w-28 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-2.5 text-sm text-gray-900 dark:text-gray-100 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
            (keyup.enter)="addCategory()"
          />
          <button
            type="button"
            (click)="addCategory()"
            class="rounded-lg bg-primary-600 px-2 py-2.5 text-sm text-white hover:bg-primary-700 transition-colors"
          >
            Save
          </button>
          <button
            type="button"
            (click)="showAddForm.set(false); newCategoryName = ''"
            class="rounded-lg bg-gray-100 dark:bg-gray-700 px-2 py-2.5 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            X
          </button>
        </div>
      }
    </div>
  `,
})
export class CategorySelectComponent implements OnInit {
  categoryService = inject(CategoryService);
  private toastService = inject(ToastService);

  @Input() selectedValue: string = '';
  @Output() selected = new EventEmitter<string>();

  showAddForm = signal(false);
  newCategoryName = '';

  ngOnInit(): void {
    this.categoryService.loadCategories();
  }

  async addCategory(): Promise<void> {
    const name = this.newCategoryName.trim();
    if (!name) return;

    // Check for duplicates
    const exists = this.categoryService.allCategories().some(
      (c) => c.label.toLowerCase() === name.toLowerCase()
    );
    if (exists) {
      this.toastService.error('Category already exists');
      return;
    }

    try {
      await this.categoryService.addCategory(name);
      const value = name.toLowerCase().replace(/\s+/g, '-');
      this.selected.emit(value);
      this.toastService.success(`Category "${name}" added`);
      this.newCategoryName = '';
      this.showAddForm.set(false);
    } catch {
      this.toastService.error('Failed to add category');
    }
  }
}
