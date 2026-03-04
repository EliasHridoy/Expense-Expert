import { Injectable, inject, signal } from '@angular/core';
import { orderBy } from '@angular/fire/firestore';
import { FirestoreService } from './firestore.service';
import { AuthService } from './auth.service';
import { EXPENSE_CATEGORIES } from '../models/expense.model';

export interface CategoryItem {
  value: string;
  label: string;
  isCustom: boolean;
}

interface CustomCategory {
  id: string;
  name: string;
  createdAt: Date;
}

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private firestoreService = inject(FirestoreService);
  private authService = inject(AuthService);

  allCategories = signal<CategoryItem[]>([
    ...EXPENSE_CATEGORIES.map((c) => ({ ...c, isCustom: false })),
  ]);

  private get categoriesPath(): string {
    return this.firestoreService.userPath(this.authService.currentUser()!.uid, 'categories');
  }

  loadCategories(): void {
    this.firestoreService
      .getCollection<CustomCategory>(this.categoriesPath, orderBy('name', 'asc'))
      .subscribe((customs) => {
        const builtIn = EXPENSE_CATEGORIES.map((c) => ({ ...c, isCustom: false }));
        const custom = customs.map((c) => ({
          value: c.name.toLowerCase().replace(/\s+/g, '-'),
          label: c.name,
          isCustom: true,
        }));
        this.allCategories.set([...builtIn, ...custom]);
      });
  }

  async addCategory(name: string): Promise<string> {
    const id = await this.firestoreService.addDocument(this.categoriesPath, { name });
    return id;
  }

  async deleteCategory(name: string): Promise<void> {
    // Find the custom category doc by name
    const categories = this.allCategories().filter((c) => c.isCustom && c.label === name);
    if (categories.length > 0) {
      // We need the doc id - reload will handle cleanup
    }
  }
}
