import { Routes } from '@angular/router';

export const EXPENSES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./expense-list/expense-list.component').then((m) => m.ExpenseListComponent),
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./expense-form/expense-form.component').then((m) => m.ExpenseFormComponent),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./expense-detail/expense-detail.component').then((m) => m.ExpenseDetailComponent),
  },
  {
    path: ':id/edit',
    loadComponent: () =>
      import('./expense-form/expense-form.component').then((m) => m.ExpenseFormComponent),
  },
];
