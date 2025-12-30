#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

# venv
if [ ! -d ".venv" ]; then
  python3 -m venv .venv
fi
source .venv/bin/activate

python -m pip install --upgrade pip
python -m pip install -r requirements.txt

# غيّر backend.api.v1.main:app للمسار اللي طلع معاك من rg
python -m uvicorn backend.api.v1.main:app --host 127.0.0.1 --port 8080 --reload
