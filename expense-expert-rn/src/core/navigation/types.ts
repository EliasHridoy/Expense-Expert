export interface NavItem {
  id: string;
  label: string;
  icon: string;
  route: string;
  exact?: boolean;
}

export const MAIN_NAV_ITEMS: NavItem[] = [
  {
    id: 'nav-dashboard',
    label: 'Dashboard',
    icon: '📊',
    route: '/',
    exact: true,
  },
  {
    id: 'nav-expenses',
    label: 'Add Expense',
    icon: '💸',
    route: '/expenses/new',
    exact: false,
  },
  {
    id: 'nav-budgets',
    label: 'Budgets',
    icon: '🎯',
    route: '/budgets',
    exact: false,
  },
  {
    id: 'nav-savings',
    label: 'Savings',
    icon: '🏦',
    route: '/savings',
    exact: false,
  },
  {
    id: 'nav-drafts',
    label: 'Drafts',
    icon: '📋',
    route: '/drafts',
    exact: false,
  },
  {
    id: 'nav-categories',
    label: 'Categories',
    icon: '🏷️',
    route: '/categories',
    exact: false,
  },
  {
    id: 'nav-profile',
    label: 'Profile',
    icon: '👤',
    route: '/profile',
    exact: false,
  },
];
