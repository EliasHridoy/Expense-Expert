#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────────────────────
# post-create.sh — runs once after the container is created
# ──────────────────────────────────────────────────────────────────────────────
set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  🚀  Expense Expert Flutter — Post-Create Setup"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# ── 1. Flutter SDK sanity check ────────────────────────────────────────────────
echo ""
echo "▸ Flutter version:"
flutter --version

# ── 2. Accept Android licenses (non-interactive) ──────────────────────────────
echo ""
echo "▸ Accepting Android SDK licenses..."
yes | flutter doctor --android-licenses 2>/dev/null || true

# ── 3. Disable Flutter analytics inside container ─────────────────────────────
flutter config --no-analytics
flutter config --no-cli-animations

# ── 4. If the Flutter project already exists, get dependencies ─────────────────
if [ -f "/workspace/pubspec.yaml" ]; then
  echo ""
  echo "▸ Flutter project detected — running flutter pub get..."
  cd /workspace && flutter pub get
else
  echo ""
  echo "ℹ  No pubspec.yaml found yet. Run 'flutter create .' to init the project."
fi

# ── 5. FlutterFire CLI (needed for Firebase setup) ────────────────────────────
echo ""
echo "▸ Installing FlutterFire CLI..."
dart pub global activate flutterfire_cli

# ── 6. Add dart pub global bin to PATH persistently ───────────────────────────
PROFILE_FILE="/home/vscode/.bashrc"
if ! grep -q 'pub-cache/bin' "$PROFILE_FILE"; then
  echo 'export PATH="$HOME/.pub-cache/bin:$PATH"' >> "$PROFILE_FILE"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ✅  Setup complete! Run 'flutter doctor' to verify."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
