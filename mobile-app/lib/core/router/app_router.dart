import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../features/auth/login_screen.dart';
import '../../features/auth/register_screen.dart';
import '../providers/auth_provider.dart';
import 'route_names.dart';

// ── Placeholder screens for other sections (replaced in later phases) ─────────

class _PlaceholderScreen extends StatelessWidget {
  const _PlaceholderScreen({required this.title, required this.icon});

  final String title;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 64, color: theme.colorScheme.primary),
            const SizedBox(height: 16),
            Text(title, style: theme.textTheme.headlineMedium),
            const SizedBox(height: 8),
            Text(
              'Coming in Phase 2+',
              style: theme.textTheme.bodyMedium?.copyWith(
                color: theme.colorScheme.onSurface.withValues(alpha: 0.5),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Router provider ─────────────────────────────────────────────────────────

final routerProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authStateProvider);

  return GoRouter(
    initialLocation: RoutePaths.login,
    debugLogDiagnostics: true,
    redirect: (context, state) {
      final isAuthenticated = authState.valueOrNull != null;
      final isAuthRoute = state.matchedLocation.startsWith('/auth');

      if (!isAuthenticated && !isAuthRoute) return RoutePaths.login;
      if (isAuthenticated && isAuthRoute) return RoutePaths.dashboard;
      return null;
    },
    routes: [
      // ── Auth ─────────────────────────────────────────────────────────────
      GoRoute(
        path: RoutePaths.login,
        name: RouteNames.login,
        builder: (context, state) => const LoginScreen(),
      ),
      GoRoute(
        path: RoutePaths.register,
        name: RouteNames.register,
        builder: (context, state) => const RegisterScreen(),
      ),

      // ── Main Shell ────────────────────────────────────────────────────────
      GoRoute(
        path: RoutePaths.dashboard,
        name: RouteNames.dashboard,
        builder: (context, state) => const _PlaceholderScreen(
          title: 'Dashboard',
          icon: Icons.dashboard_rounded,
        ),
      ),
      GoRoute(
        path: RoutePaths.expenses,
        name: RouteNames.expenses,
        builder: (context, state) => const _PlaceholderScreen(
          title: 'Expenses',
          icon: Icons.receipt_long_rounded,
        ),
      ),
      GoRoute(
        path: RoutePaths.drafts,
        name: RouteNames.drafts,
        builder: (context, state) => const _PlaceholderScreen(
          title: 'Drafts',
          icon: Icons.edit_note_rounded,
        ),
      ),
      GoRoute(
        path: RoutePaths.savings,
        name: RouteNames.savings,
        builder: (context, state) => const _PlaceholderScreen(
          title: 'Savings',
          icon: Icons.savings_rounded,
        ),
      ),
      GoRoute(
        path: RoutePaths.profile,
        name: RouteNames.profile,
        builder: (context, state) => const _PlaceholderScreen(
          title: 'Profile',
          icon: Icons.person_rounded,
        ),
      ),
    ],
    errorBuilder: (context, state) => Scaffold(
      body: Center(
        child: Text('Route not found: ${state.matchedLocation}'),
      ),
    ),
  );
});
