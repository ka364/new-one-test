#!/bin/zsh
set -e

# مكان شغل الوكيل (Agent workspace)
AGENT_TASKS_DIR="/Users/ahmedmohamedshawkyatta/Library/Application Support/flowith-os-beta/data/agent-data/tasks"

# جذر مشروع حاضر
PROJECT_ROOT="$HOME/Library/Mobile Documents/com~apple~CloudDocs/haderos"

# مكان تخزين النسخ داخل المشروع
DEST_ROOT="$PROJECT_ROOT/data/agent_tasks"

echo "🔍 Syncing agent tasks from:"
echo "   $AGENT_TASKS_DIR"
echo "→ into:"
echo "   $DEST_ROOT"
echo ""

mkdir -p "$DEST_ROOT"

# نعدّي على كل مجلد task_*
for task_dir in "$AGENT_TASKS_DIR"/task_*; do
  # لو مفيش، كمل
  [ -d "$task_dir" ] || continue

  task_name="${task_dir:t}"   # في zsh: basename
  dest_dir="$DEST_ROOT/$task_name"

  echo "📁 Task: $task_name"
  mkdir -p "$dest_dir"

  # نستخدم rsync عشان يبقى sync نظيف
  rsync -av \
    --delete \
    --exclude ".DS_Store" \
    --exclude "*.meta.json" \
    --exclude ".preview_index.html" \
    "$task_dir"/ "$dest_dir"/

  echo "   → Snapshot updated at: $dest_dir"
  echo ""
done

echo "✅ Sync complete."
echo "   All agent tasks are mirrored under: $DEST_ROOT"
