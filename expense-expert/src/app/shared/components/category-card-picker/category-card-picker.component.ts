import { Component, inject, Input, Output, EventEmitter, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CategoryService, CategoryItem, CATEGORY_ICONS } from '../../../core/services/category.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-category-card-picker',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="w-full">
      <div class="grid grid-cols-3 sm:grid-cols-4 gap-3">
        @for (cat of categoryService.allCategories(); track cat.value) {
          <button
            type="button"
            (click)="selectCategory(cat.value)"
            class="flex flex-col items-center justify-center gap-2 p-3 rounded-2xl border-2 transition-all active:scale-95"
            [ngClass]="{
              'border-primary-500 bg-primary-50 dark:bg-primary-900/20': selectedValue === cat.value,
              'border-transparent bg-gray-100 dark:bg-gray-800': selectedValue !== cat.value
            }"
          >
            <span class="text-2xl">{{ cat.icon }}</span>
            <span class="text-xs font-medium text-gray-700 dark:text-gray-300 truncate w-full text-center">
              {{ cat.label }}
            </span>
          </button>
        }

        <!-- Add New Category Card -->
        @if (!showAddForm()) {
          <button
            type="button"
            (click)="showAddForm.set(true)"
            class="flex flex-col items-center justify-center gap-2 p-3 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all active:scale-95"
          >
            <span class="text-2xl text-gray-400 dark:text-gray-500">+</span>
            <span class="text-xs font-medium text-gray-500 dark:text-gray-400">Add New</span>
          </button>
        }
      </div>

      <!-- Add Form with Icon Picker -->
      @if (showAddForm()) {
        <div class="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl space-y-3">
          <div class="flex items-center gap-2">
            <input
              [(ngModel)]="newCategoryName"
              placeholder="New Category Name"
              class="flex-1 rounded-lg border-0 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 outline-none"
              (keyup.enter)="addCategory()"
            />
            <button
              type="button"
              (click)="addCategory()"
              [disabled]="!newCategoryName.trim() || !selectedIcon()"
              class="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save
            </button>
            <button
              type="button"
              (click)="showAddForm.set(false); newCategoryName = ''; selectedIcon.set('')"
              class="rounded-lg p-2 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
              </svg>
            </button>
          </div>

          <!-- Icon Picker Grid -->
          <div>
            <p class="text-xs text-gray-500 dark:text-gray-400 mb-2">Choose an icon:</p>
            <div class="grid grid-cols-6 sm:grid-cols-10 gap-2">
              @for (icon of icons; track icon) {
                <button
                  type="button"
                  (click)="selectedIcon.set(icon)"
                  class="flex items-center justify-center w-10 h-10 rounded-lg text-xl transition-all"
                  [ngClass]="{
                    'bg-primary-100 dark:bg-primary-900/30 ring-2 ring-primary-500': selectedIcon() === icon,
                    'bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600': selectedIcon() !== icon
                  }"
                >
                  {{ icon }}
                </button>
              }
            </div>
          </div>
        </div>
      }
    </div>
  `,
})
export class CategoryCardPickerComponent implements OnInit {
  categoryService = inject(CategoryService);
  private toastService = inject(ToastService);

  @Input() selectedValue: string = '';
  @Output() selected = new EventEmitter<string>();

  showAddForm = signal(false);
  selectedIcon = signal('');
  newCategoryName = '';
  icons = CATEGORY_ICONS;

  ngOnInit(): void {
    this.categoryService.loadCategories();
  }

  selectCategory(value: string) {
    this.selectedValue = value;
    this.selected.emit(value);
  }

  async addCategory(): Promise<void> {
    const name = this.newCategoryName.trim();
    const icon = this.selectedIcon();
    if (!name || !icon) return;

    const exists = this.categoryService.allCategories().some(
      (c) => c.label.toLowerCase() === name.toLowerCase()
    );
    if (exists) {
      this.toastService.error('Category already exists');
      return;
    }

    try {
      await this.categoryService.addCategory(name, icon);
      const value = name.toLowerCase().replace(/\s+/g, '-');
      this.selectCategory(value);
      this.toastService.success(`Category "${name}" added`);
      this.newCategoryName = '';
      this.selectedIcon.set('');
      this.showAddForm.set(false);
    } catch {
      this.toastService.error('Failed to add category');
    }
  }
}
