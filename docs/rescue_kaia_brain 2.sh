#!/bin/zsh
set -e

SOURCE_DIR="/Users/ahmedmohamedshawkyatta/Library/Application Support/flowith-os-beta/data/agent-data/tasks/task_1764533976441_e247ec0a"
DEST_DIR="$HOME/Library/Mobile Documents/com~apple~CloudDocs/haderos/src/KAIA_Operations"

mkdir -p "$DEST_DIR"

cp "$SOURCE_DIR/kaia_knowledge.db" "$DEST_DIR/"
cp "$SOURCE_DIR/governance.html" "$DEST_DIR/"
cp "$SOURCE_DIR/governance_update.log" "$DEST_DIR/"

cp "$SOURCE_DIR/bridge.py" "$DEST_DIR/"
cp "$SOURCE_DIR/ingest_repo.py" "$DEST_DIR/"
cp "$SOURCE_DIR/init_kaia_ethics_kb.py" "$DEST_DIR/"
cp "$SOURCE_DIR/seed_raci_live.py" "$DEST_DIR/"
cp "$SOURCE_DIR/update_governance_raci.py" "$DEST_DIR/"
cp "$SOURCE_DIR/extend_kaia_kb_ops_layer.py" "$DEST_DIR/"

echo "✅ تم نقل العقل والأدوات بنجاح إلى:"
echo "$DEST_DIR"
ls -lh "$DEST_DIR"
