#!/usr/bin/env bash
set -euo pipefail

# Usage: ./backup_project.sh [TARGET_DIR]
# Creates a timestamped tar.gz backup of the current project excluding heavy/derived directories.

TARGET_DIR="${1:-./backups}"
STAMP="$(date +'%Y-%m-%d_%H-%M-%S')"

mkdir -p "$TARGET_DIR"

# Detect project root sanity
if [ ! -f "package.json" ]; then
  echo "package.json not found in the current directory."
  echo "Run this script from your project root."
  exit 1
fi

OUT="$TARGET_DIR/project-backup-$STAMP.tgz"

echo "→ Creating backup: $OUT"
tar \
  --exclude='./node_modules' \
  --exclude='./dist' \
  --exclude='./.next' \
  --exclude='./.cache' \
  --exclude='./.turbo' \
  --exclude='./.pnpm-store' \
  --exclude='./.git' \
  --exclude='./**/*.log' \
  --exclude='./**/.DS_Store' \
  -czf "$OUT" .

echo "✓ Backup written to: $OUT"
