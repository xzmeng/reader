#!/bin/bash
set -e
ROOT=$(cd "$(dirname "$0")" && pwd)

# ── Install CLIs if missing ─────────────────────────────────────────
command -v railway &>/dev/null || npm install -g @railway/cli
command -v vercel  &>/dev/null || npm install -g vercel

# ── Backend → Railway (Singapore) ──────────────────────────────────
echo ""
echo "▶ Backend → Railway (Singapore)..."
cd "$ROOT"

# Link to Railway project if not already linked
railway status &>/dev/null || railway init

railway up --detach

# Create public domain if one doesn't exist yet
railway domain 2>&1 | grep -qE '\.railway\.app' || railway domain

DOMAIN=$(railway domain 2>&1 | grep -oE '[a-zA-Z0-9-]+\.up\.railway\.app' | head -1)
if [ -z "$DOMAIN" ]; then
  echo "Error: could not determine Railway domain. Run 'railway domain' manually."
  exit 1
fi
API_URL="https://${DOMAIN}/api"
echo "  Backend: https://${DOMAIN}"

# ── Frontend → Vercel (global CDN) ─────────────────────────────────
echo ""
echo "▶ Frontend → Vercel (global CDN)..."
cd "$ROOT"

# Point frontend at the Railway API
vercel env rm VITE_API_URL production --yes 2>/dev/null || true
printf '%s' "$API_URL" | vercel env add VITE_API_URL production

vercel --prod --yes

echo ""
echo "✓ Done. Open the Vercel URL above to access the app."
