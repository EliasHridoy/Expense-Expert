import { Injectable, inject, signal } from '@angular/core';
import { Firestore, doc, getDoc, updateDoc } from '@angular/fire/firestore';
import { AuthService } from './auth.service';

export interface TourStep {
  elementId: string;
  title: string;
  description: string;
  position: 'top' | 'bottom' | 'left' | 'right';
}

export interface PageTourConfig {
  pageKey: string;
  steps: TourStep[];
}

@Injectable({ providedIn: 'root' })
export class TourService {
  private firestore = inject(Firestore);
  private authService = inject(AuthService);

  isActive = signal(false);
  currentStepIndex = signal(0);
  currentSteps = signal<TourStep[]>([]);
  currentPageKey = signal('');

  /** Set of page keys the user has already seen */
  private completedPages = signal<Set<string>>(new Set());
  private loaded = false;

  /** All page tour configs */
  private readonly pageTours: Record<string, TourStep[]> = {
    dashboard: [
      {
        elementId: 'summary-card-income',
        title: '💰 Total Income',
        description: 'This shows your total income for the current month. To set your monthly salary or add extra earnings, go to the Profile page.',
        position: 'bottom',
      },
      {
        elementId: 'summary-card-expenses',
        title: '💸 Total Expenses',
        description: 'Your total spending this month. Add or manage expenses from the Expenses page in the sidebar.',
        position: 'bottom',
      },
      {
        elementId: 'summary-card-savings',
        title: '🏦 Total Savings',
        description: 'Monthly savings from your saving goals. Create and manage goals in the Savings page.',
        position: 'bottom',
      },
      {
        elementId: 'summary-card-remaining',
        title: '📊 Remaining Balance',
        description: 'What\'s left after expenses and savings are deducted. Keep this healthy!',
        position: 'bottom',
      },
      {
        elementId: 'monthly-chart',
        title: '📈 Monthly Trend',
        description: 'A 6-month chart comparing your income and expenses over time. Great for spotting spending patterns.',
        position: 'top',
      },
    ],
    expenses: [
      {
        elementId: 'expense-add-btn',
        title: '➕ Add Expense',
        description: 'Click here to record a new expense. You\'ll pick a category, set the amount, and optionally mark it as a loan.',
        position: 'bottom',
      },
      {
        elementId: 'expense-list-area',
        title: '📋 Your Expenses',
        description: 'All your expenses for the selected month appear here. Click any expense to see details or edit it.',
        position: 'top',
      },
    ],
    drafts: [
      {
        elementId: 'draft-add-btn',
        title: '📝 Create a Draft',
        description: 'Drafts are reusable expense templates for recurring bills like rent, WiFi, or electricity. Create one and apply it each month!',
        position: 'bottom',
      },
      {
        elementId: 'draft-list-area',
        title: '📋 Your Drafts',
        description: 'Your saved drafts appear here. Click "Apply" to turn a draft into an actual expense for this month. Drafts with installments show payment progress.',
        position: 'top',
      },
    ],
    savings: [
      {
        elementId: 'loans-summary-card',
        title: '🤝 Pending Loans',
        description: 'When you mark an expense as a loan to someone, it shows up here. Click to see all loans and record repayments.',
        position: 'bottom',
      },
      {
        elementId: 'bank-accounts-section',
        title: '🏦 Bank Accounts',
        description: 'Add your bank accounts to organize where your savings go.',
        position: 'bottom',
      },
      {
        elementId: 'saving-goals-section',
        title: '🎯 Saving Goals',
        description: 'Set saving goals (e.g., travel fund, shopping) with target amounts and durations. Quickly save or withdraw from each goal.',
        position: 'top',
      },
    ],
    profile: [
      {
        elementId: 'salary-card',
        title: '💵 Monthly Salary',
        description: 'Set your monthly salary here. This is used to calculate your total income on the Dashboard.',
        position: 'bottom',
      },
      {
        elementId: 'earnings-section',
        title: '💰 Additional Earnings',
        description: 'Got freelance income, bonuses, or other earnings? Add them here by month. They\'ll be added to your dashboard total.',
        position: 'top',
      },
    ],
  };

  /** Load completed tour pages from Firestore */
  async loadTourState(): Promise<void> {
    if (this.loaded) return;

    const user = this.authService.currentUser();
    if (!user) return;

    try {
      const userRef = doc(this.firestore, `users/${user.uid}`);
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        const data = snap.data();
        const completed = data['completedTourPages'] as string[] | undefined;
        if (completed) {
          this.completedPages.set(new Set(completed));
        }
      }
      this.loaded = true;
    } catch {
      this.loaded = true;
    }
  }

  /** Check if a page tour should be shown, and start it if so */
  tryStartPageTour(pageKey: string): void {
    if (this.isActive()) return; // already showing a tour
    if (this.completedPages().has(pageKey)) return; // already seen
    if (!this.pageTours[pageKey]) return; // no tour for this page

    this.currentPageKey.set(pageKey);
    this.currentSteps.set(this.pageTours[pageKey]);
    this.currentStepIndex.set(0);

    // Small delay to let the page render its elements
    setTimeout(() => {
      this.isActive.set(true);
    }, 600);
  }

  /** Force-start a page tour (for restart) */
  forceStartPageTour(pageKey: string): void {
    if (!this.pageTours[pageKey]) return;
    this.currentPageKey.set(pageKey);
    this.currentSteps.set(this.pageTours[pageKey]);
    this.currentStepIndex.set(0);
    setTimeout(() => {
      this.isActive.set(true);
    }, 600);
  }

  nextStep(): void {
    if (this.currentStepIndex() < this.currentSteps().length - 1) {
      this.currentStepIndex.update((v) => v + 1);
    } else {
      this.completeTour();
    }
  }

  previousStep(): void {
    if (this.currentStepIndex() > 0) {
      this.currentStepIndex.update((v) => v - 1);
    }
  }

  skipTour(): void {
    this.completeTour();
  }

  private async completeTour(): Promise<void> {
    const pageKey = this.currentPageKey();
    this.isActive.set(false);
    this.currentSteps.set([]);
    this.currentStepIndex.set(0);

    // Mark this page as completed
    const updated = new Set(this.completedPages());
    updated.add(pageKey);
    this.completedPages.set(updated);

    // Persist to Firestore
    const user = this.authService.currentUser();
    if (user) {
      try {
        const userRef = doc(this.firestore, `users/${user.uid}`);
        await updateDoc(userRef, {
          completedTourPages: Array.from(updated),
        });
      } catch {
        // Silently fail
      }
    }
  }

  /** Reset all tours (for "Restart Tour" button) */
  async resetAllTours(): Promise<void> {
    this.completedPages.set(new Set());
    this.loaded = true;

    const user = this.authService.currentUser();
    if (user) {
      try {
        const userRef = doc(this.firestore, `users/${user.uid}`);
        await updateDoc(userRef, {
          completedTourPages: [],
        });
      } catch {
        // Silently fail
      }
    }
  }

  /** Get all available page keys */
  getAvailablePages(): string[] {
    return Object.keys(this.pageTours);
  }

  get currentStep(): TourStep | null {
    const steps = this.currentSteps();
    const idx = this.currentStepIndex();
    return steps[idx] || null;
  }
}
