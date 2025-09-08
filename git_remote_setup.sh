#!/usr/bin/env bash
set -euo pipefail

# Usage: ./git_remote_setup.sh <REMOTE_URL> [main]
# Example: ./git_remote_setup.sh git@github.com:yourname/puzzlepacks-studio.git

REMOTE_URL="${1:-}"
BRANCH="${2:-main}"

if [ -z "$REMOTE_URL" ]; then
  echo "Provide a remote URL (e.g., git@github.com:user/repo.git)."
  exit 1
fi

if [ ! -d ".git" ]; then
  echo "→ Initializing git repository"
  git init
fi

echo "→ Writing .gitignore if missing"
if [ ! -f ".gitignore" ]; then
  cat > .gitignore <<'EOF'
node_modules/
dist/
build/
.cache/
.next/
.netlify/
.vscode/
.DS_Store
*.log
.env
.env.*
coverage/
tmp/
EOF
fi

echo "→ Staging and committing all files"
git add -A
git commit -m "Initial backup commit" || true

echo "→ Setting default branch: $BRANCH"
git branch -M "$BRANCH" || true

echo "→ Adding remote: origin -> $REMOTE_URL"
if git remote | grep -q '^origin$'; then
  git remote set-url origin "$REMOTE_URL"
else
  git remote add origin "$REMOTE_URL"
fi

echo "→ Pushing to remote"
git push -u origin "$BRANCH"

echo "✓ Remote backup complete."
