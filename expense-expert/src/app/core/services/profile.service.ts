import { Injectable, inject } from '@angular/core';
import { Firestore, doc, getDoc, setDoc, serverTimestamp } from '@angular/fire/firestore';
import { where } from '@angular/fire/firestore';
import { Observable, map } from 'rxjs';
import { FirestoreService } from './firestore.service';
import { AuthService } from './auth.service';
import { UserProfile, IncomeEntry, CreateIncomeEntryDto, UpdateIncomeEntryDto } from '../models/income.model';

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private firestore = inject(Firestore);
  private firestoreService = inject(FirestoreService);
  private authService = inject(AuthService);

  private get uid(): string {
    return this.authService.currentUser()!.uid;
  }

  private get profileDocPath(): string {
    return `users/${this.uid}`;
  }

  private get incomePath(): string {
    return this.firestoreService.userPath(this.uid, 'income-entries');
  }

  // --- User Profile (salary) ---

  async getProfile(): Promise<UserProfile | null> {
    const ref = doc(this.firestore, this.profileDocPath);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const data = snap.data();
      return {
        monthlySalary: data['monthlySalary'] ?? 0,
        salaries: data['salaries'] ?? {},
        createdAt: data['createdAt']?.toDate(),
        updatedAt: data['updatedAt']?.toDate() ?? new Date(),
      };
    }
    return null;
  }

  getSalaryForMonth(profile: UserProfile | null, month: string): number {
    if (!profile) return 0;
    if (profile.salaries && profile.salaries[month] !== undefined) {
      return profile.salaries[month];
    }
    if (profile.salaries) {
      const pastMonths = Object.keys(profile.salaries).sort();
      if (pastMonths.length > 0) {
        const monthsBefore = pastMonths.filter((m) => m < month);
        if (monthsBefore.length > 0) {
          const closestMonth = monthsBefore[monthsBefore.length - 1];
          return profile.salaries[closestMonth];
        }
        return profile.salaries[pastMonths[0]];
      }
    }
    return profile.monthlySalary ?? 0;
  }

  async updateSalary(monthlySalary: number, month?: string): Promise<void> {
    const profile = await this.getProfile();
    const targetMonth = month || this.toMonth(new Date());
    const oldSalaryForTargetMonth = this.getSalaryForMonth(profile, targetMonth);

    const ref = doc(this.firestore, this.profileDocPath);

    const updatedSalaries: { [key: string]: number } = {
      ...profile?.salaries,
      [targetMonth]: monthlySalary,
    };

    // For legacy users, if the registration month is not in the map,
    // initialize it with the old salary to preserve history prior to this edit.
    const createdAt = profile?.createdAt || new Date();
    const registrationMonth = this.toMonth(createdAt);
    if (registrationMonth < targetMonth && (!profile?.salaries || profile.salaries[registrationMonth] === undefined)) {
      updatedSalaries[registrationMonth] = profile?.monthlySalary ?? 0;
    }

    // Cascade the update to any subsequent months that have an explicit entry
    // matching the old salary of the target month (indicating they were inheriting the old rate).
    if (profile?.salaries) {
      for (const m of Object.keys(profile.salaries)) {
        if (m > targetMonth && profile.salaries[m] === oldSalaryForTargetMonth) {
          updatedSalaries[m] = monthlySalary;
        }
      }
    }

    await setDoc(
      ref,
      {
        monthlySalary,
        salaries: updatedSalaries,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  }

  // --- Income Entries (additional earnings) ---

  getIncomeEntries(month: string): Observable<IncomeEntry[]> {
    return this.firestoreService.getCollection<IncomeEntry>(
      this.incomePath,
      where('month', '==', month)
    );
  }

  getAllIncomeEntries(): Observable<IncomeEntry[]> {
    return this.firestoreService.getCollection<IncomeEntry>(this.incomePath);
  }

  async addIncomeEntry(dto: CreateIncomeEntryDto): Promise<string> {
    const month = this.toMonth(dto.date);
    return this.firestoreService.addDocument(this.incomePath, { ...dto, month });
  }

  async updateIncomeEntry(id: string, dto: UpdateIncomeEntryDto): Promise<void> {
    const data: Record<string, any> = { ...dto };
    if (dto.date) {
      data['month'] = this.toMonth(dto.date);
    }
    return this.firestoreService.updateDocument(`${this.incomePath}/${id}`, data);
  }

  async deleteIncomeEntry(id: string): Promise<void> {
    return this.firestoreService.deleteDocument(`${this.incomePath}/${id}`);
  }

  /** Total income for a month = salary + additional entries */
  getTotalIncome(month: string): Observable<{ salary: number; additional: number; total: number }> {
    return this.getIncomeEntries(month).pipe(
      map((entries) => {
        const additional = entries.reduce((sum, e) => sum + e.amount, 0);
        return { salary: 0, additional, total: additional };
      })
    );
  }

  private toMonth(date: Date): string {
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }
}
