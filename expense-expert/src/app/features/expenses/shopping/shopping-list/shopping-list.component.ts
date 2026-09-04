import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ShoppingListService } from '../../../../core/services/shopping-list.service';
import { ShoppingList, ShoppingListStatus } from '../../../../core/models/shopping-list.model';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { CategoryBadgeComponent } from '../../../../shared/components/category-badge/category-badge.component';
import { AmountDisplayComponent } from '../../../../shared/components/amount-display/amount-display.component';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { RelativeDatePipe } from '../../../../shared/pipes/relative-date.pipe';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-shopping-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    PageHeaderComponent,
    CategoryBadgeComponent,
    AmountDisplayComponent,
    ConfirmDialogComponent,
    LoadingSpinnerComponent,
    EmptyStateComponent,
    RelativeDatePipe,
  ],
  template: `
    <div class="space-y-6">
      <!-- Page Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <button
            type="button"
            (click)="router.navigate(['/expenses'])"
            class="p-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            title="Back to Expenses"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" />
            </svg>
          </button>
          <div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <span>🛒</span> Shopping & Grocery
            </h1>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Plan shopping lists ahead or quickly log store purchases.
            </p>
          </div>
        </div>

        <button
          (click)="router.navigate(['/expenses/shopping/new'])"
          class="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary-600 text-white font-medium text-sm shadow-sm hover:bg-primary-700 transition-all active:scale-[0.98]"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
          </svg>
          New Shopping List
        </button>
      </div>

      <!-- Filters & Tabs -->
      <div class="flex items-center justify-between gap-4 border-b border-gray-200 dark:border-gray-700 pb-2 overflow-x-auto">
        <div class="flex gap-2 shrink-0">
          <button
            type="button"
            (click)="activeTab.set('all')"
            [ngClass]="activeTab() === 'all' ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400' : 'text-gray-600 dark:text-gray-400'"
            class="px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 shrink-0"
          >
            All
            <span class="px-1.5 py-0.2 rounded-full text-[10px] bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
              {{ shoppingLists().length }}
            </span>
          </button>

          <button
            type="button"
            (click)="activeTab.set('planned')"
            [ngClass]="activeTab() === 'planned' ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 'text-gray-600 dark:text-gray-400'"
            class="px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 shrink-0"
          >
            Planned
            <span class="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300">
              {{ plannedCount() }}
            </span>
          </button>

          <button
            type="button"
            (click)="activeTab.set('completed')"
            [ngClass]="activeTab() === 'completed' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'text-gray-600 dark:text-gray-400'"
            class="px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 shrink-0"
          >
            Completed <span class="hidden sm:inline">&amp; In Expenses</span>
            <span class="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300">
              {{ completedCount() }}
            </span>
          </button>
        </div>
      </div>

      <!-- Lists Content -->
      @if (isLoading()) {
        <app-loading-spinner size="lg" [fullPage]="true" />
      } @else if (filteredLists().length === 0) {
        <app-empty-state
          [message]="emptyStateMessage()"
          actionLabel="+ Create Shopping List"
          (actionClick)="router.navigate(['/expenses/shopping/new'])"
        />
      } @else {
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          @for (list of filteredLists(); track list.id) {
            <div
              (click)="router.navigate(['/expenses/shopping', list.id])"
              class="group bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700/80 p-5 cursor-pointer hover:shadow-md hover:border-primary-300 dark:hover:border-primary-600/50 transition-all flex flex-col justify-between"
            >
              <div>
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-2">
                  <h3 class="text-base font-bold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors line-clamp-1">
                    {{ list.name }}
                  </h3>

                  @if (list.status === ShoppingListStatus.Completed) {
                    <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                      </svg>
                      Added to Expense
                    </span>
                  } @else {
                    <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60 shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd" />
                      </svg>
                      Planned
                    </span>
                  }
                </div>

                <div class="flex items-center gap-2 mb-3">
                  <app-category-badge [category]="list.category" [subcategory]="list.subcategory" />
                  <span class="text-xs text-gray-400 dark:text-gray-500">•</span>
                  <span class="text-xs text-gray-500 dark:text-gray-400">{{ list.date | relativeDate }}</span>
                </div>

                <!-- Preview of Items -->
                <div class="bg-gray-50 dark:bg-gray-900/60 rounded-xl p-3 mb-4 border border-gray-100 dark:border-gray-800 text-xs text-gray-600 dark:text-gray-300">
                  <div class="flex justify-between items-center mb-1.5 font-medium text-gray-500 dark:text-gray-400">
                    <span>{{ list.items.length }} {{ list.items.length === 1 ? 'item' : 'items' }}</span>
                    @if (list.items.length > 0) {
                      <span>{{ getCheckedCount(list) }}/{{ list.items.length }} collected</span>
                    }
                  </div>
                  <div class="space-y-1">
                    @for (item of list.items.slice(0, 3); track item.id) {
                      <div class="flex items-center justify-between text-[11px]">
                        <span class="truncate flex items-center gap-1.5" [class.line-through]="item.checked" [class.text-gray-400]="item.checked">
                          <span class="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600"></span>
                          {{ item.name }} {{ item.quantity ? '(' + item.quantity + ')' : '' }}
                          @if (item.subcategory) {
                            <span class="text-[9px] px-1.5 py-0.2 rounded bg-gray-200/70 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-normal">{{ item.subcategory }}</span>
                          }
                        </span>
                        @if (item.price > 0) {
                          <span class="font-medium text-gray-700 dark:text-gray-300"><span>$</span>{{ item.price | number:'1.2-2' }}</span>
                        }
                      </div>
                    }
                    @if (list.items.length > 3) {
                      <p class="text-[10px] text-gray-400 italic pt-0.5">+ {{ list.items.length - 3 }} more...</p>
                    }
                  </div>
                </div>
              </div>

              <!-- Card Footer -->
              <div class="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700/60">
                <div>
                  <span class="text-[11px] uppercase tracking-wider text-gray-400 font-semibold block">Total</span>
                  <app-amount-display [amount]="list.totalAmount" type="expense" />
                </div>

                <div class="flex items-center gap-2" (click)="$event.stopPropagation()">
                  <button
                    type="button"
                    (click)="confirmDelete(list)"
                    class="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition-colors"
                    title="Delete List"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    (click)="router.navigate(['/expenses/shopping', list.id])"
                    class="px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-primary-50 dark:hover:bg-primary-900/30 text-gray-700 dark:text-gray-200 hover:text-primary-600 dark:hover:text-primary-400 text-xs font-semibold transition-colors"
                  >
                    {{ list.status === ShoppingListStatus.Completed ? 'View / Edit' : 'Open & Shop' }}
                  </button>
                </div>
              </div>
            </div>
          }
        </div>
      }

      <app-confirm-dialog
        [isOpen]="showDeleteConfirm()"
        title="Delete Shopping List"
        [message]="deleteMessage()"
        confirmLabel="Delete"
        (confirmed)="deleteList()"
        (cancelled)="showDeleteConfirm.set(false)"
      />
    </div>
  `,
})
export class ShoppingListComponent implements OnInit {
  private shoppingListService = inject(ShoppingListService);
  private toastService = inject(ToastService);
  router = inject(Router);

  ShoppingListStatus = ShoppingListStatus;
  shoppingLists = signal<ShoppingList[]>([]);
  isLoading = signal(true);
  activeTab = signal<'all' | 'planned' | 'completed'>('all');

  showDeleteConfirm = signal(false);
  listToDelete = signal<ShoppingList | null>(null);

  plannedCount = computed(() =>
    this.shoppingLists().filter((l) => l.status === ShoppingListStatus.Planned).length
  );

  completedCount = computed(() =>
    this.shoppingLists().filter((l) => l.status === ShoppingListStatus.Completed).length
  );

  filteredLists = computed(() => {
    const tab = this.activeTab();
    if (tab === 'planned') {
      return this.shoppingLists().filter((l) => l.status === ShoppingListStatus.Planned);
    }
    if (tab === 'completed') {
      return this.shoppingLists().filter((l) => l.status === ShoppingListStatus.Completed);
    }
    return this.shoppingLists();
  });

  emptyStateMessage = computed(() => {
    const tab = this.activeTab();
    if (tab === 'planned') return 'No planned shopping lists. Create one before going to the store!';
    if (tab === 'completed') return 'No completed shopping expenses recorded yet.';
    return 'No shopping lists found. Start by creating a plan or logging in-store purchases!';
  });

  deleteMessage = computed(() => {
    const list = this.listToDelete();
    if (list?.expenseId) {
      return `Are you sure you want to delete "${list.name}"? This shopping list is linked to an expense, so the corresponding expense in your expense list will also be deleted.`;
    }
    return `Are you sure you want to delete "${list?.name}"? This cannot be undone.`;
  });

  ngOnInit(): void {
    this.loadLists();
  }

  loadLists(): void {
    this.isLoading.set(true);
    this.shoppingListService.getShoppingLists().subscribe({
      next: (lists) => {
        this.shoppingLists.set(lists);
        this.isLoading.set(false);
      },
      error: () => {
        this.toastService.error('Failed to load shopping lists');
        this.isLoading.set(false);
      },
    });
  }

  getCheckedCount(list: ShoppingList): number {
    return list.items.filter((item) => item.checked).length;
  }

  confirmDelete(list: ShoppingList): void {
    this.listToDelete.set(list);
    this.showDeleteConfirm.set(true);
  }

  async deleteList(): Promise<void> {
    const list = this.listToDelete();
    if (!list) return;

    try {
      await this.shoppingListService.deleteShoppingList(list.id, list.expenseId);
      this.toastService.success('Shopping list deleted');
      this.showDeleteConfirm.set(false);
      this.listToDelete.set(null);
    } catch {
      this.toastService.error('Failed to delete shopping list');
    }
  }
}
