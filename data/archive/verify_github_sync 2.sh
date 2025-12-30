#!/bin/bash
# Script to verify GitHub sync status

echo "=========================================="
echo "🔍 GitHub Sync Verification"
echo "=========================================="
echo ""

cd /home/ubuntu/haderos-mvp

echo "📊 1. Checking local repository status..."
git status
echo ""

echo "📡 2. Fetching latest from GitHub..."
git fetch origin
echo ""

echo "📈 3. Comparing local vs remote..."
LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse origin/main)

echo "Local commit:  $LOCAL"
echo "Remote commit: $REMOTE"
echo ""

if [ "$LOCAL" = "$REMOTE" ]; then
    echo "✅ SUCCESS! Local and remote are in sync!"
    echo ""
    echo "📦 Latest commit on GitHub:"
    git log -1 --oneline
    echo ""
    echo "📋 All handover documents are now on GitHub:"
    echo "   - HANDOVER_REPORT.md + PDF"
    echo "   - QUICK_START_GUIDE.md + PDF"
    echo "   - PRIORITY_TASKS_FOR_LAUNCH.md + PDF"
    echo "   - HANDOVER_INDEX.md"
    echo "   - GIT_STATUS_REPORT.md"
    echo "   - PROJECT_STRUCTURE.txt"
    echo ""
    echo "🎉 Ready for team handover!"
else
    echo "⚠️  WARNING: Local is ahead of remote!"
    echo ""
    echo "Commits not yet pushed:"
    git log origin/main..HEAD --oneline
    echo ""
    echo "❌ Need to push to GitHub!"
    echo ""
    echo "Run: git push origin main"
fi

echo ""
echo "=========================================="
echo "📊 Repository Statistics"
echo "=========================================="
echo "Total commits: $(git rev-list --count HEAD)"
echo "Contributors: $(git shortlog -sn | wc -l)"
echo "Files tracked: $(git ls-files | wc -l)"
echo "Repository size: $(du -sh . | cut -f1)"
echo ""
