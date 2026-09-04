import { Routes } from '@angular/router';

export const SHOPPING_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./shopping-list/shopping-list.component').then((m) => m.ShoppingListComponent),
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./shopping-form/shopping-form.component').then((m) => m.ShoppingFormComponent),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./shopping-form/shopping-form.component').then((m) => m.ShoppingFormComponent),
  },
];
