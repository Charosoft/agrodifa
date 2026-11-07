#!/usr/bin/env bash
# Sauvegarde de la base AGRODIFA (Supabase) sur le disque d'Alwaysdata.
# À lancer chaque nuit par une tâche planifiée. Garde les 14 dernières copies.
set -euo pipefail

ENV_FILE="${BACKUP_ENV:-$HOME/backup/backup.env}"
[ -f "$ENV_FILE" ] || { echo "❌ Fichier de configuration introuvable : $ENV_FILE"; exit 1; }
# shellcheck disable=SC1090
. "$ENV_FILE"
: "${DATABASE_URL:?❌ DATABASE_URL manque dans $ENV_FILE}"

DEST="${BACKUP_DIR:-$HOME/backup/db}"
KEEP="${BACKUP_KEEP:-14}"
mkdir -p "$DEST"

STAMP="$(date +%Y-%m-%d_%H%M%S)"
OUT="$DEST/agrodifa_${STAMP}.sql.gz"
TMP="$OUT.partial"
trap 'rm -f "$TMP"' EXIT   # en cas d'échec, aucun fichier à moitié écrit ne reste

# Données de l'application (schéma public) + comptes utilisateurs (schéma auth).
# On laisse de côté les journaux de connexion, inutiles et volumineux.
pg_dump "$DATABASE_URL" --no-owner --no-privileges \
  --schema=public --schema=auth \
  --exclude-table-data='auth.audit_log_entries' \
  --exclude-table-data='auth.refresh_tokens' \
  --exclude-table-data='auth.sessions' \
  --exclude-table-data='auth.one_time_tokens' \
  --exclude-table-data='auth.flow_state' \
  | gzip -9 > "$TMP"

# Contrôles : archive lisible, pas vide, et contient bien les tables de l'application
gzip -t "$TMP"
[ "$(stat -c %s "$TMP")" -gt 2000 ] || { echo "❌ Sauvegarde anormalement petite : abandon"; exit 1; }
FOUND="$(gzip -dc "$TMP" | grep -c 'CREATE TABLE public.transactions' || true)"
[ "$FOUND" -ge 1 ] || { echo "❌ La table transactions est absente de la sauvegarde : abandon"; exit 1; }

mv "$TMP" "$OUT"
chmod 600 "$OUT"

# Rotation : on garde seulement les $KEEP copies les plus récentes
ls -1t "$DEST"/agrodifa_*.sql.gz 2>/dev/null | tail -n +"$((KEEP + 1))" | while read -r old; do rm -f -- "$old"; done

COUNT="$(ls -1 "$DEST"/agrodifa_*.sql.gz | wc -l)"
echo "✅ $(date '+%Y-%m-%d %H:%M:%S') sauvegarde : $OUT ($(du -h "$OUT" | cut -f1)) ; $COUNT copie(s) conservée(s)"