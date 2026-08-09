#!/bin/bash

# Script para aplicar la migración de movimientos externos
# Uso: ./migrate_movimientos.sh

echo "=================================================="
echo "Aplicando migración: Movimientos Externos"
echo "=================================================="

# Verificar si el archivo SQL existe
if [ ! -f "backend/database/add_movimientos.sql" ]; then
    echo "❌ Error: No se encuentra el archivo backend/database/add_movimientos.sql"
    exit 1
fi

# Solicitar credenciales de MySQL
read -p "Usuario de MySQL (default: root): " MYSQL_USER
MYSQL_USER=${MYSQL_USER:-root}

read -p "Base de datos (default: drdesk): " DATABASE
DATABASE=${DATABASE:-drdesk}

echo ""
echo "Aplicando migración a la base de datos '$DATABASE'..."

# Ejecutar la migración
mysql -u "$MYSQL_USER" -p "$DATABASE" < backend/database/add_movimientos.sql

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Migración aplicada exitosamente!"
    echo ""
    echo "Tabla creada: movimientos_externos"
    echo ""
    echo "Ahora puedes:"
    echo "1. Reiniciar el servidor backend: cd backend && npm start"
    echo "2. Acceder al Corte de Caja y usar la nueva funcionalidad"
else
    echo ""
    echo "❌ Error al aplicar la migración"
    exit 1
fi
