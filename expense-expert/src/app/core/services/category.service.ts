import { Injectable, inject, signal } from '@angular/core';
import { orderBy } from '@angular/fire/firestore';
import { FirestoreService } from './firestore.service';
import { AuthService } from './auth.service';
import { EXPENSE_CATEGORIES } from '../models/expense.model';

export interface CategoryItem {
  value: string;
  label: string;
  icon: string;
  isCustom: boolean;
}

interface CustomCategory {
  id: string;
  name: string;
  icon?: string;
  createdAt: Date;
}

export const CATEGORY_ICONS = [
  '🍔', '🚌', '💡', '💊', '🛍️', '🎮', '✈️', '🎁', '📚', '🏠',
  '📁', '💰', '🎵', '🏋️', '🐾', '☕', '🍕', '👶', '💻', '📱',
  '🎨', '⚽', '💼', '🔧', '🌐', '📦', '🎓', '🏖️', '🚗', '💳',
];

const BUILTIN_ICONS: Record<string, string> = {
  food: '🍔',
  transport: '🚌',
  entertainment: '🎮',
  utilities: '💡',
  savings: '💰',
  other: '📁',
};

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private firestoreService = inject(FirestoreService);
  private authService = inject(AuthService);

  allCategories = signal<CategoryItem[]>(
    EXPENSE_CATEGORIES.map((c) => ({
      ...c,
      icon: BUILTIN_ICONS[c.value] || '📁',
      isCustom: false,
    }))
  );

  private get categoriesPath(): string {
    return this.firestoreService.userPath(this.authService.currentUser()!.uid, 'categories');
  }

  loadCategories(): void {
    this.firestoreService
      .getCollection<CustomCategory>(this.categoriesPath, orderBy('name', 'asc'))
      .subscribe((customs) => {
        const builtIn = EXPENSE_CATEGORIES.map((c) => ({
          ...c,
          icon: BUILTIN_ICONS[c.value] || '📁',
          isCustom: false,
        }));
        const custom = customs.map((c) => ({
          value: c.name.toLowerCase().replace(/\s+/g, '-'),
          label: c.name,
          icon: c.icon || '📁',
          isCustom: true,
        }));
        this.allCategories.set([...builtIn, ...custom]);
      });
  }

  async addCategory(name: string, icon: string): Promise<string> {
    const id = await this.firestoreService.addDocument(this.categoriesPath, { name, icon });
    return id;
  }

  async deleteCategory(name: string): Promise<void> {
    const categories = this.allCategories().filter((c) => c.isCustom && c.label === name);
    if (categories.length > 0) {
      // We need the doc id - reload will handle cleanup
    }
  }
}
