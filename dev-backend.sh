#!/bin/bash
ROOT=$(cd "$(dirname "$0")" && pwd)
cd "$ROOT/backend"
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
