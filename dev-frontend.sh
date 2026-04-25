#!/bin/bash
ROOT=$(cd "$(dirname "$0")" && pwd)
cd "$ROOT/frontend"
npm run dev
