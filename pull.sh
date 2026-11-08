#!/usr/bin/env bash

# CashFlow Pro — Automatic Git Pull & Sync Script
set -e

echo "🔄 [CashFlow] Checking repository status..."

# Ensure we're in a git repository
if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "❌ Error: Not inside a git repository."
  exit 1
fi

BRANCH=$(git rev-parse --abbrev-ref HEAD)
echo "📍 Current branch: $BRANCH"

# Check for uncommitted changes
if ! git diff-index --quiet HEAD --; then
  echo "⚠️  You have local uncommitted changes."
  echo "📦 Auto-stashing local changes before pulling..."
  git stash push -m "Auto-stash before pull $(date +'%Y-%m-%d %H:%M:%S')"
  STASHED=1
else
  STASHED=0
fi

echo "⬇️  Pulling latest changes from origin/$BRANCH..."
git pull --rebase origin "$BRANCH"

if [ "$STASHED" -eq 1 ]; then
  echo "📦 Restoring your stashed changes..."
  git stash pop || echo "⚠️  Stash pop had conflicts. Run 'git status' to resolve."
fi

# Check if package.json was modified in the pull
if git diff --name-only HEAD@{1} HEAD 2>/dev/null | grep -q "package.json"; then
  echo "📦 package.json has updated! Running npm install..."
  npm install
fi

echo "✅ [CashFlow] Repository is up to date!"
