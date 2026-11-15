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
  id?: string;
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

export const DEFAULT_SUBCATEGORIES: string[] = [
  'Groceries',
  'Food',
  'Dining Out',
  'Snacks & Beverages',
  'Fuel & Gas',
  'Public Transit',
  'Taxi / Rideshare',
  'Vehicle Maintenance',
  'Rent',
  'Electricity',
  'Water',
  'Internet & Phone',
  'Streaming & Entertainment',
  'Cleaning & Laundry',
  'Personal Care & Toiletries',
  'Clothing & Apparel',
  'Healthcare & Medicine',
  'Home Maintenance',
  'Office & Education',
  'Gifts & Donations',
];

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

  allSubcategories = signal<string[]>(DEFAULT_SUBCATEGORIES);

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
          id: c.id,
        }));
        this.allCategories.set([...builtIn, ...custom]);
      });
  }

  async addCategory(name: string, icon: string): Promise<string> {
    const id = await this.firestoreService.addDocument(this.categoriesPath, { name, icon });
    return id;
  }

  async deleteCategory(id: string): Promise<void> {
    if (!id) return;
    await this.firestoreService.deleteDocument(`${this.categoriesPath}/${id}`);
  }

  loadSubcategories(): void {
    const user = this.authService.currentUser();
    if (!user) return;
    try {
      const stored = localStorage.getItem(`ee_subcats_${user.uid}`);
      if (stored) {
        const parsed = JSON.parse(stored) as string[];
        const combined = Array.from(new Set([...DEFAULT_SUBCATEGORIES, ...parsed]));
        this.allSubcategories.set(combined);
      }
    } catch {
      // ignore
    }
  }

  registerSubcategory(name: string): void {
    const trimmed = name?.trim();
    if (!trimmed) return;
    const current = this.allSubcategories();
    const exists = current.some((s) => s.toLowerCase() === trimmed.toLowerCase());
    const updated = exists ? current : [...current, trimmed];
    this.allSubcategories.set(updated);

    const user = this.authService.currentUser();
    if (user) {
      try {
        const customOnly = updated.filter((s) => !DEFAULT_SUBCATEGORIES.includes(s));
        localStorage.setItem(`ee_subcats_${user.uid}`, JSON.stringify(customOnly));
      } catch {
        // ignore
      }
    }
  }
}
