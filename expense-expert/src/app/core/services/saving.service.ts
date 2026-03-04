import { Injectable, inject } from '@angular/core';
import { where, orderBy } from '@angular/fire/firestore';
import { Observable, map } from 'rxjs';
import { FirestoreService } from './firestore.service';
import { AuthService } from './auth.service';
import {
  BankAccount,
  CreateBankAccountDto,
  UpdateBankAccountDto,
  SavingGoal,
  CreateSavingGoalDto,
  UpdateSavingGoalDto,
  SavingEntry,
  CreateSavingEntryDto,
  SavingSummary,
} from '../models/saving.model';

@Injectable({ providedIn: 'root' })
export class SavingService {
  private firestoreService = inject(FirestoreService);
  private authService = inject(AuthService);

  private get uid(): string {
    return this.authService.currentUser()!.uid;
  }

  // Bank Accounts
  getBankAccounts(): Observable<BankAccount[]> {
    return this.firestoreService.getCollection<BankAccount>(
      this.firestoreService.userPath(this.uid, 'bank-accounts'),
      orderBy('bankName', 'asc')
    );
  }

  async addBankAccount(dto: CreateBankAccountDto): Promise<string> {
    return this.firestoreService.addDocument(
      this.firestoreService.userPath(this.uid, 'bank-accounts'),
      dto
    );
  }

  async updateBankAccount(id: string, dto: UpdateBankAccountDto): Promise<void> {
    return this.firestoreService.updateDocument(
      `${this.firestoreService.userPath(this.uid, 'bank-accounts')}/${id}`,
      dto
    );
  }

  async deleteBankAccount(id: string): Promise<void> {
    return this.firestoreService.deleteDocument(
      `${this.firestoreService.userPath(this.uid, 'bank-accounts')}/${id}`
    );
  }

  // Saving Goals
  getGoalsByMonth(month: string): Observable<SavingGoal[]> {
    return this.firestoreService.getCollection<SavingGoal>(
      this.firestoreService.userPath(this.uid, 'saving-goals'),
      where('month', '==', month),
      orderBy('purpose', 'asc')
    );
  }

  async addGoal(dto: CreateSavingGoalDto): Promise<string> {
    return this.firestoreService.addDocument(
      this.firestoreService.userPath(this.uid, 'saving-goals'),
      { ...dto, savedAmount: 0 }
    );
  }

  async updateGoal(id: string, dto: UpdateSavingGoalDto): Promise<void> {
    return this.firestoreService.updateDocument(
      `${this.firestoreService.userPath(this.uid, 'saving-goals')}/${id}`,
      dto
    );
  }

  async deleteGoal(id: string): Promise<void> {
    return this.firestoreService.deleteDocument(
      `${this.firestoreService.userPath(this.uid, 'saving-goals')}/${id}`
    );
  }

  // Saving Entries
  getEntriesByGoal(goalId: string): Observable<SavingEntry[]> {
    return this.firestoreService.getCollection<SavingEntry>(
      this.firestoreService.userPath(this.uid, 'saving-entries'),
      where('goalId', '==', goalId),
      orderBy('date', 'desc')
    );
  }

  async addSavingEntry(dto: CreateSavingEntryDto, month: string): Promise<string> {
    const entryId = await this.firestoreService.addDocument(
      this.firestoreService.userPath(this.uid, 'saving-entries'),
      { ...dto, month }
    );

    // Update goal's savedAmount
    const goalPath = `${this.firestoreService.userPath(this.uid, 'saving-goals')}/${dto.goalId}`;
    const goalDoc = this.firestoreService.getDocument<SavingGoal>(goalPath);
    goalDoc.subscribe((goal) => {
      if (goal) {
        this.firestoreService.updateDocument(goalPath, {
          savedAmount: goal.savedAmount + dto.amount,
        });
      }
    });

    return entryId;
  }

  getSavingSummaryByPurpose(): Observable<SavingSummary[]> {
    return this.firestoreService
      .getCollection<SavingGoal>(
        this.firestoreService.userPath(this.uid, 'saving-goals')
      )
      .pipe(
        map((goals) => {
          const purposeMap = new Map<string, { totalSaved: number; months: Set<string> }>();
          for (const goal of goals) {
            const existing = purposeMap.get(goal.purpose) || {
              totalSaved: 0,
              months: new Set<string>(),
            };
            existing.totalSaved += goal.savedAmount;
            existing.months.add(goal.month);
            purposeMap.set(goal.purpose, existing);
          }
          return Array.from(purposeMap.entries()).map(([purpose, data]) => ({
            purpose,
            totalSaved: data.totalSaved,
            months: data.months.size,
          }));
        })
      );
  }
}
