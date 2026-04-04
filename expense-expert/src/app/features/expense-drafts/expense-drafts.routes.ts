import { Routes } from '@angular/router';

export const EXPENSE_DRAFTS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./draft-list/draft-list.component').then((m) => m.DraftListComponent),
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./draft-form/draft-form.component').then((m) => m.DraftFormComponent),
  },

  {
    path: ':id',
    loadComponent: () =>
      import('./draft-apply/draft-apply.component').then((m) => m.DraftApplyComponent),
  },
  {
    path: ':id/edit',
    loadComponent: () =>
      import('./draft-form/draft-form.component').then((m) => m.DraftFormComponent),
  },
];
