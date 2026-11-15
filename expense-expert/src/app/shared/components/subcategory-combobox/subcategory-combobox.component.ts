import {
  Component,
  Input,
  Output,
  EventEmitter,
  inject,
  signal,
  computed,
  ElementRef,
  HostListener,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CategoryService } from '../../../core/services/category.service';

@Component({
  selector: 'app-subcategory-combobox',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="relative w-full" #containerRef>
      @if (label) {
        <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
          {{ label }}
        </label>
      }

      <div class="relative">
        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" />
          </svg>
        </div>

        <input
          type="text"
          [placeholder]="placeholder"
          [value]="searchTerm()"
          (input)="onInputChange($event)"
          (focus)="openDropdown()"
          (keydown.enter)="$event.preventDefault(); onEnterKey()"
          class="w-full pl-9 pr-8 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-all shadow-sm"
        />

        @if (searchTerm()) {
          <button
            type="button"
            (click)="clearValue($event)"
            class="absolute inset-y-0 right-0 pr-2.5 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
            </svg>
          </button>
        }
      </div>

      <!-- Quick Suggestion Chips (when input is empty or minimal) -->
      @if (showQuickChips && quickSuggestions().length > 0 && !isOpen()) {
        <div class="flex flex-wrap gap-1.5 mt-2">
          @for (chip of quickSuggestions(); track chip) {
            <button
              type="button"
              (click)="selectSubcategory(chip)"
              class="text-xs px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-primary-50 hover:text-primary-600 dark:hover:bg-primary-900/30 dark:hover:text-primary-400 transition-colors border border-transparent hover:border-primary-200 dark:hover:border-primary-800"
            >
              + {{ chip }}
            </button>
          }
        </div>
      }

      <!-- Dropdown menu -->
      @if (isOpen()) {
        <div
          class="absolute left-0 right-0 mt-1 max-h-56 overflow-y-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-50 py-1"
        >
          @for (item of filteredSubcategories(); track item) {
            <button
              type="button"
              (click)="selectSubcategory(item)"
              class="w-full text-left px-3.5 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-primary-50 dark:hover:bg-primary-900/30 flex items-center justify-between group transition-colors"
            >
              <span>{{ item }}</span>
              @if (isExactMatch(item)) {
                <span class="text-xs text-primary-600 dark:text-primary-400 font-medium">Selected</span>
              }
            </button>
          }

          <!-- New custom subcategory item -->
          @if (canCreateCustom()) {
            <button
              type="button"
              (click)="createAndSelectCustom()"
              class="w-full text-left px-3.5 py-2 text-sm text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 flex items-center gap-2 font-medium border-t border-gray-100 dark:border-gray-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
              <span>Use "<strong>{{ searchTerm().trim() }}</strong>"</span>
            </button>
          }

          @if (filteredSubcategories().length === 0 && !canCreateCustom()) {
            <div class="px-3.5 py-2 text-xs text-gray-400 dark:text-gray-500">
              No suggestions found. Type to create one.
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class SubcategoryComboboxComponent implements OnInit {
  private categoryService = inject(CategoryService);
  private elementRef = inject(ElementRef);

  @Input() set value(val: string | null | undefined) {
    this.searchTerm.set(val || '');
  }
  @Input() label: string = 'Subcategory (Optional)';
  @Input() placeholder: string = 'e.g., Food, Groceries, Maintenance...';
  @Input() showQuickChips: boolean = true;
  @Output() valueChange = new EventEmitter<string | null>();

  searchTerm = signal<string>('');
  isOpen = signal<boolean>(false);

  ngOnInit(): void {
    this.categoryService.loadSubcategories();
  }

  allSuggestions = computed(() => this.categoryService.allSubcategories());

  quickSuggestions = computed(() => {
    const list = this.allSuggestions();
    const current = this.searchTerm().trim().toLowerCase();
    return list.filter((s) => s.toLowerCase() !== current).slice(0, 5);
  });

  filteredSubcategories = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const list = this.allSuggestions();
    if (!term) return list.slice(0, 8);
    return list.filter((s) => s.toLowerCase().includes(term)).slice(0, 8);
  });

  canCreateCustom = computed(() => {
    const term = this.searchTerm().trim();
    if (!term) return false;
    const list = this.allSuggestions();
    return !list.some((s) => s.toLowerCase() === term.toLowerCase());
  });

  isExactMatch(item: string): boolean {
    return item.toLowerCase() === this.searchTerm().trim().toLowerCase();
  }

  openDropdown(): void {
    this.isOpen.set(true);
  }

  onInputChange(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.searchTerm.set(val);
    this.isOpen.set(true);
    this.valueChange.emit(val.trim() || null);
  }

  onEnterKey(): void {
    const term = this.searchTerm().trim();
    if (term) {
      this.selectSubcategory(term);
    }
  }

  selectSubcategory(item: string): void {
    this.searchTerm.set(item);
    this.categoryService.registerSubcategory(item);
    this.valueChange.emit(item);
    this.isOpen.set(false);
  }

  createAndSelectCustom(): void {
    const term = this.searchTerm().trim();
    if (term) {
      this.selectSubcategory(term);
    }
  }

  clearValue(event: Event): void {
    event.stopPropagation();
    this.searchTerm.set('');
    this.valueChange.emit(null);
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isOpen.set(false);
    }
  }
}
