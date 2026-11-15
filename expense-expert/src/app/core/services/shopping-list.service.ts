import { Injectable, inject } from '@angular/core';
import { orderBy } from 'firebase/firestore';
import { Observable } from 'rxjs';
import { FirestoreService } from './firestore.service';
import { AuthService } from './auth.service';
import { ExpenseService } from './expense.service';
import {
  ShoppingList,
  CreateShoppingListDto,
  UpdateShoppingListDto,
  ShoppingListStatus,
  ShoppingItem,
} from '../models/shopping-list.model';
import { ExpenseCategory } from '../models/expense.model';

@Injectable({ providedIn: 'root' })
export class ShoppingListService {
  private firestoreService = inject(FirestoreService);
  private authService = inject(AuthService);
  private expenseService = inject(ExpenseService);

  private get shoppingListsPath(): string {
    return this.firestoreService.userPath(this.authService.currentUser()!.uid, 'shopping_lists');
  }

  getShoppingLists(): Observable<ShoppingList[]> {
    return this.firestoreService.getCollection<ShoppingList>(
      this.shoppingListsPath,
      orderBy('date', 'desc')
    );
  }

  getShoppingListById(id: string): Observable<ShoppingList> {
    return this.firestoreService.getDocument<ShoppingList>(`${this.shoppingListsPath}/${id}`);
  }

  async createShoppingList(dto: CreateShoppingListDto): Promise<string> {
    const totalAmount = dto.totalAmount ?? this.calculateTotal(dto.items);
    return this.firestoreService.addDocument(this.shoppingListsPath, {
      ...dto,
      status: dto.status ?? ShoppingListStatus.Planned,
      totalAmount,
      expenseId: dto.expenseId ?? null,
    });
  }

  /**
   * Quick in-store flow: Creates a completed shopping list and its linked expense simultaneously.
   */
  async saveDirectShoppingExpense(data: {
    name: string;
    category: ExpenseCategory | string;
    subcategory?: string | null;
    date: Date;
    items: ShoppingItem[];
    totalAmount?: number;
  }): Promise<{ shoppingListId: string; expenseId: string }> {
    const totalAmount = data.totalAmount ?? this.calculateTotal(data.items);

    // 1. Create shopping list record first (temporary expenseId null)
    const shoppingListId = await this.firestoreService.addDocument(this.shoppingListsPath, {
      name: data.name,
      category: data.category,
      subcategory: data.subcategory ?? null,
      date: data.date,
      status: ShoppingListStatus.Completed,
      items: data.items,
      totalAmount,
      expenseId: null,
    });

    // 2. Create the linked expense record
    const expenseId = await this.expenseService.addExpense({
      title: data.name,
      description: `Shopping: ${data.items.length} item(s)`,
      amount: totalAmount,
      category: data.category,
      subcategory: data.subcategory ?? null,
      date: data.date,
      isLoan: false,
      loanPersonId: null,
      shoppingListId,
      shoppingListName: data.name,
    });

    // 3. Link back the expenseId to the shopping list
    await this.firestoreService.updateDocument(`${this.shoppingListsPath}/${shoppingListId}`, {
      expenseId,
    });

    return { shoppingListId, expenseId };
  }

  /**
   * Completes an existing planned shopping list and creates the linked expense.
   */
  async completeShoppingList(list: ShoppingList): Promise<string> {
    const totalAmount = this.calculateTotal(list.items);

    const expenseId = await this.expenseService.addExpense({
      title: list.name,
      description: `Shopping: ${list.items.length} item(s)`,
      amount: totalAmount,
      category: list.category,
      subcategory: list.subcategory ?? null,
      date: list.date,
      isLoan: false,
      loanPersonId: null,
      shoppingListId: list.id,
      shoppingListName: list.name,
    });

    await this.firestoreService.updateDocument(`${this.shoppingListsPath}/${list.id}`, {
      status: ShoppingListStatus.Completed,
      totalAmount,
      expenseId,
    });

    return expenseId;
  }

  /**
   * Updates an existing shopping list. If linked to an expense, syncs expense fields as well.
   */
  async updateShoppingList(id: string, dto: UpdateShoppingListDto): Promise<void> {
    const data: Record<string, any> = { ...dto };
    if (dto.items) {
      data['totalAmount'] = dto.totalAmount ?? this.calculateTotal(dto.items);
    }

    await this.firestoreService.updateDocument(`${this.shoppingListsPath}/${id}`, data);

    // If this list is linked to an expense, keep expense in sync
    if (dto.expenseId) {
      const expenseUpdate: Record<string, any> = {};
      if (data['totalAmount'] !== undefined) {
        expenseUpdate['amount'] = data['totalAmount'];
      }
      if (dto.name) {
        expenseUpdate['title'] = dto.name;
        expenseUpdate['shoppingListName'] = dto.name;
      }
      if (dto.category) {
        expenseUpdate['category'] = dto.category;
      }
      if (dto.subcategory !== undefined) {
        expenseUpdate['subcategory'] = dto.subcategory;
      }
      if (dto.date) {
        expenseUpdate['date'] = dto.date;
      }

      if (Object.keys(expenseUpdate).length > 0) {
        await this.expenseService.updateExpense(dto.expenseId, expenseUpdate);
      }
    }
  }

  /**
   * Deletes a shopping list, cascading deletion to the linked expense if one exists.
   */
  async deleteShoppingList(id: string, expenseId?: string | null): Promise<void> {
    await this.firestoreService.deleteDocument(`${this.shoppingListsPath}/${id}`);
    if (expenseId) {
      // Delete the linked expense document directly to prevent infinite cascade loops
      const expensesPath = this.firestoreService.userPath(this.authService.currentUser()!.uid, 'expenses');
      await this.firestoreService.deleteDocument(`${expensesPath}/${expenseId}`);
    }
  }

  /**
   * Quick toggle of an item's checked status during in-store shopping.
   */
  async toggleItemChecked(list: ShoppingList, itemId: string): Promise<void> {
    const updatedItems = list.items.map((item) =>
      item.id === itemId ? { ...item, checked: !item.checked } : item
    );
    await this.firestoreService.updateDocument(`${this.shoppingListsPath}/${list.id}`, {
      items: updatedItems,
    });
  }

  private calculateTotal(items: ShoppingItem[]): number {
    const sum = items.reduce((acc, item) => acc + (Number(item.price) || 0), 0);
    return Math.round(sum * 100) / 100;
  }
}
