#!/usr/bin/env bash
set -euo pipefail

# --- Settings ---
PROJECT_DIR="${1:-.}"
STAMP="$(date +%Y%m%d_%H%M%S)"
BASENAME="$(basename "$(realpath "$PROJECT_DIR")")"
OUT_ZIP="${BASENAME}_dump_${STAMP}.zip"
OUT_TGZ="${BASENAME}_dump_${STAMP}.tar.gz"

# --- Excludes ---
EXCLUDES=(
  "node_modules/*"
  ".git/*"
  "dist/*" "build/*" "out/*"
  ".cache/*" ".vite/*" ".parcel-cache/*" ".turbo/*"
  ".next/*" ".nuxt/*"
  "coverage/*"
  "*.log" "npm-debug.log*" "yarn-error.log*"
  ".DS_Store"
  "*.zip"
)

echo "Packaging project: $PROJECT_DIR"
cd "$PROJECT_DIR"

# Warn about env files (kept by default; uncomment to exclude)
# EXCLUDES+=(".env" ".env.*")

# Prefer zip; fall back to tar.gz
if command -v zip >/dev/null 2>&1; then
  echo "=> Using zip"
  # Build zip exclude args
  EXARGS=()
  for p in "${EXCLUDES[@]}"; do EXARGS+=(-x "$p"); done
  zip -r "../$OUT_ZIP" . "${EXARGS[@]}"
  echo "Created: ../$OUT_ZIP"
  (cd .. && sha256sum "$OUT_ZIP" 2>/dev/null || shasum -a 256 "$OUT_ZIP")
  echo "Preview:"
  (cd .. && unzip -l "$OUT_ZIP" | sed -n '1,20p')
else
  echo "=> zip not found; using tar.gz"
  TAR_EX=()
  for p in "${EXCLUDES[@]}"; do TAR_EX+=(--exclude="$p"); done
  tar -czf "../$OUT_TGZ" "${TAR_EX[@]}" .
  echo "Created: ../$OUT_TGZ"
  (cd .. && sha256sum "$OUT_TGZ" 2>/dev/null || shasum -a 256 "$OUT_TGZ")
  echo "Preview (top entries):"
  (cd .. && tar -tzf "$OUT_TGZ" | head -n 20)
fi

echo "Done."
