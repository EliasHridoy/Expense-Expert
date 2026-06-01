import { Injectable, inject } from '@angular/core';
import { where, orderBy, serverTimestamp } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { FirestoreService } from './firestore.service';
import { AuthService } from './auth.service';
import { ExpenseService } from './expense.service';
import { LoanTaken, CreateLoanTakenDto, LoanStatus } from '../models/loan.model';
import { ExpenseCategory } from '../models/expense.model';

@Injectable({ providedIn: 'root' })
export class LoanService {
  private firestoreService = inject(FirestoreService);
  private authService = inject(AuthService);
  private expenseService = inject(ExpenseService);

  private get loansTakenPath(): string {
    return this.firestoreService.userPath(this.authService.currentUser()!.uid, 'loans-taken');
  }

  /** Get all loans taken in a specific month */
  getLoansForMonth(month: string): Observable<LoanTaken[]> {
    return this.firestoreService.getCollection<LoanTaken>(
      this.loansTakenPath,
      where('month', '==', month),
      orderBy('date', 'desc')
    );
  }

  /** Get all loans taken across all months */
  getAllLoansTaken(): Observable<LoanTaken[]> {
    return this.firestoreService.getCollection<LoanTaken>(
      this.loansTakenPath,
      orderBy('date', 'desc')
    );
  }

  /** Get all active/partially-repaid loans taken */
  getOutstandingLoansTaken(): Observable<LoanTaken[]> {
    return this.firestoreService.getCollection<LoanTaken>(
      this.loansTakenPath,
      where('status', '!=', 'cleared'),
      orderBy('status'),
      orderBy('date', 'desc')
    );
  }

  /** Add a new taken loan */
  async addLoanTaken(dto: CreateLoanTakenDto): Promise<string> {
    const month = this.formatMonth(dto.date);
    return this.firestoreService.addDocument(this.loansTakenPath, {
      personId: dto.personId,
      amount: dto.amount,
      note: dto.note,
      date: dto.date,
      month,
      repaid: 0,
      status: 'active' as LoanStatus,
    });
  }

  /**
   * Record a repayment for a taken loan.
   * Option B: Also creates an Expense record tagged as LoanRepayment.
   */
  async recordRepayment(loan: LoanTaken, repaymentAmount: number, repaymentDate: Date): Promise<void> {
    const newRepaid = (loan.repaid ?? 0) + repaymentAmount;
    const isFullyRepaid = newRepaid >= loan.amount;
    const newStatus: LoanStatus = isFullyRepaid ? 'cleared' : 'partially_repaid';

    // 1. Update the LoanTaken document
    await this.firestoreService.updateDocument(`${this.loansTakenPath}/${loan.id}`, {
      repaid: newRepaid,
      status: newStatus,
    });

    // 2. Create an Expense record for this repayment (Option B)
    await this.expenseService.addExpense({
      title: `Loan Repayment`,
      description: `Repayment for loan taken`,
      amount: repaymentAmount,
      category: ExpenseCategory.LoanRepayment,
      date: repaymentDate,
      isLoan: false,
      loanPersonId: loan.personId,
      loanTakenId: loan.id,
    } as any);
  }

  /** Mark a loan as fully cleared (without recording an expense) */
  async clearLoan(id: string): Promise<void> {
    return this.firestoreService.updateDocument(`${this.loansTakenPath}/${id}`, {
      status: 'cleared' as LoanStatus,
    });
  }

  /** Delete a loan taken record */
  async deleteLoanTaken(id: string): Promise<void> {
    return this.firestoreService.deleteDocument(`${this.loansTakenPath}/${id}`);
  }

  private formatMonth(date: Date): string {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }
}
