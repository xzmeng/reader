#!/bin/bash
# Run backend and frontend dev servers in parallel

ROOT=$(cd "$(dirname "$0")" && pwd)

trap 'kill %1 %2 2>/dev/null' EXIT

echo "Starting backend on :8000 ..."
cd "$ROOT/backend" && uvicorn main:app --host 0.0.0.0 --port 8000 --reload &

echo "Starting frontend dev server on :5173 ..."
cd "$ROOT/frontend" && npm run dev &

wait
