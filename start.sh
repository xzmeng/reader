#!/bin/bash
set -e

ROOT=$(cd "$(dirname "$0")" && pwd)

# Build frontend
echo "Building frontend..."
cd "$ROOT/frontend"
npm run build

# Start backend (serves frontend static files too)
echo "Starting server on http://0.0.0.0:8000"
cd "$ROOT/backend"
uvicorn main:app --host 0.0.0.0 --port 8000
