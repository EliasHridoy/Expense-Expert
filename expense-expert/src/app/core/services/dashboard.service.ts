import { Injectable, inject } from '@angular/core';
import { where } from '@angular/fire/firestore';
import { Observable, map, combineLatest, of } from 'rxjs';
import { FirestoreService } from './firestore.service';
import { AuthService } from './auth.service';
import { Expense } from '../models/expense.model';
import { SavingGoal } from '../models/saving.model';
import { MonthSummary, MonthlyTrend, CategoryBreakdown } from '../models/dashboard.model';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private firestoreService = inject(FirestoreService);
  private authService = inject(AuthService);

  private get uid(): string {
    return this.authService.currentUser()!.uid;
  }

  getCurrentMonthSummary(month: string): Observable<MonthSummary> {
    const expenses$ = this.firestoreService.getCollection<Expense>(
      this.firestoreService.userPath(this.uid, 'expenses'),
      where('month', '==', month)
    );

    const savings$ = this.firestoreService.getCollection<SavingGoal>(
      this.firestoreService.userPath(this.uid, 'saving-goals'),
      where('month', '==', month)
    );

    return combineLatest([expenses$, savings$]).pipe(
      map(([expenses, savings]) => {
        const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
        const totalSavings = savings.reduce((sum, s) => sum + s.savedAmount, 0);
        return {
          totalExpenses,
          totalSavings,
          balance: totalSavings - totalExpenses,
          expenseCount: expenses.length,
        };
      })
    );
  }

  getMonthlyTrend(months: number = 6): Observable<MonthlyTrend[]> {
    const monthKeys = this.getPastMonths(months);

    const trendObservables = monthKeys.map((month) => {
      const expenses$ = this.firestoreService.getCollection<Expense>(
        this.firestoreService.userPath(this.uid, 'expenses'),
        where('month', '==', month)
      );

      const savings$ = this.firestoreService.getCollection<SavingGoal>(
        this.firestoreService.userPath(this.uid, 'saving-goals'),
        where('month', '==', month)
      );

      return combineLatest([expenses$, savings$, of(month)]).pipe(
        map(([expenses, savings, m]) => ({
          month: m,
          totalExpenses: expenses.reduce((sum, e) => sum + e.amount, 0),
          totalSavings: savings.reduce((sum, s) => sum + s.savedAmount, 0),
        }))
      );
    });

    return combineLatest(trendObservables);
  }

  getCategoryBreakdown(month: string): Observable<CategoryBreakdown[]> {
    return this.firestoreService
      .getCollection<Expense>(
        this.firestoreService.userPath(this.uid, 'expenses'),
        where('month', '==', month)
      )
      .pipe(
        map((expenses) => {
          const categoryMap = new Map<string, { total: number; count: number }>();
          const grandTotal = expenses.reduce((sum, e) => sum + e.amount, 0);

          for (const expense of expenses) {
            const existing = categoryMap.get(expense.category) || { total: 0, count: 0 };
            existing.total += expense.amount;
            existing.count += 1;
            categoryMap.set(expense.category, existing);
          }

          return Array.from(categoryMap.entries()).map(([category, data]) => ({
            category,
            total: data.total,
            count: data.count,
            percentage: grandTotal > 0 ? (data.total / grandTotal) * 100 : 0,
          }));
        })
      );
  }

  private getPastMonths(count: number): string[] {
    const months: string[] = [];
    const now = new Date();
    for (let i = 0; i < count; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      months.push(`${year}-${month}`);
    }
    return months.reverse();
  }
}
