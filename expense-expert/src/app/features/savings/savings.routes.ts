import { Routes } from '@angular/router';

export const SAVINGS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./savings-page/savings-page.component').then((m) => m.SavingsPageComponent),
  },
  {
    path: 'accounts/new',
    loadComponent: () =>
      import('./bank-account-form/bank-account-form.component').then(
        (m) => m.BankAccountFormComponent
      ),
  },
  {
    path: 'accounts/:id/edit',
    loadComponent: () =>
      import('./bank-account-form/bank-account-form.component').then(
        (m) => m.BankAccountFormComponent
      ),
  },
  {
    path: 'goals/new',
    loadComponent: () =>
      import('./saving-goal-form/saving-goal-form.component').then(
        (m) => m.SavingGoalFormComponent
      ),
  },
  {
    path: 'goals/:id/edit',
    loadComponent: () =>
      import('./saving-goal-form/saving-goal-form.component').then(
        (m) => m.SavingGoalFormComponent
      ),
  },
  {
    path: 'history',
    loadComponent: () =>
      import('./saving-history/saving-history.component').then((m) => m.SavingHistoryComponent),
  },
  {
    path: 'loans',
    loadComponent: () =>
      import('./loan-summary/loan-summary.component').then((m) => m.LoanSummaryComponent),
  },
];
