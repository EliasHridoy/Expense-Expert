import { Injectable, inject } from '@angular/core';
import { where } from '@angular/fire/firestore';
import { Observable, map, combineLatest, of, from } from 'rxjs';
import { take } from 'rxjs/operators';
import { FirestoreService } from './firestore.service';
import { AuthService } from './auth.service';
import { ProfileService } from './profile.service';
import { Expense, ExpenseCategory } from '../models/expense.model';
import { SavingEntry } from '../models/saving.model';
import { IncomeEntry } from '../models/income.model';
import { LoanTaken } from '../models/loan.model';
import { ShoppingList } from '../models/shopping-list.model';
import { MonthSummary, MonthlyTrend, CategoryBreakdown, SubcategoryBreakdown } from '../models/dashboard.model';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private firestoreService = inject(FirestoreService);
  private authService = inject(AuthService);
  private profileService = inject(ProfileService);

  private get uid(): string {
    return this.authService.currentUser()!.uid;
  }

  getCurrentMonthSummary(month: string): Observable<MonthSummary> {
    const expenses$ = this.firestoreService.getCollection<Expense>(
      this.firestoreService.userPath(this.uid, 'expenses'),
      where('month', '<=', month)
    );

    const savings$ = this.firestoreService.getCollection<SavingEntry>(
      this.firestoreService.userPath(this.uid, 'saving-entries'),
      where('month', '<=', month)
    );

    const income$ = this.firestoreService.getCollection<IncomeEntry>(
      this.firestoreService.userPath(this.uid, 'income-entries'),
      where('month', '<=', month)
    );

    const loansTaken$ = this.firestoreService.getCollection<LoanTaken>(
      this.firestoreService.userPath(this.uid, 'loans-taken'),
      where('month', '<=', month)
    );

    const salary$ = from(this.profileService.getProfile());

    return combineLatest([expenses$, savings$, income$, loansTaken$, salary$]).pipe(
      map(([allExpenses, allSavingEntries, allIncomeEntries, allLoansTaken, profile]) => {
        const expenses = allExpenses.filter((e) => e.month === month);
        const savingEntries = allSavingEntries.filter((e) => e.month === month);
        const incomeEntries = allIncomeEntries.filter((e) => e.month === month);
        const loansTakenThisMonth = allLoansTaken.filter((l) => l.month === month);

        const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
        const totalSavings = savingEntries.reduce(
          (sum, e) => sum + (e.type === 'deposit' ? e.amount : -e.amount),
          0
        );
        const savingsInExpenses = expenses
          .filter((e) => e.category === ExpenseCategory.Savings)
          .reduce((sum, e) => sum + e.amount, 0);

        const salary = this.profileService.getSalaryForMonth(profile, month);
        const additionalIncome = incomeEntries.reduce((sum, e) => sum + e.amount, 0);
        // Loans taken this month are added to available income
        const loansTakenIncome = loansTakenThisMonth.reduce((sum, l) => sum + l.amount, 0);
        const currentMonthIncome = salary + additionalIncome + loansTakenIncome;

        let previousMonthRemaining = 0;
        const createdAt = profile?.createdAt;
        if (createdAt) {
          const pastMonths = this.getMonthsBetween(createdAt, month);
          for (const pastMonth of pastMonths) {
            const pastExpenses = allExpenses.filter((e) => e.month === pastMonth);
            const pastSavings = allSavingEntries.filter((e) => e.month === pastMonth);
            const pastIncome = allIncomeEntries.filter((e) => e.month === pastMonth);
            const pastLoansTaken = allLoansTaken.filter((l) => l.month === pastMonth);

            const pastTotalExpenses = pastExpenses.reduce((sum, e) => sum + e.amount, 0);
            const pastTotalSavings = pastSavings.reduce(
              (sum, e) => sum + (e.type === 'deposit' ? e.amount : -e.amount),
              0
            );
            const pastSavingsInExpenses = pastExpenses
              .filter((e) => e.category === ExpenseCategory.Savings)
              .reduce((sum, e) => sum + e.amount, 0);
            const pastAdditionalIncome = pastIncome.reduce((sum, e) => sum + e.amount, 0);
            const pastSalary = this.profileService.getSalaryForMonth(profile, pastMonth);
            const pastLoansTakenIncome = pastLoansTaken.reduce((sum, l) => sum + l.amount, 0);
            const pastTotalIncome = pastSalary + pastAdditionalIncome + pastLoansTakenIncome;

            previousMonthRemaining += pastTotalIncome - pastTotalExpenses - (pastTotalSavings - pastSavingsInExpenses);
          }
        }

        const totalIncome = currentMonthIncome + previousMonthRemaining;

        return {
          previousMonthRemaining,
          currentMonthIncome,
          totalIncome,
          totalExpenses,
          totalSavings,
          remaining: totalIncome - totalExpenses - (totalSavings - savingsInExpenses),
          expenseCount: expenses.length,
          loansTakenIncome,
        };
      })
    );
  }

  private getMonthsBetween(startDate: Date, endMonthStr: string): string[] {
    const months: string[] = [];
    const startYear = startDate.getFullYear();
    const startMonth = startDate.getMonth();

    const [endYearStr, endMonthNumStr] = endMonthStr.split('-');
    const endYear = parseInt(endYearStr, 10);
    const endMonth = parseInt(endMonthNumStr, 10) - 1;

    let currentYear = startYear;
    let currentMonth = startMonth;

    while (currentYear < endYear || (currentYear === endYear && currentMonth < endMonth)) {
      months.push(`${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`);
      currentMonth++;
      if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
      }
    }

    return months;
  }

  getMonthlyTrend(months: number = 6): Observable<MonthlyTrend[]> {
    const monthKeys = this.getPastMonths(months);

    const trendObservables = monthKeys.map((month) => {
      const expenses$ = this.firestoreService.getCollection<Expense>(
        this.firestoreService.userPath(this.uid, 'expenses'),
        where('month', '==', month)
      );

      const savings$ = this.firestoreService.getCollection<SavingEntry>(
        this.firestoreService.userPath(this.uid, 'saving-entries'),
        where('month', '==', month)
      );

      return combineLatest([expenses$, savings$, of(month)]).pipe(
        map(([expenses, savingEntries, m]) => ({
          month: m,
          totalExpenses: expenses.reduce((sum, e) => sum + e.amount, 0),
          totalSavings: savingEntries.reduce(
            (sum, e) => sum + (e.type === 'deposit' ? e.amount : -e.amount),
            0
          ),
        }))
      );
    });

    return combineLatest(trendObservables);
  }

  getCategoryBreakdown(month: string): Observable<CategoryBreakdown[]> {
    const expenses$ = this.firestoreService.getCollection<Expense>(
      this.firestoreService.userPath(this.uid, 'expenses'),
      where('month', '==', month)
    );

    const shoppingLists$ = this.firestoreService.getCollection<ShoppingList>(
      this.firestoreService.userPath(this.uid, 'shopping_lists')
    );

    return combineLatest([expenses$, shoppingLists$]).pipe(
      map(([expenses, shoppingLists]) => {
        const shoppingMap = new Map<string, ShoppingList>();
        for (const list of shoppingLists) {
          shoppingMap.set(list.id, list);
        }

        const categoryMap = new Map<
          string,
          {
            total: number;
            count: number;
            subMap: Map<string, { total: number; count: number }>;
          }
        >();
        let grandTotal = 0;

        for (const expense of expenses) {
          if (!categoryMap.has(expense.category)) {
            categoryMap.set(expense.category, { total: 0, count: 0, subMap: new Map() });
          }
          const catData = categoryMap.get(expense.category)!;
          catData.total += expense.amount;
          catData.count += 1;
          grandTotal += expense.amount;

          // Check if this expense is linked to a detailed shopping list
          const linkedList = expense.shoppingListId ? shoppingMap.get(expense.shoppingListId) : null;
          if (linkedList && linkedList.items && linkedList.items.length > 0) {
            for (const item of linkedList.items) {
              const itemPrice = Number(item.price) || 0;
              if (itemPrice > 0) {
                const subName = item.subcategory?.trim() || expense.subcategory?.trim() || 'General';
                const subData = catData.subMap.get(subName) || { total: 0, count: 0 };
                subData.total += itemPrice;
                subData.count += 1;
                catData.subMap.set(subName, subData);
              }
            }
          } else {
            const subName = expense.subcategory?.trim() || 'General';
            const subData = catData.subMap.get(subName) || { total: 0, count: 0 };
            subData.total += expense.amount;
            subData.count += 1;
            catData.subMap.set(subName, subData);
          }
        }

        return Array.from(categoryMap.entries())
          .map(([category, data]) => {
            const subcategories: SubcategoryBreakdown[] = Array.from(data.subMap.entries())
              .map(([subcategory, subData]) => ({
                subcategory,
                total: Math.round(subData.total * 100) / 100,
                count: subData.count,
                percentage: data.total > 0 ? (subData.total / data.total) * 100 : 0,
              }))
              .sort((a, b) => b.total - a.total);

            return {
              category,
              total: Math.round(data.total * 100) / 100,
              count: data.count,
              percentage: grandTotal > 0 ? (data.total / grandTotal) * 100 : 0,
              subcategories,
            };
          })
          .sort((a, b) => b.total - a.total);
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
