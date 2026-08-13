#!/usr/bin/env bash
#
# Restaura un backup generado por scripts/backup-db.sh dentro del contenedor
# "mysql" de docker-compose.yml. SOBRESCRIBE la base de datos actual — pide
# confirmación antes de continuar.
#
# Uso:
#   ./scripts/restore-db.sh ./backups/biodental_20260810_030000.sql.gz

set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_DIR"

if [ $# -ne 1 ]; then
  echo "Uso: $0 <archivo_backup.sql.gz>" >&2
  exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "$BACKUP_FILE" ]; then
  echo "No existe el archivo: $BACKUP_FILE" >&2
  exit 1
fi

if [ ! -f .env ]; then
  echo "No se encontró .env junto a docker-compose.yml." >&2
  exit 1
fi

DB_NAME="$(grep -E '^DB_NAME=' .env | head -1 | cut -d '=' -f2-)"
DB_ROOT_PASSWORD="$(grep -E '^DB_ROOT_PASSWORD=' .env | head -1 | cut -d '=' -f2-)"

if [ -z "$DB_NAME" ] || [ -z "$DB_ROOT_PASSWORD" ]; then
  echo "DB_NAME o DB_ROOT_PASSWORD no están definidos en .env" >&2
  exit 1
fi

echo "⚠️  Esto va a SOBRESCRIBIR la base de datos '$DB_NAME' con el contenido de:"
echo "    $BACKUP_FILE"
read -r -p "Escribe 'si' para continuar: " CONFIRM
if [ "$CONFIRM" != "si" ]; then
  echo "Cancelado."
  exit 1
fi

echo "Restaurando..."
gunzip -c "$BACKUP_FILE" | docker compose exec -T mysql \
  mysql -u root -p"$DB_ROOT_PASSWORD" "$DB_NAME"

echo "Restauración completada."
