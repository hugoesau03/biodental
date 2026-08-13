#!/usr/bin/env bash
#
# Backup de la base de datos de Biodental corriendo en Docker (servicio
# "mysql" de docker-compose.yml). Genera un dump comprimido con fecha en el
# nombre y borra automáticamente los backups más viejos que RETENTION_DAYS.
#
# Uso:
#   ./scripts/backup-db.sh                        # guarda en ./backups
#   BACKUP_DIR=/otra/ruta ./scripts/backup-db.sh   # guarda en otra carpeta
#   RETENTION_DAYS=30 ./scripts/backup-db.sh       # conserva 30 días en vez de 14
#
# Requiere: el stack de Docker levantado (docker compose up -d) y el .env
# junto a docker-compose.yml (con DB_NAME y DB_ROOT_PASSWORD).
#
# Para automatizarlo con cron, por ejemplo todos los días a las 3am:
#   0 3 * * * cd /ruta/al/repo && ./scripts/backup-db.sh >> ./backups/backup.log 2>&1
#
# En Windows sin WSL, este script corre en Git Bash (el mismo shell que usa
# push.bat de fondo) o se puede invocar vía Programador de Tareas apuntando
# a "C:\Program Files\Git\bin\bash.exe" con este script como argumento.
#
# Importante: los backups locales no reemplazan un backup externo — si el
# disco del servidor se pierde, este directorio se pierde con él. Copia los
# archivos generados aquí a almacenamiento externo (otro servidor, S3, un
# bucket, lo que se tenga) de forma periódica.

set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_DIR"

BACKUP_DIR="${BACKUP_DIR:-$REPO_DIR/backups}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"

mkdir -p "$BACKUP_DIR"

if [ ! -f .env ]; then
  echo "No se encontró .env junto a docker-compose.yml. Cópialo de .env.docker.example y complétalo." >&2
  exit 1
fi

DB_NAME="$(grep -E '^DB_NAME=' .env | head -1 | cut -d '=' -f2-)"
DB_ROOT_PASSWORD="$(grep -E '^DB_ROOT_PASSWORD=' .env | head -1 | cut -d '=' -f2-)"

if [ -z "$DB_NAME" ] || [ -z "$DB_ROOT_PASSWORD" ]; then
  echo "DB_NAME o DB_ROOT_PASSWORD no están definidos en .env" >&2
  exit 1
fi

OUTPUT_FILE="$BACKUP_DIR/biodental_${TIMESTAMP}.sql.gz"

echo "Generando backup de '$DB_NAME' en $OUTPUT_FILE ..."

docker compose exec -T mysql \
  mysqldump -u root -p"$DB_ROOT_PASSWORD" \
  --single-transaction --routines --triggers "$DB_NAME" \
  | gzip > "$OUTPUT_FILE"

SIZE="$(du -h "$OUTPUT_FILE" | cut -f1)"
echo "Backup completado: $OUTPUT_FILE ($SIZE)"

DELETED=$(find "$BACKUP_DIR" -name 'biodental_*.sql.gz' -mtime "+${RETENTION_DAYS}" -print -delete | wc -l)
if [ "$DELETED" -gt 0 ]; then
  echo "Se eliminaron $DELETED backup(s) con más de ${RETENTION_DAYS} días."
fi
