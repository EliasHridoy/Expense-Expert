/// Route name constants for GoRouter.
/// Never use raw strings for navigation — always reference these.
abstract final class RouteNames {
  // ── Auth ────────────────────────────────────────────────────────────────
  static const String login = 'login';
  static const String register = 'register';

  // ── Main Shell ──────────────────────────────────────────────────────────
  static const String dashboard = 'dashboard';
  static const String expenses = 'expenses';
  static const String expenseDetail = 'expenseDetail';
  static const String expenseForm = 'expenseForm';
  static const String drafts = 'drafts';
  static const String draftForm = 'draftForm';
  static const String savings = 'savings';
  static const String loanSummary = 'loanSummary';
  static const String profile = 'profile';
}

/// Route path constants for GoRouter.
abstract final class RoutePaths {
  // ── Auth ────────────────────────────────────────────────────────────────
  static const String login = '/auth/login';
  static const String register = '/auth/register';

  // ── Main Shell ──────────────────────────────────────────────────────────
  static const String dashboard = '/dashboard';
  static const String expenses = '/expenses';
  static const String expenseDetail = '/expenses/:id';
  static const String expenseForm = '/expenses/form';
  static const String drafts = '/drafts';
  static const String draftForm = '/drafts/form';
  static const String savings = '/savings';
  static const String loanSummary = '/savings/loans';
  static const String profile = '/profile';
}
