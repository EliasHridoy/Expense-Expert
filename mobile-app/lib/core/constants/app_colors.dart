import 'package:flutter/material.dart';

/// Central color palette for Expense Expert.
/// All widgets must reference these constants — never hardcode colors.
abstract final class AppColors {
  // ── Brand / Primary ──────────────────────────────────────────────────────
  static const Color primary = Color(0xFF6C63FF);       // Indigo-purple
  static const Color primaryLight = Color(0xFF9D97FF);
  static const Color primaryDark = Color(0xFF3D35CC);

  // ── Accent ───────────────────────────────────────────────────────────────
  static const Color accent = Color(0xFF00D4AA);        // Teal-green
  static const Color accentLight = Color(0xFF5FFFDD);
  static const Color accentDark = Color(0xFF009E7F);

  // ── Semantic ─────────────────────────────────────────────────────────────
  static const Color income = Color(0xFF22C55E);        // Green
  static const Color expense = Color(0xFFEF4444);       // Red
  static const Color savings = Color(0xFF3B82F6);       // Blue
  static const Color loan = Color(0xFFF59E0B);          // Amber
  static const Color warning = Color(0xFFF59E0B);
  static const Color error = Color(0xFFEF4444);
  static const Color success = Color(0xFF22C55E);

  // ── Dark Surface ─────────────────────────────────────────────────────────
  static const Color darkBackground = Color(0xFF0F0F1A);
  static const Color darkSurface = Color(0xFF1A1A2E);
  static const Color darkCard = Color(0xFF16213E);
  static const Color darkBorder = Color(0xFF2A2A4A);
  static const Color darkDivider = Color(0xFF252540);

  // ── Light Surface ────────────────────────────────────────────────────────
  static const Color lightBackground = Color(0xFFF8F9FF);
  static const Color lightSurface = Color(0xFFFFFFFF);
  static const Color lightCard = Color(0xFFFFFFFF);
  static const Color lightBorder = Color(0xFFE2E8F0);
  static const Color lightDivider = Color(0xFFF1F5F9);

  // ── Text ─────────────────────────────────────────────────────────────────
  static const Color textPrimaryDark = Color(0xFFF8FAFC);
  static const Color textSecondaryDark = Color(0xFF94A3B8);
  static const Color textMutedDark = Color(0xFF64748B);

  static const Color textPrimaryLight = Color(0xFF0F172A);
  static const Color textSecondaryLight = Color(0xFF475569);
  static const Color textMutedLight = Color(0xFF94A3B8);

  // ── Gradients ────────────────────────────────────────────────────────────
  static const LinearGradient primaryGradient = LinearGradient(
    colors: [primary, Color(0xFF9C8FFF)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient incomeGradient = LinearGradient(
    colors: [Color(0xFF22C55E), Color(0xFF16A34A)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient expenseGradient = LinearGradient(
    colors: [Color(0xFFEF4444), Color(0xFFB91C1C)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient savingsGradient = LinearGradient(
    colors: [Color(0xFF3B82F6), Color(0xFF1D4ED8)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient cardGradientDark = LinearGradient(
    colors: [darkCard, darkSurface],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );
}
