import re

with open('expense-expert/src/app/features/expenses/expense-list/expense-list.component.ts', 'r') as f:
    content = f.read()

# 1. Imports
content = content.replace("import { Component, inject, signal, OnInit } from '@angular/core';",
                          "import { Component, inject, signal, computed, OnInit } from '@angular/core';")

content = content.replace("import { TourService } from '../../../core/services/tour.service';",
                          "import { TourService } from '../../../core/services/tour.service';\nimport { FormsModule } from '@angular/forms';")

content = content.replace("imports: [\n    PageHeaderComponent,",
                          "imports: [\n    FormsModule,\n    PageHeaderComponent,")

# 2. Class fields
class_fields_search = """  currentMonth = signal(this.getCurrentMonth());
  expenses = signal<Expense[]>([]);
  isLoading = signal(true);
  totalAmount = signal(0);
  remainingAmount = signal(0);"""

class_fields_replace = """  currentMonth = signal(this.getCurrentMonth());
  expenses = signal<Expense[]>([]);
  isLoading = signal(true);
  totalAmount = signal(0);
  remainingAmount = signal(0);

  viewMode = signal<'list' | 'grid'>('list');
  groupBy = signal<'none' | 'category'>('none');
  sortBy = signal<'date' | 'amount' | 'alpha'>('date');

  processedExpenses = computed(() => {
    let sorted = [...this.expenses()];

    // Sorting
    const sort = this.sortBy();
    if (sort === 'date') {
      sorted.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } else if (sort === 'amount') {
      sorted.sort((a, b) => b.amount - a.amount);
    } else if (sort === 'alpha') {
      sorted.sort((a, b) => a.title.localeCompare(b.title));
    }

    // Grouping
    const group = this.groupBy();
    if (group === 'category') {
      const groupsMap = new Map<string, { name: string; total: number; items: Expense[] }>();
      for (const expense of sorted) {
        if (!groupsMap.has(expense.category)) {
          groupsMap.set(expense.category, { name: expense.category, total: 0, items: [] });
        }
        const g = groupsMap.get(expense.category)!;
        g.items.push(expense);
        g.total += expense.amount;
      }
      return Array.from(groupsMap.values()).sort((a, b) => a.name.localeCompare(b.name));
    } else {
      return [{ name: 'All Expenses', total: this.totalAmount(), items: sorted }];
    }
  });"""

content = content.replace(class_fields_search, class_fields_replace)

with open('expense-expert/src/app/features/expenses/expense-list/expense-list.component.ts', 'w') as f:
    f.write(content)
