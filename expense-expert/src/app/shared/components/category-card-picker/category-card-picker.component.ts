import { Component, inject, Input, Output, EventEmitter, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CategoryService, CategoryItem } from '../../../core/services/category.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-category-card-picker',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="w-full">
      <div class="grid grid-cols-3 sm:grid-cols-4 gap-3">
        @for (cat of displayedCategories(); track cat.value) {
          <button
            type="button"
            (click)="selectCategory(cat.value)"
            class="relative flex flex-col items-center justify-center gap-2 p-3 rounded-2xl border-2 transition-all active:scale-95"
            [ngClass]="{
              'border-primary-500 bg-primary-50 dark:bg-primary-900/20': selectedValue === cat.value,
              'border-transparent bg-gray-100 dark:bg-gray-800': selectedValue !== cat.value
            }"
          >
            @if (selectedValue === cat.value && cat.isCustom && cat.id) {
              <div 
                class="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow hover:bg-red-600 transition-colors z-10"
                (click)="deleteCategory($event, cat.id, cat.value)"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                </svg>
              </div>
            }

            <span class="text-2xl">{{ cat.icon }}</span>
            <span class="text-xs font-medium text-gray-700 dark:text-gray-300 truncate w-full text-center">
              {{ cat.label }}
            </span>
          </button>
        }

        <!-- See More / Less Card -->
        @if (hasMoreCategories()) {
          <button
            type="button"
            (click)="showAllCategories.set(!showAllCategories())"
            class="flex flex-col items-center justify-center gap-2 p-3 rounded-2xl border-2 border-transparent bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all active:scale-95"
          >
            <span class="text-xl text-gray-500">
              @if (showAllCategories()) {
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" /></svg>
              } @else {
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>
              }
            </span>
            <span class="text-xs font-medium text-gray-500 dark:text-gray-400">
              {{ showAllCategories() ? 'See Less' : 'See More' }}
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
              [(ngModel)]="customIcon"
              placeholder="😀"
              maxlength="5"
              class="w-12 text-center rounded-lg border-0 bg-white dark:bg-gray-900 px-2 py-2 text-xl text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 outline-none"
            />
            <input
              [(ngModel)]="newCategoryName"
              placeholder="New Category Name"
              class="flex-1 rounded-lg border-0 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 outline-none"
              (keyup.enter)="addCategory()"
            />
            <button
              type="button"
              (click)="addCategory()"
              [disabled]="!newCategoryName.trim() || !customIcon.trim()"
              class="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save
            </button>
            <button
              type="button"
              (click)="showAddForm.set(false); newCategoryName = ''; customIcon = ''"
              class="rounded-lg p-2 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
              </svg>
            </button>
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
  customIcon = '';
  newCategoryName = '';

  showAllCategories = signal(false);

  displayedCategories = computed(() => {
    const categories = this.categoryService.allCategories();
    return this.showAllCategories() ? categories : categories.slice(0, 9);
  });

  hasMoreCategories = computed(() => this.categoryService.allCategories().length > 9);

  ngOnInit(): void {
    this.categoryService.loadCategories();
  }

  selectCategory(value: string) {
    this.selectedValue = value;
    this.selected.emit(value);
  }

  async addCategory(): Promise<void> {
    const name = this.newCategoryName.trim();
    const icon = this.customIcon.trim();
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
      this.customIcon = '';
      this.showAddForm.set(false);
    } catch {
      this.toastService.error('Failed to add category');
    }
  }

  async deleteCategory(event: Event, id: string, value: string): Promise<void> {
    event.stopPropagation();
    if (!confirm('Are you sure you want to delete this category?')) return;

    try {
      await this.categoryService.deleteCategory(id);
      this.toastService.success('Category deleted');
      if (this.selectedValue === value) {
        this.selectCategory('');
      }
    } catch {
      this.toastService.error('Failed to delete category');
    }
  }
}
