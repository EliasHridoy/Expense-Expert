import { Injectable, inject } from '@angular/core';
import { where, orderBy } from '@angular/fire/firestore';
import { Observable, firstValueFrom, map } from 'rxjs';
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

  /** Returns all goals and filters client-side for those active in the given month */
  getGoalsActiveInMonth(month: string): Observable<SavingGoal[]> {
    return this.firestoreService
      .getCollection<SavingGoal>(
        this.firestoreService.userPath(this.uid, 'saving-goals'),
        orderBy('purpose', 'asc')
      )
      .pipe(
        map((goals) =>
          goals.filter((g) => g.startMonth <= month && g.endMonth >= month)
        )
      );
  }

  async addGoal(dto: CreateSavingGoalDto): Promise<string> {
    const endMonth = this.computeEndMonth(dto.startMonth, dto.durationValue, dto.durationUnit);
    return this.firestoreService.addDocument(
      this.firestoreService.userPath(this.uid, 'saving-goals'),
      { ...dto, endMonth, savedAmount: 0 }
    );
  }

  async updateGoal(id: string, dto: UpdateSavingGoalDto): Promise<void> {
    const update: UpdateSavingGoalDto & { endMonth?: string } = { ...dto };
    // Recompute endMonth if duration or startMonth changed
    if ((dto.startMonth || dto.durationValue || dto.durationUnit)) {
      const goalPath = `${this.firestoreService.userPath(this.uid, 'saving-goals')}/${id}`;
      const current = await firstValueFrom(
        this.firestoreService.getDocument<SavingGoal>(goalPath)
      );
      if (current) {
        const startMonth = dto.startMonth ?? current.startMonth;
        const durationValue = dto.durationValue ?? current.durationValue;
        const durationUnit = dto.durationUnit ?? current.durationUnit;
        update.endMonth = this.computeEndMonth(startMonth, durationValue, durationUnit);
      }
    }
    return this.firestoreService.updateDocument(
      `${this.firestoreService.userPath(this.uid, 'saving-goals')}/${id}`,
      update
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

    // ✅ FIX: Use firstValueFrom() for a one-shot read — NOT subscribe() which is a live stream
    // The old .subscribe() caused an infinite loop: update → Firestore event → update → ...
    const goalPath = `${this.firestoreService.userPath(this.uid, 'saving-goals')}/${dto.goalId}`;
    const goal = await firstValueFrom(
      this.firestoreService.getDocument<SavingGoal>(goalPath)
    );
    if (goal) {
      await this.firestoreService.updateDocument(goalPath, {
        savedAmount: goal.savedAmount + dto.amount,
      });
    }

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
            existing.months.add(goal.startMonth);
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

  /** Compute end month string given a start month, duration value, and unit */
  computeEndMonth(startMonth: string, durationValue: number, durationUnit: 'months' | 'years'): string {
    const [year, month] = startMonth.split('-').map(Number);
    const totalMonths = durationUnit === 'years' ? durationValue * 12 : durationValue;
    // End month is the last month of the span (start + totalMonths - 1)
    const endDate = new Date(year, month - 1 + totalMonths - 1, 1);
    const endYear = endDate.getFullYear();
    const endMonth = String(endDate.getMonth() + 1).padStart(2, '0');
    return `${endYear}-${endMonth}`;
  }
}
