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
        updatedAt: data['updatedAt']?.toDate() ?? new Date(),
      };
    }
    return null;
  }

  async updateSalary(monthlySalary: number): Promise<void> {
    const ref = doc(this.firestore, this.profileDocPath);
    await setDoc(ref, { monthlySalary, updatedAt: serverTimestamp() }, { merge: true });
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
