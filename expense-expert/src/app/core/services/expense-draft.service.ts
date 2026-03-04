import { Injectable, inject } from '@angular/core';
import { where, orderBy } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { FirestoreService } from './firestore.service';
import { AuthService } from './auth.service';
import { ExpenseService } from './expense.service';
import {
  ExpenseDraft,
  CreateDraftDto,
  UpdateDraftDto,
  DraftApplication,
  DraftApplicationStatus,
} from '../models/expense-draft.model';
import { ExpenseCategory } from '../models/expense.model';

@Injectable({ providedIn: 'root' })
export class ExpenseDraftService {
  private firestoreService = inject(FirestoreService);
  private authService = inject(AuthService);
  private expenseService = inject(ExpenseService);

  private get draftsPath(): string {
    return this.firestoreService.userPath(this.authService.currentUser()!.uid, 'expense-drafts');
  }

  private get applicationsPath(): string {
    return this.firestoreService.userPath(this.authService.currentUser()!.uid, 'draft-applications');
  }

  getDrafts(): Observable<ExpenseDraft[]> {
    return this.firestoreService.getCollection<ExpenseDraft>(
      this.draftsPath,
      where('isActive', '==', true),
      orderBy('title', 'asc')
    );
  }

  getAllDrafts(): Observable<ExpenseDraft[]> {
    return this.firestoreService.getCollection<ExpenseDraft>(
      this.draftsPath,
      orderBy('title', 'asc')
    );
  }

  getDraftById(id: string): Observable<ExpenseDraft> {
    return this.firestoreService.getDocument<ExpenseDraft>(`${this.draftsPath}/${id}`);
  }

  async createDraft(dto: CreateDraftDto): Promise<string> {
    return this.firestoreService.addDocument(this.draftsPath, {
      ...dto,
      isActive: true,
    });
  }

  async updateDraft(id: string, dto: UpdateDraftDto): Promise<void> {
    return this.firestoreService.updateDocument(`${this.draftsPath}/${id}`, dto);
  }

  async deleteDraft(id: string): Promise<void> {
    return this.firestoreService.deleteDocument(`${this.draftsPath}/${id}`);
  }

  async toggleDraftActive(id: string, isActive: boolean): Promise<void> {
    return this.firestoreService.updateDocument(`${this.draftsPath}/${id}`, { isActive });
  }

  getApplicationsForMonth(month: string): Observable<DraftApplication[]> {
    return this.firestoreService.getCollection<DraftApplication>(
      this.applicationsPath,
      where('month', '==', month)
    );
  }

  getApplicationById(id: string): Observable<DraftApplication> {
    return this.firestoreService.getDocument<DraftApplication>(`${this.applicationsPath}/${id}`);
  }

  async applyDraftToMonth(draft: ExpenseDraft, month: string): Promise<string> {
    return this.firestoreService.addDocument(this.applicationsPath, {
      draftId: draft.id,
      month,
      targetAmount: draft.targetAmount,
      paidAmount: 0,
      installmentsPaid: 0,
      totalInstallments: draft.installmentCount,
      status: DraftApplicationStatus.Pending,
      payments: [],
    });
  }

  async recordInstallmentPayment(
    application: DraftApplication,
    amount: number,
    draft: ExpenseDraft
  ): Promise<string> {
    const expenseId = await this.expenseService.addExpense({
      title: `${draft.title} - Installment ${application.installmentsPaid + 1}`,
      description: `Payment for ${draft.title}`,
      amount,
      category: draft.category as ExpenseCategory,
      date: new Date(),
      isLoan: draft.isLoan,
      loanPersonId: draft.loanPersonId,
      draftId: draft.id,
      installmentIndex: application.installmentsPaid,
    });

    const newPaidAmount = application.paidAmount + amount;
    const newInstallmentsPaid = application.installmentsPaid + 1;
    const newStatus =
      newPaidAmount >= application.targetAmount
        ? DraftApplicationStatus.Completed
        : DraftApplicationStatus.Partial;

    await this.firestoreService.updateDocument(`${this.applicationsPath}/${application.id}`, {
      paidAmount: newPaidAmount,
      installmentsPaid: newInstallmentsPaid,
      status: newStatus,
      payments: [
        ...application.payments,
        { amount, date: new Date(), expenseId },
      ],
    });

    return expenseId;
  }
}
