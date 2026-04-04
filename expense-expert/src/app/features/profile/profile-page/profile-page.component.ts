import { Component, inject, signal, effect, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DecimalPipe, DatePipe } from '@angular/common';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { MonthPickerComponent } from '../../../shared/components/month-picker/month-picker.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { AmountDisplayComponent } from '../../../shared/components/amount-display/amount-display.component';
import { ProfileService } from '../../../core/services/profile.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { TourService } from '../../../core/services/tour.service';
import { IncomeEntry } from '../../../core/models/income.model';

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [
    FormsModule,
    DecimalPipe,
    DatePipe,
    PageHeaderComponent,
    MonthPickerComponent,
    EmptyStateComponent,
    ConfirmDialogComponent,
    AmountDisplayComponent,
  ],
  template: `
    <app-page-header title="Profile" />

    <!-- User Info & Salary -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <!-- User Info Card -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-colors">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Account Info</h2>
        <div class="space-y-3">
          <div>
            <label class="text-xs text-gray-500 dark:text-gray-400">Email</label>
            <p class="text-sm text-gray-900 dark:text-gray-100">{{ userEmail() }}</p>
          </div>
          <div>
            <label class="text-xs text-gray-500 dark:text-gray-400">Display Name</label>
            <p class="text-sm text-gray-900 dark:text-gray-100">{{ userName() }}</p>
          </div>
        </div>
      </div>

      <!-- Monthly Salary Card -->
      <div id="salary-card" class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-colors">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Monthly Salary</h2>
        @if (editingSalary()) {
          <div class="flex flex-col sm:flex-row sm:items-end gap-3">
            <div class="flex-1 w-full relative">
              <label class="block text-xs text-gray-500 dark:text-gray-400 mb-1">Amount</label>
              <input
                type="number"
                [(ngModel)]="salaryInput"
                min="0"
                class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Enter monthly salary"
              />
            </div>
            <div class="flex gap-2 w-full sm:w-auto">
              <button
                (click)="saveSalary()"
                class="flex-1 sm:flex-none rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 transition-colors"
              >
                Save
              </button>
              <button
                (click)="editingSalary.set(false)"
                class="flex-1 sm:flex-none rounded-lg px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        } @else {
          <div class="flex items-center justify-between">
            <div>
              <p class="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {{ monthlySalary() | number: '1.0-0' }}
              </p>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">per month</p>
            </div>
            <button
              (click)="startEditSalary()"
              class="rounded-lg px-3 py-1.5 text-sm font-medium text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 transition-colors"
            >
              Edit
            </button>
          </div>
        }
      </div>
    </div>

    <!-- Additional Earnings Section -->
    <div id="earnings-section" class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6 transition-colors">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Additional Earnings</h2>
        <div class="flex flex-wrap items-center gap-2 sm:gap-3">
          <app-month-picker
            [currentMonth]="currentMonth()"
            (monthChanged)="currentMonth.set($event)"
          />
          <button
            (click)="showAddForm.set(!showAddForm())"
            class="whitespace-nowrap rounded-lg bg-primary-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-700 transition-colors"
          >
            {{ showAddForm() ? 'Cancel' : '+ Add' }}
          </button>
        </div>
      </div>

      <!-- Add Income Form -->
      @if (showAddForm()) {
        <div class="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mb-4">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <div>
              <label class="block text-xs text-gray-500 dark:text-gray-400 mb-1">Source</label>
              <input
                type="text"
                [(ngModel)]="newEntry.source"
                class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="e.g. Freelance, Bonus"
              />
            </div>
            <div>
              <label class="block text-xs text-gray-500 dark:text-gray-400 mb-1">Amount</label>
              <input
                type="number"
                [(ngModel)]="newEntry.amount"
                min="0"
                class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="0"
              />
            </div>
            <div>
              <label class="block text-xs text-gray-500 dark:text-gray-400 mb-1">Date</label>
              <input
                type="date"
                [(ngModel)]="newEntry.date"
                class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div>
              <label class="block text-xs text-gray-500 dark:text-gray-400 mb-1">Note</label>
              <input
                type="text"
                [(ngModel)]="newEntry.note"
                class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Optional note"
              />
            </div>
          </div>
          <button
            (click)="addEntry()"
            [disabled]="!newEntry.source || !newEntry.amount || !newEntry.date"
            class="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add Earning
          </button>
        </div>
      }

      <!-- Monthly Total -->
      @if (incomeEntries().length > 0) {
        <div class="flex items-center justify-between bg-gray-50 dark:bg-gray-700/50 rounded-lg px-4 py-3 mb-4">
          <span class="text-sm text-gray-600 dark:text-gray-400">
            Total this month (Salary + Earnings)
          </span>
          <span class="text-lg font-bold text-green-600 dark:text-green-400">
            {{ (monthlySalary() + monthlyAdditional()) | number: '1.0-0' }}
          </span>
        </div>
      }

      <!-- Entries List -->
      @if (incomeEntries().length === 0) {
        <app-empty-state
          icon="💰"
          message="No additional earnings for this month"
        />
      } @else {
        <div class="space-y-2">
          @for (entry of incomeEntries(); track entry.id) {
            <div class="flex items-center justify-between py-3 px-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
              <div class="flex-1">
                <p class="text-sm font-medium text-gray-900 dark:text-gray-100">{{ entry.source }}</p>
                @if (entry.note) {
                  <p class="text-xs text-gray-500 dark:text-gray-400">{{ entry.note }}</p>
                }
                <p class="text-xs text-gray-400 dark:text-gray-500">{{ entry.date | date: 'mediumDate' }}</p>
              </div>
              <div class="flex items-center gap-3">
                <app-amount-display [amount]="entry.amount" type="income" />
                <button
                  (click)="confirmDeleteEntry(entry)"
                  class="rounded p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          }
        </div>
      }
    </div>

    <app-confirm-dialog
      [isOpen]="deleteDialogOpen()"
      title="Delete Earning"
      message="Are you sure you want to delete this earning entry?"
      confirmLabel="Delete"
      (confirmed)="deleteEntry()"
      (cancelled)="deleteDialogOpen.set(false)"
    />
  `,
})
export class ProfilePageComponent implements OnInit {
  private profileService = inject(ProfileService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private tourService = inject(TourService);

  monthlySalary = signal(0);
  editingSalary = signal(false);
  salaryInput = 0;

  currentMonth = signal(this.getCurrentMonth());
  incomeEntries = signal<IncomeEntry[]>([]);
  monthlyAdditional = signal(0);
  showAddForm = signal(false);

  newEntry = { source: '', amount: 0, date: '', note: '' };

  deleteDialogOpen = signal(false);
  entryToDelete: IncomeEntry | null = null;

  userEmail = signal('');
  userName = signal('');

  constructor() {
    effect(() => {
      // React to month changes
      const month = this.currentMonth();
      this.loadEntries(month);
    });
  }

  ngOnInit(): void {
    const user = this.authService.currentUser();
    this.userEmail.set(user?.email || '');
    this.userName.set(user?.displayName || user?.email?.split('@')[0] || '');

    this.loadProfile();
  }

  private async loadProfile(): Promise<void> {
    const profile = await this.profileService.getProfile();
    if (profile) {
      this.monthlySalary.set(profile.monthlySalary);
    }

    this.tourService.loadTourState().then(() => {
      this.tourService.tryStartPageTour('profile');
    });
  }

  private loadEntries(month?: string): void {
    this.profileService.getIncomeEntries(month ?? this.currentMonth()).subscribe((entries) => {
      this.incomeEntries.set(entries);
      this.monthlyAdditional.set(entries.reduce((sum, e) => sum + e.amount, 0));
    });
  }

  startEditSalary(): void {
    this.salaryInput = this.monthlySalary();
    this.editingSalary.set(true);
  }

  async saveSalary(): Promise<void> {
    await this.profileService.updateSalary(this.salaryInput);
    this.monthlySalary.set(this.salaryInput);
    this.editingSalary.set(false);
    this.toastService.success('Salary updated');
  }

  async addEntry(): Promise<void> {
    if (!this.newEntry.source || !this.newEntry.amount || !this.newEntry.date) return;

    await this.profileService.addIncomeEntry({
      source: this.newEntry.source,
      amount: this.newEntry.amount,
      date: new Date(this.newEntry.date),
      note: this.newEntry.note,
    });

    this.newEntry = { source: '', amount: 0, date: '', note: '' };
    this.showAddForm.set(false);
    this.toastService.success('Earning added');
    this.loadEntries();
  }

  confirmDeleteEntry(entry: IncomeEntry): void {
    this.entryToDelete = entry;
    this.deleteDialogOpen.set(true);
  }

  async deleteEntry(): Promise<void> {
    if (!this.entryToDelete) return;
    await this.profileService.deleteIncomeEntry(this.entryToDelete.id);
    this.deleteDialogOpen.set(false);
    this.entryToDelete = null;
    this.toastService.success('Earning deleted');
    this.loadEntries();
  }

  private getCurrentMonth(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }
}
