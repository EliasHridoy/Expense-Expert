# Implementation Plan: Hierarchical Expense Categories & Subcategories

## 1. Overview & Objectives
This plan outlines the design and implementation for hierarchical categories in Expense Expert. Users can classify expenses with a primary **Parent Category** (e.g. `Home Expense`) and an optional, flexible **Subcategory** (e.g. `Food`, `Groceries`, `Repairs`), solving multi-classification scenarios without double-counting expense totals.

---

## 2. Key Design Decisions (From Grill-Me Session)
1. **Hierarchical Model (Parent Category & Subcategory)**:
   - The primary category remains the parent entity for budgeting, totals, and high-level charts.
   - Subcategories provide secondary granularity.
2. **Optional Subcategories**:
   - Selecting a parent category is required; selecting a subcategory is optional.
   - Full backward compatibility: all existing expenses function normally without subcategories.
3. **Free-Form Subcategories with Auto-Suggest**:
   - Subcategories are not strictly locked to a single parent.
   - Users can select from previously used subcategories or type new ones on the fly via an auto-suggest combobox.
4. **Shopping Lists Integration**:
   - The shopping list itself belongs to a parent category.
   - Individual items in the shopping list can optionally specify their own subcategory (e.g. Milk -> `Food`, Detergent -> `Cleaning`).
   - Completing a shopping trip logs a single expense under the parent category, while drill-down analytics aggregate item-level subcategories.
5. **Dashboard & Analytics**:
   - Top-level charts display parent categories by default.
   - Expanding or clicking a parent category displays an interactive subcategory drill-down breakdown.

---

## 3. Data Model Changes

### 3.1 `Expense` (`src/app/core/models/expense.model.ts`)
```typescript
export interface Expense {
  id: string;
  title: string;
  description: string;
  amount: number;
  category: ExpenseCategory | string;
  subcategory?: string | null; // <-- NEW
  date: Date;
  month: string;
  isLoan: boolean;
  loanPersonId: string | null;
  loanCleared: boolean;
  loanRepaid: number;
  loanTakenId: string | null;
  draftId: string | null;
  installmentIndex: number | null;
  shoppingListId?: string | null;
  shoppingListName?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateExpenseDto {
  title: string;
  description: string;
  amount: number;
  category: ExpenseCategory | string;
  subcategory?: string | null; // <-- NEW
  date: Date;
  isLoan: boolean;
  loanPersonId: string | null;
  loanTakenId?: string | null;
  draftId?: string | null;
  installmentIndex?: number | null;
  shoppingListId?: string | null;
  shoppingListName?: string | null;
}

export interface UpdateExpenseDto {
  title?: string;
  description?: string;
  amount?: number;
  category?: ExpenseCategory | string;
  subcategory?: string | null; // <-- NEW
  date?: Date;
  isLoan?: boolean;
  loanPersonId?: string | null;
  loanCleared?: boolean;
  shoppingListId?: string | null;
  shoppingListName?: string | null;
}
```

### 3.2 `ShoppingItem` (`src/app/core/models/shopping-list.model.ts`)
```typescript
export interface ShoppingItem {
  id: string;
  name: string;
  quantity?: string;
  price: number;
  checked: boolean;
  subcategory?: string | null; // <-- NEW: Optional item-level subcategory
}
```

---

## 4. Service Layer Updates

### 4.1 Subcategory Auto-Suggest Indexing (`CategoryService`)
- Maintain a reactive signal `recentSubcategories = signal<string[]>([])`.
- Provide helper methods to fetch unique subcategories used across past expenses and shopping items.
- Provide quick-access suggestions filtered by user input.

### 4.2 Dashboard Aggregation & Drill-Down (`DashboardService`)
- Extend category breakdown calculation:
  ```typescript
  export interface SubcategoryBreakdown {
    subcategory: string;
    total: number;
    count: number;
    percentage: number;
  }

  export interface CategoryBreakdownWithSubcategories {
    category: string;
    total: number;
    count: number;
    percentage: number;
    subcategories: SubcategoryBreakdown[];
  }
  ```
- When computing subcategories for an expense:
  - For standard expenses: use `expense.subcategory || 'General'`.
  - For shopping list expenses: query linked shopping items (or inline item breakdown if embedded) to attribute amounts to item-level subcategories.

---

## 5. UI & Component Architecture

### 5.1 New Shared Component: `SubcategoryComboboxComponent`
- Location: `src/app/shared/components/subcategory-combobox/`
- Features:
  - Text input with floating dropdown suggestions.
  - Suggests popular and previously typed subcategories.
  - Allows typing a new custom subcategory and pressing Enter or selecting.
  - Clear button to quickly remove subcategory.
  - Dark mode and responsive mobile support.

### 5.2 Expense Form (`ExpenseFormComponent`)
- Placed directly below the parent category picker.
- Displays label: *"Subcategory (Optional)"*.
- Integrates `app-subcategory-combobox`.

### 5.3 Expense Detail & Expense List
- **List item**: Displays a secondary pill or subtitle badge: `Home Expense • Food`.
- **Search & Filters**: Search bar and category filter support filtering by subcategory name.

### 5.4 Shopping Form & List (`ShoppingFormComponent`)
- On each item row: add an optional, compact subcategory chip/input (e.g. tag icon + text) next to item name & price.
- Quick chips for common grocery/store departments: *Food, Household, Cleaning, Personal Care, Misc*.

### 5.5 Dashboard Drill-down (`MonthlyChartComponent` / `DashboardPageComponent`)
- In Category Breakdown section:
  - Each parent category card/row has an expand arrow `>` if subcategories exist.
  - Expanding displays an accordion with the subcategory breakdown bar chart or progress bars with amounts and percentages.

---

## 6. Implementation Phases

### Phase 1: Models & Data Layer
1. Update `expense.model.ts` and `shopping-list.model.ts` with optional `subcategory`.
2. Update DTOs and Firestore service adapters.

### Phase 2: Subcategory Autocomplete Component & Services
1. Create `SubcategoryComboboxComponent` in `src/app/shared/components/`.
2. Enhance `CategoryService` to load & cache distinct subcategories.

### Phase 3: Forms & Entry Integration
1. Integrate combobox into `ExpenseFormComponent` (create & edit modes).
2. Update `ShoppingFormComponent` to allow adding subcategories to individual shopping items.
3. Ensure shopping completion transfers item subcategories correctly.

### Phase 4: Views & Filtering
1. Update `ExpenseListComponent` and `ExpenseDetailComponent` to display subcategory badges.
2. Add subcategory search filter to the expense list.

### Phase 5: Dashboard Drill-Down Analytics
1. Update `DashboardService` to aggregate subcategory breakdowns per parent category.
2. Add interactive accordion/drill-down UI to dashboard category breakdown.

### Phase 6: Testing & Quality Assurance
1. Verify backward compatibility with existing expenses (no subcategory).
2. Test creation of expenses with and without subcategories.
3. Test shopping list conversion with multiple item subcategories.
4. Run unit and build tests (`ng build`, `npm test`).
