import { Component, inject, signal, effect, computed, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
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
import { IncomeEntry, UserProfile, IncomeDraft } from '../../../core/models/income.model';

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

    <!-- User Info -->
    <div class="mb-8">
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
    </div>

    <!-- Legacy Salary Banner -->
    @if (monthlySalary() > 0) {
      <div class="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 class="text-sm font-medium text-amber-800 dark:text-amber-400">Legacy Fixed Salary Detected</h3>
          <p class="text-xs text-amber-700 dark:text-amber-500 mt-1">
            You are receiving a legacy rolling salary of <span class="font-bold">{{ monthlySalary() | number: '1.0-0' }}</span> per month. 
            We have switched to exact-date income tracking. Please disable this to prevent double-counting.
          </p>
        </div>
        <button
          (click)="disableLegacySalary()"
          class="whitespace-nowrap rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 transition-colors"
        >
          Disable Fixed Salary
        </button>
      </div>
    }

    <!-- Income Drafts Section -->
    <div id="income-drafts-section" class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6 mb-8 transition-colors">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div>
          <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Income Templates</h2>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Save fixed income sources to add them with one click.</p>
        </div>
        <button
          (click)="showAddDraftForm.set(!showAddDraftForm())"
          class="whitespace-nowrap rounded-lg bg-primary-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-700 transition-colors"
        >
          {{ showAddDraftForm() ? 'Cancel' : '+ New Template' }}
        </button>
      </div>

      <!-- Add Draft Form -->
      @if (showAddDraftForm()) {
        <div class="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mb-4">
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
            <div>
              <label class="block text-xs text-gray-500 dark:text-gray-400 mb-1">Source</label>
              <input
                type="text"
                [(ngModel)]="newDraft.source"
                class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="e.g. Monthly Salary"
              />
            </div>
            <div>
              <label class="block text-xs text-gray-500 dark:text-gray-400 mb-1">Amount</label>
              <input
                type="number"
                [(ngModel)]="newDraft.amount"
                min="0"
                class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="0"
              />
            </div>
            <div>
              <label class="block text-xs text-gray-500 dark:text-gray-400 mb-1">Note (Optional)</label>
              <input
                type="text"
                [(ngModel)]="newDraft.note"
                class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="e.g. Full-time"
              />
            </div>
          </div>
          <button
            (click)="addDraft()"
            [disabled]="!newDraft.source || !newDraft.amount"
            class="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save Template
          </button>
        </div>
      }

      <!-- Drafts List -->
      @if (incomeDrafts().length === 0) {
        <div class="text-center py-6 text-sm text-gray-500 dark:text-gray-400 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
          No templates found. Create one to add regular income easily.
        </div>
      } @else {
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          @for (draft of incomeDrafts(); track draft.id) {
            <div class="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary-500 dark:hover:border-primary-500 transition-colors bg-gray-50 dark:bg-gray-700/30 group">
              <div class="flex-1">
                <p class="text-sm font-medium text-gray-900 dark:text-gray-100">{{ draft.source }}</p>
                <div class="flex items-center gap-2 mt-1">
                  <app-amount-display [amount]="draft.amount" type="income" class="text-xs" />
                  @if (draft.note) {
                    <span class="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[100px] sm:max-w-[150px]">• {{ draft.note }}</span>
                  }
                </div>
              </div>
              <div class="flex items-center gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  (click)="confirmApplyDraft(draft)"
                  title="Apply template"
                  class="rounded-full p-2 text-primary-600 hover:bg-primary-50 dark:text-primary-400 dark:hover:bg-primary-900/30 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clip-rule="evenodd" />
                  </svg>
                </button>
                <button
                  (click)="confirmDeleteDraft(draft)"
                  title="Delete template"
                  class="rounded-full p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
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

    <!-- Income Section -->
    <div id="earnings-section" class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6 transition-colors">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Monthly Income</h2>
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
            Add Income
          </button>
        </div>
      }

      <!-- Monthly Total -->
      @if (incomeEntries().length > 0) {
        <div class="flex items-center justify-between bg-gray-50 dark:bg-gray-700/50 rounded-lg px-4 py-3 mb-4">
          <span class="text-sm text-gray-600 dark:text-gray-400">
            Total Income this month {{ monthlySalary() > 0 ? '(including legacy salary)' : '' }}
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
          message="No income recorded for this month"
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

    <!-- Sign Out (mobile only) -->
    <div class="lg:hidden mt-8 mb-4">
      <button
        (click)="logout()"
        class="flex items-center justify-center gap-2 w-full rounded-xl border border-red-200 dark:border-red-800/50 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
        Sign out
      </button>
    </div>

    <app-confirm-dialog
      [isOpen]="deleteDialogOpen()"
      title="Delete Income Entry"
      message="Are you sure you want to delete this income entry?"
      confirmLabel="Delete"
      (confirmed)="deleteEntry()"
      (cancelled)="deleteDialogOpen.set(false)"
    />
    <app-confirm-dialog
      [isOpen]="deleteDraftDialogOpen()"
      title="Delete Template"
      message="Are you sure you want to delete this income template?"
      confirmLabel="Delete"
      (confirmed)="deleteDraft()"
      (cancelled)="deleteDraftDialogOpen.set(false)"
    />
    <app-confirm-dialog
      [isOpen]="applyDraftDialogOpen()"
      title="Apply Template"
      message="Are you sure you want to log this template as an income entry for today?"
      confirmLabel="Apply"
      (confirmed)="executeApplyDraft()"
      (cancelled)="applyDraftDialogOpen.set(false)"
    />
  `,
})
export class ProfilePageComponent implements OnInit {
  private profileService = inject(ProfileService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private tourService = inject(TourService);
  private router = inject(Router);

  userProfile = signal<UserProfile | null>(null);
  monthlySalary = signal(0);

  currentMonth = signal(this.getCurrentMonth());
  selectedMonthLabel = computed(() => {
    const monthStr = this.currentMonth();
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  });
  incomeEntries = signal<IncomeEntry[]>([]);
  monthlyAdditional = signal(0);
  showAddForm = signal(false);

  newEntry = { source: '', amount: 0, date: '', note: '' };

  deleteDialogOpen = signal(false);
  entryToDelete: IncomeEntry | null = null;

  incomeDrafts = signal<IncomeDraft[]>([]);
  showAddDraftForm = signal(false);
  newDraft = { source: '', amount: 0, note: '' };
  
  deleteDraftDialogOpen = signal(false);
  draftToDelete: IncomeDraft | null = null;

  applyDraftDialogOpen = signal(false);
  draftToApply: IncomeDraft | null = null;

  userEmail = signal('');
  userName = signal('');

  constructor() {
    effect(() => {
      // React to month changes
      const month = this.currentMonth();
      this.loadEntries(month);

      const profile = this.userProfile();
      if (profile) {
        this.monthlySalary.set(this.profileService.getSalaryForMonth(profile, month));
      }
    }, { allowSignalWrites: true });
  }

  ngOnInit(): void {
    const user = this.authService.currentUser();
    this.userEmail.set(user?.email || '');
    this.userName.set(user?.displayName || user?.email?.split('@')[0] || '');

    this.loadProfile();
    this.loadDrafts();
  }

  private loadDrafts(): void {
    this.profileService.getIncomeDrafts().subscribe((drafts) => {
      this.incomeDrafts.set(drafts);
    });
  }

  private async loadProfile(): Promise<void> {
    const profile = await this.profileService.getProfile();
    if (profile) {
      this.userProfile.set(profile);
      this.monthlySalary.set(this.profileService.getSalaryForMonth(profile, this.currentMonth()));
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

  async disableLegacySalary(): Promise<void> {
    const month = this.currentMonth();
    await this.profileService.updateSalary(0, month);
    const profile = await this.profileService.getProfile();
    this.userProfile.set(profile);
    if (profile) {
      this.monthlySalary.set(this.profileService.getSalaryForMonth(profile, month));
    }
    this.toastService.success('Legacy fixed salary disabled');
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
    this.toastService.success('Income added');
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
    this.toastService.success('Income deleted');
    this.loadEntries();
  }

  async addDraft(): Promise<void> {
    if (!this.newDraft.source || !this.newDraft.amount) return;

    await this.profileService.addIncomeDraft({
      source: this.newDraft.source,
      amount: this.newDraft.amount,
      note: this.newDraft.note,
    });

    this.newDraft = { source: '', amount: 0, note: '' };
    this.showAddDraftForm.set(false);
    this.toastService.success('Template saved');
  }

  confirmApplyDraft(draft: IncomeDraft): void {
    this.draftToApply = draft;
    this.applyDraftDialogOpen.set(true);
  }

  async executeApplyDraft(): Promise<void> {
    if (!this.draftToApply) return;
    
    await this.profileService.addIncomeEntry({
      source: this.draftToApply.source,
      amount: this.draftToApply.amount,
      note: this.draftToApply.note,
      date: new Date()
    });
    
    this.toastService.success(`Applied ${this.draftToApply.source}`);
    this.applyDraftDialogOpen.set(false);
    this.draftToApply = null;
    this.loadEntries();
  }

  confirmDeleteDraft(draft: IncomeDraft): void {
    this.draftToDelete = draft;
    this.deleteDraftDialogOpen.set(true);
  }

  async deleteDraft(): Promise<void> {
    if (!this.draftToDelete) return;
    await this.profileService.deleteIncomeDraft(this.draftToDelete.id);
    this.deleteDraftDialogOpen.set(false);
    this.draftToDelete = null;
    this.toastService.success('Template deleted');
  }

  private getCurrentMonth(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  async logout(): Promise<void> {
    await this.authService.signOut();
    this.toastService.success('Signed out successfully');
    this.router.navigate(['/auth/login']);
  }
}
