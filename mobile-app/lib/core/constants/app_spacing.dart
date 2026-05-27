import 'package:flutter/material.dart';

/// Spacing and sizing constants for Expense Expert.
/// All layout values must use these — no magic numbers in widgets.
abstract final class AppSpacing {
  // ── Base 8pt grid ───────────────────────────────────────────────────────
  static const double xs = 4.0;
  static const double sm = 8.0;
  static const double md = 12.0;
  static const double base = 16.0;
  static const double lg = 20.0;
  static const double xl = 24.0;
  static const double xl2 = 32.0;
  static const double xl3 = 40.0;
  static const double xl4 = 48.0;
  static const double xl5 = 64.0;

  // ── Common EdgeInsets ────────────────────────────────────────────────────
  static const EdgeInsets paddingXs = EdgeInsets.all(xs);
  static const EdgeInsets paddingSm = EdgeInsets.all(sm);
  static const EdgeInsets paddingMd = EdgeInsets.all(md);
  static const EdgeInsets paddingBase = EdgeInsets.all(base);
  static const EdgeInsets paddingLg = EdgeInsets.all(lg);
  static const EdgeInsets paddingXl = EdgeInsets.all(xl);

  static const EdgeInsets paddingH = EdgeInsets.symmetric(horizontal: base);
  static const EdgeInsets paddingV = EdgeInsets.symmetric(vertical: base);
  static const EdgeInsets paddingPage = EdgeInsets.symmetric(
    horizontal: base,
    vertical: lg,
  );

  static const EdgeInsets paddingCard = EdgeInsets.all(base);
  static const EdgeInsets paddingCardLg = EdgeInsets.all(xl);

  // ── Border Radius ────────────────────────────────────────────────────────
  static const double radiusXs = 4.0;
  static const double radiusSm = 8.0;
  static const double radiusMd = 12.0;
  static const double radiusLg = 16.0;
  static const double radiusXl = 20.0;
  static const double radiusXl2 = 24.0;
  static const double radiusFull = 100.0;

  static const BorderRadius borderRadiusSm =
      BorderRadius.all(Radius.circular(radiusSm));
  static const BorderRadius borderRadiusMd =
      BorderRadius.all(Radius.circular(radiusMd));
  static const BorderRadius borderRadiusLg =
      BorderRadius.all(Radius.circular(radiusLg));
  static const BorderRadius borderRadiusXl =
      BorderRadius.all(Radius.circular(radiusXl));
  static const BorderRadius borderRadiusFull =
      BorderRadius.all(Radius.circular(radiusFull));

  // ── Icon Sizes ───────────────────────────────────────────────────────────
  static const double iconSm = 16.0;
  static const double iconMd = 20.0;
  static const double iconLg = 24.0;
  static const double iconXl = 32.0;
  static const double iconXl2 = 48.0;

  // ── Component Heights ────────────────────────────────────────────────────
  static const double buttonHeight = 52.0;
  static const double buttonHeightSm = 40.0;
  static const double inputHeight = 56.0;
  static const double bottomNavHeight = 72.0;
  static const double appBarHeight = 60.0;
  static const double cardMinHeight = 80.0;
  static const double listItemHeight = 72.0;

  // ── Elevation / Shadow ───────────────────────────────────────────────────
  static const double elevationNone = 0;
  static const double elevationSm = 2;
  static const double elevationMd = 4;
  static const double elevationLg = 8;
  static const double elevationXl = 16;
}
