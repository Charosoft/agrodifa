#!/usr/bin/env bash
# Déploiement AGRODIFA sur Alwaysdata.   Usage : ./deploy.sh front | back | all
set -euo pipefail

HOST="agrodifa@ssh-agrodifa.alwaysdata.net"
SITE_URL="https://agrodifa.com"
ROOT="$(cd "$(dirname "$0")" && pwd)"

deploy_front() {
  echo "▶ Frontend : compilation…"
  cd "$ROOT/frontend"
  VITE_API_URL="$SITE_URL" npm run build

  echo "▶ Frontend : envoi…"
  ssh "$HOST" "rm -rf ~/www/agrodifa_new && mkdir -p ~/www/agrodifa_new"
  scp -r dist/. "$HOST:~/www/agrodifa_new/"

  echo "▶ Frontend : mise en ligne (échange des dossiers)…"
  ssh "$HOST" "mkdir -p ~/www/agrodifa && rm -rf ~/www/agrodifa_old && mv ~/www/agrodifa ~/www/agrodifa_old && mv ~/www/agrodifa_new ~/www/agrodifa"
  echo "✅ Frontend en ligne : $SITE_URL   (Ctrl+Maj+R pour vider le cache)"
}

deploy_back() {
  echo "▶ Backend : compilation…"
  cd "$ROOT/backend"
  rm -rf dist
  npm run build

  echo "▶ Backend : envoi…"
  ssh "$HOST" "mkdir -p ~/api && rm -rf ~/api/dist"
  scp -r dist package.json package-lock.json "$HOST:~/api/"
  ssh "$HOST" "cd ~/api && npm ci --omit=dev"

  echo "▶ Backend : redémarrage…"
  # [d]ist : les crochets empêchent la commande de se tuer elle-même
  ssh "$HOST" "pkill -u agrodifa -f '[d]ist/index.js' || true"
  echo "✅ Backend envoyé. Test : $SITE_URL/api/health   (sinon bouton Restart dans l'admin Alwaysdata)"
}

case "${1:-}" in
  front) deploy_front ;;
  back)  deploy_back ;;
  all)   deploy_back; deploy_front ;;
  *)     echo "Usage : ./deploy.sh front | back | all"; exit 1 ;;
esac
