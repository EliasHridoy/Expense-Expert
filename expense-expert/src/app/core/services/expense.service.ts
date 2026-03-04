import { Injectable, inject } from '@angular/core';
import { where, orderBy } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { FirestoreService } from './firestore.service';
import { AuthService } from './auth.service';
import { Expense, CreateExpenseDto, UpdateExpenseDto } from '../models/expense.model';

@Injectable({ providedIn: 'root' })
export class ExpenseService {
  private firestoreService = inject(FirestoreService);
  private authService = inject(AuthService);

  private get expensesPath(): string {
    return this.firestoreService.userPath(this.authService.currentUser()!.uid, 'expenses');
  }

  getExpensesByMonth(month: string): Observable<Expense[]> {
    return this.firestoreService.getCollection<Expense>(
      this.expensesPath,
      where('month', '==', month),
      orderBy('date', 'desc')
    );
  }

  getExpenseById(id: string): Observable<Expense> {
    return this.firestoreService.getDocument<Expense>(`${this.expensesPath}/${id}`);
  }

  async addExpense(dto: CreateExpenseDto): Promise<string> {
    const month = this.formatMonth(dto.date);
    return this.firestoreService.addDocument(this.expensesPath, {
      ...dto,
      month,
      loanCleared: false,
      draftId: dto.draftId ?? null,
      installmentIndex: dto.installmentIndex ?? null,
    });
  }

  async updateExpense(id: string, dto: UpdateExpenseDto): Promise<void> {
    const data: Record<string, any> = { ...dto };
    if (dto.date) {
      data['month'] = this.formatMonth(dto.date);
    }
    return this.firestoreService.updateDocument(`${this.expensesPath}/${id}`, data);
  }

  async deleteExpense(id: string): Promise<void> {
    return this.firestoreService.deleteDocument(`${this.expensesPath}/${id}`);
  }

  getOutstandingLoans(): Observable<Expense[]> {
    return this.firestoreService.getCollection<Expense>(
      this.expensesPath,
      where('isLoan', '==', true),
      where('loanCleared', '==', false)
    );
  }

  getLoansByPerson(personId: string): Observable<Expense[]> {
    return this.firestoreService.getCollection<Expense>(
      this.expensesPath,
      where('isLoan', '==', true),
      where('loanPersonId', '==', personId)
    );
  }

  async clearLoan(expenseId: string): Promise<void> {
    return this.firestoreService.updateDocument(`${this.expensesPath}/${expenseId}`, {
      loanCleared: true,
    });
  }

  private formatMonth(date: Date): string {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }
}
