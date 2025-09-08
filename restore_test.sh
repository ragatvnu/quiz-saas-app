#!/usr/bin/env bash
set -euo pipefail

# Usage: ./restore_test.sh /path/to/project-backup-*.tgz
# Extracts backup into a temp dir, runs `npm ci` and `npm run build` to verify integrity.

ARCHIVE="${1:-}"
if [ -z "$ARCHIVE" ]; then
  echo "Provide path to backup archive (.tgz)."
  exit 1
fi

if [ ! -f "$ARCHIVE" ]; then
  echo "Archive not found: $ARCHIVE"
  exit 1
fi

TMPDIR="$(mktemp -d -t project-restore-XXXXXX)"
echo "→ Restoring to: $TMPDIR"
tar -xzf "$ARCHIVE" -C "$TMPDIR"

cd "$TMPDIR"
if command -v pnpm >/dev/null 2>&1; then
  PKG_MANAGER=pnpm
elif command -v yarn >/dev/null 2>&1; then
  PKG_MANAGER=yarn
else
  PKG_MANAGER=npm
fi

echo "→ Installing dependencies with $PKG_MANAGER (this may take a while)"
if [ "$PKG_MANAGER" = "npm" ]; then
  npm ci || npm install
elif [ "$PKG_MANAGER" = "yarn" ]; then
  yarn install --frozen-lockfile || yarn install
else
  pnpm install --frozen-lockfile || pnpm install
fi

echo "→ Building project"
if [ -f package.json ]; then
  if grep -q '"build"' package.json; then
    if [ "$PKG_MANAGER" = "npm" ]; then npm run build
    elif [ "$PKG_MANAGER" = "yarn" ]; then yarn build
    else pnpm build; fi
  else
    echo "No build script found; skipping build."
  fi
fi

echo "✓ Restore test complete."
