import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ShoppingListService } from './shopping-list.service';
import { FirestoreService } from './firestore.service';
import { AuthService } from './auth.service';
import { ExpenseService } from './expense.service';
import { ExpenseCategory } from '../models/expense.model';
import { ShoppingListStatus, ShoppingList } from '../models/shopping-list.model';

describe('ShoppingListService', () => {
  let service: ShoppingListService;
  let firestoreServiceSpy: jasmine.SpyObj<FirestoreService>;
  let authServiceSpy: { currentUser: jasmine.Spy };
  let expenseServiceSpy: jasmine.SpyObj<ExpenseService>;

  const mockUser = { uid: 'test-user-123' } as any;

  beforeEach(() => {
    firestoreServiceSpy = jasmine.createSpyObj('FirestoreService', [
      'userPath',
      'getCollection',
      'getDocument',
      'addDocument',
      'updateDocument',
      'deleteDocument',
    ]);
    firestoreServiceSpy.userPath.and.callFake((uid, col) => `users/${uid}/${col}`);

    authServiceSpy = {
      currentUser: jasmine.createSpy('currentUser').and.returnValue(mockUser),
    };

    expenseServiceSpy = jasmine.createSpyObj('ExpenseService', [
      'addExpense',
      'updateExpense',
      'deleteExpense',
    ]);

    TestBed.configureTestingModule({
      providers: [
        ShoppingListService,
        { provide: FirestoreService, useValue: firestoreServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: ExpenseService, useValue: expenseServiceSpy },
      ],
    });

    service = TestBed.inject(ShoppingListService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get all shopping lists ordered by date desc', (done) => {
    const mockLists: ShoppingList[] = [
      {
        id: 'list-1',
        name: 'Groceries',
        category: ExpenseCategory.Food,
        date: new Date(),
        status: ShoppingListStatus.Planned,
        items: [],
        totalAmount: 0,
        expenseId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    firestoreServiceSpy.getCollection.and.returnValue(of(mockLists));

    service.getShoppingLists().subscribe((lists) => {
      expect(lists.length).toBe(1);
      expect(lists[0].name).toBe('Groceries');
      expect(firestoreServiceSpy.getCollection).toHaveBeenCalled();
      done();
    });
  });

  it('should save direct shopping expense and link expenseId', async () => {
    firestoreServiceSpy.addDocument.and.resolveTo('new-shopping-id');
    expenseServiceSpy.addExpense.and.resolveTo('new-expense-id');
    firestoreServiceSpy.updateDocument.and.resolveTo();

    const result = await service.saveDirectShoppingExpense({
      name: 'Supermarket Run',
      category: ExpenseCategory.Food,
      date: new Date(),
      items: [
        { id: '1', name: 'Milk', price: 3.5, checked: true },
        { id: '2', name: 'Bread', price: 2.5, checked: true },
      ],
    });

    expect(result.shoppingListId).toBe('new-shopping-id');
    expect(result.expenseId).toBe('new-expense-id');

    expect(expenseServiceSpy.addExpense).toHaveBeenCalledWith(
      jasmine.objectContaining({
        title: 'Supermarket Run',
        amount: 6,
        category: ExpenseCategory.Food,
        shoppingListId: 'new-shopping-id',
      })
    );

    expect(firestoreServiceSpy.updateDocument).toHaveBeenCalledWith(
      'users/test-user-123/shopping_lists/new-shopping-id',
      { expenseId: 'new-expense-id' }
    );
  });

  it('should complete a planned shopping list and create linked expense', async () => {
    expenseServiceSpy.addExpense.and.resolveTo('expense-456');
    firestoreServiceSpy.updateDocument.and.resolveTo();

    const plannedList: ShoppingList = {
      id: 'list-10',
      name: 'Weekend Grocery',
      category: ExpenseCategory.Food,
      date: new Date(),
      status: ShoppingListStatus.Planned,
      items: [
        { id: '1', name: 'Apples', price: 5, checked: true },
        { id: '2', name: 'Bananas', price: 3, checked: true },
      ],
      totalAmount: 0,
      expenseId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const expenseId = await service.completeShoppingList(plannedList);

    expect(expenseId).toBe('expense-456');
    expect(expenseServiceSpy.addExpense).toHaveBeenCalledWith(
      jasmine.objectContaining({
        title: 'Weekend Grocery',
        amount: 8,
        category: ExpenseCategory.Food,
        shoppingListId: 'list-10',
      })
    );
    expect(firestoreServiceSpy.updateDocument).toHaveBeenCalledWith(
      'users/test-user-123/shopping_lists/list-10',
      jasmine.objectContaining({
        status: ShoppingListStatus.Completed,
        totalAmount: 8,
        expenseId: 'expense-456',
      })
    );
  });

  it('should save direct shopping expense with subcategory and item subcategories', async () => {
    firestoreServiceSpy.addDocument.and.resolveTo('new-shopping-id');
    expenseServiceSpy.addExpense.and.resolveTo('new-expense-id');
    firestoreServiceSpy.updateDocument.and.resolveTo();

    const result = await service.saveDirectShoppingExpense({
      name: 'Supermarket Run',
      category: 'home-expense',
      subcategory: 'Groceries',
      date: new Date(),
      items: [
        { id: '1', name: 'Milk', price: 3.5, checked: true, subcategory: 'Food' },
        { id: '2', name: 'Bleach', price: 4.0, checked: true, subcategory: 'Cleaning' },
      ],
    });

    expect(result.shoppingListId).toBe('new-shopping-id');
    expect(expenseServiceSpy.addExpense).toHaveBeenCalledWith(
      jasmine.objectContaining({
        title: 'Supermarket Run',
        amount: 7.5,
        category: 'home-expense',
        subcategory: 'Groceries',
      })
    );
  });

  it('should cascade delete linked expense when shopping list is deleted', async () => {
    firestoreServiceSpy.deleteDocument.and.resolveTo();

    await service.deleteShoppingList('list-99', 'expense-99');

    expect(firestoreServiceSpy.deleteDocument).toHaveBeenCalledWith(
      'users/test-user-123/shopping_lists/list-99'
    );
    expect(firestoreServiceSpy.deleteDocument).toHaveBeenCalledWith(
      'users/test-user-123/expenses/expense-99'
    );
  });
});
