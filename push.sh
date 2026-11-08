#!/usr/bin/env bash

# CashFlow Pro — Automatic Git Push Script
set -e

MSG=${1:-"Update: $(date +'%Y-%m-%d %H:%M:%S')"}

echo "🚀 [CashFlow] Preparing to push changes..."
git add .

if git diff --cached --quiet; then
  echo "ℹ️  No changes to commit."
else
  echo "📝 Committing with message: '$MSG'"
  git commit -m "$MSG"
fi

BRANCH=$(git rev-parse --abbrev-ref HEAD)
echo "⬆️  Pushing to origin/$BRANCH..."
git push origin "$BRANCH"

echo "✅ [CashFlow] Successfully pushed to GitHub!"
