import { Component, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CategoryBreakdown, SubcategoryBreakdown } from '../../../core/models/dashboard.model';
import { CategoryBadgeComponent } from '../../../shared/components/category-badge/category-badge.component';
import { AmountDisplayComponent } from '../../../shared/components/amount-display/amount-display.component';

@Component({
  selector: 'app-category-breakdown',
  standalone: true,
  imports: [CommonModule, CategoryBadgeComponent, AmountDisplayComponent],
  template: `
    <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 transition-colors">
      <div class="flex items-center justify-between mb-4">
        <div>
          <h3 class="text-sm font-semibold text-gray-800 dark:text-gray-200">Category Breakdown</h3>
          <p class="text-xs text-gray-400 dark:text-gray-500">Tap a category to inspect subcategories</p>
        </div>
        <span class="text-xs font-medium px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
          {{ data.length }} Categories
        </span>
      </div>

      @if (data.length === 0) {
        <div class="py-8 text-center text-xs text-gray-400 dark:text-gray-500">
          No expenses recorded for this month.
        </div>
      } @else {
        <div class="space-y-3">
          @for (item of data; track item.category) {
            <div class="rounded-xl border border-gray-100 dark:border-gray-750 bg-gray-50/50 dark:bg-gray-900/30 overflow-hidden transition-all">
              <!-- Main Category Row (Click to toggle drill-down) -->
              <button
                type="button"
                (click)="toggleExpand(item.category)"
                class="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-100/60 dark:hover:bg-gray-800/60 transition-colors text-left"
              >
                <div class="flex items-center gap-2.5 min-w-0">
                  <app-category-badge [category]="item.category" />
                  <span class="text-xs text-gray-400 dark:text-gray-500 font-medium">
                    {{ item.count }} {{ item.count === 1 ? 'txn' : 'txns' }}
                  </span>
                </div>

                <div class="flex items-center gap-3 shrink-0">
                  <div class="text-right">
                    <span class="text-sm font-bold text-gray-900 dark:text-gray-100">
                      {{ item.total | currency }}
                    </span>
                    <span class="block text-[11px] font-medium text-gray-400">
                      {{ item.percentage | number:'1.1-1' }}%
                    </span>
                  </div>

                  <!-- Expand Arrow -->
                  <div
                    class="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-transform duration-200"
                    [class.rotate-90]="expandedCategories().has(item.category)"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
                    </svg>
                  </div>
                </div>
              </button>

              <!-- Parent Category Progress Bar -->
              <div class="w-full bg-gray-200 dark:bg-gray-700 h-1">
                <div
                  class="bg-primary-500 h-1 transition-all duration-500 rounded-r-full"
                  [style.width.%]="item.percentage"
                ></div>
              </div>

              <!-- Subcategories Drill-Down Accordion -->
              @if (expandedCategories().has(item.category)) {
                <div class="px-4 py-3 bg-white dark:bg-gray-800/80 border-t border-gray-100 dark:border-gray-700 space-y-2.5 animate-fadeIn">
                  <div class="flex items-center justify-between text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                    <span>Subcategory Breakdown</span>
                    <span>% of {{ item.category }}</span>
                  </div>

                  @if (!item.subcategories || item.subcategories.length === 0) {
                    <p class="text-xs text-gray-400 py-1 italic">No subcategory details available.</p>
                  } @else {
                    @for (sub of item.subcategories; track sub.subcategory) {
                      <div class="space-y-1">
                        <div class="flex items-center justify-between text-xs">
                          <div class="flex items-center gap-1.5">
                            <span class="w-1.5 h-1.5 rounded-full bg-primary-400 dark:bg-primary-500"></span>
                            <span class="font-medium text-gray-800 dark:text-gray-200 capitalize">{{ sub.subcategory }}</span>
                            <span class="text-[11px] text-gray-400">({{ sub.count }})</span>
                          </div>
                          <div class="flex items-center gap-2">
                            <span class="font-semibold text-gray-900 dark:text-gray-100">{{ sub.total | currency }}</span>
                            <span class="text-[11px] font-medium text-gray-400 w-11 text-right">{{ sub.percentage | number:'1.0-1' }}%</span>
                          </div>
                        </div>

                        <!-- Subcategory bar -->
                        <div class="w-full bg-gray-100 dark:bg-gray-700 h-1 rounded-full overflow-hidden">
                          <div
                            class="bg-primary-400 dark:bg-primary-400 h-1 rounded-full transition-all duration-300"
                            [style.width.%]="sub.percentage"
                          ></div>
                        </div>
                      </div>
                    }
                  }
                </div>
              }
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class CategoryBreakdownComponent {
  @Input({ required: true }) data: CategoryBreakdown[] = [];

  expandedCategories = signal<Set<string>>(new Set());

  toggleExpand(category: string): void {
    const current = new Set(this.expandedCategories());
    if (current.has(category)) {
      current.delete(category);
    } else {
      current.add(category);
    }
    this.expandedCategories.set(current);
  }
}
