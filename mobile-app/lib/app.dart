import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'core/providers/theme_provider.dart';
import 'core/router/app_router.dart';
import 'shared/theme/app_theme.dart';
import 'shared/theme/app_theme_dark.dart';

/// Root application widget.
/// Sets up GoRouter, theming (light/dark), and Riverpod consumption.
class ExpenseExpertApp extends ConsumerWidget {
  const ExpenseExpertApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(routerProvider);
    final themeMode = ref.watch(themeModeProvider);

    return MaterialApp.router(
      title: 'Expense Expert',
      debugShowCheckedModeBanner: false,
      themeMode: themeMode,
      theme: appThemeLight,
      darkTheme: appThemeDark,
      routerConfig: router,
    );
  }
}
