# Instrucciones para Aplicar los Cambios del Corte de Caja

## Cambios Realizados

### Backend

1. **Nueva tabla de movimientos externos** (`backend/database/add_movimientos.sql`)
   - Tabla para registrar ingresos y egresos externos a los servicios
   - Incluye campos: tipo, concepto, descripción, monto, método de pago, categoría, etc.

2. **Controlador de movimientos** (`backend/controllers/movimientosController.js`)
   - Registrar movimientos externos (ingresos/egresos)
   - Obtener movimientos con filtros por fecha, tipo, método de pago
   - Actualizar y eliminar movimientos

3. **Rutas de movimientos** (`backend/routes/movimientos.js`)
   - POST `/api/movimientos-externos` - Registrar movimiento
   - GET `/api/movimientos-externos` - Listar movimientos
   - GET `/api/movimientos-externos/:uuid` - Obtener un movimiento
   - PUT `/api/movimientos-externos/:uuid` - Actualizar movimiento
   - DELETE `/api/movimientos-externos/:uuid` - Eliminar movimiento

4. **Modificación en pagosController.js**
   - Se modificó `getPagos` para incluir los servicios de cada recibo
   - Ahora retorna el array `servicios` con los items del recibo

5. **Actualización de rutas** (`backend/routes/index.js`)
   - Se agregó la ruta `/movimientos-externos` al enrutador principal

### Frontend

1. **Servicio API** (`src/services/api.js`)
   - Se agregó `movimientosService` con métodos CRUD para movimientos externos

2. **Página CorteCaja** (`src/pages/CorteCaja.js`)
   - **Tabla de servicios**: Ahora muestra los servicios incluidos en cada recibo
   - **Resumen mejorado**: Incluye ingresos externos, egresos externos y total general
   - **Modal para registrar movimientos**: Botón verde "Registrar Movimiento" que abre un modal
   - **Tabla de movimientos externos**: Muestra todos los ingresos/egresos externos del período
   - **Cálculo de totales**: Los movimientos externos se suman/restan del total según su tipo

## Pasos para Aplicar

### 1. Aplicar los cambios en la base de datos

Ejecuta el siguiente comando desde la raíz del proyecto:

\`\`\`bash
# Opción 1: Desde MySQL directamente
mysql -u root -p drdesk < backend/database/add_movimientos.sql

# Opción 2: Si ya existe la conexión en el backend
# El backend puede ejecutarlo automáticamente al iniciar
\`\`\`

### 2. Reiniciar el servidor backend

\`\`\`bash
cd backend
npm start
# o si usas nodemon:
npm run dev
\`\`\`

### 3. Reiniciar el frontend

\`\`\`bash
# En la raíz del proyecto
npm start
\`\`\`

## Funcionalidades Nuevas

### En el Corte de Caja:

1. **Visualización de servicios en cada pago**
   - Cada fila de la tabla "Detalle de Pagos" ahora muestra los servicios incluidos en el recibo
   - Se muestra: nombre del servicio, cantidad y monto

2. **Registro de movimientos externos**
   - Botón verde "Registrar Movimiento" en la barra de acciones
   - Modal para registrar:
     - Tipo: Ingreso o Egreso
     - Concepto (obligatorio)
     - Descripción (opcional)
     - Categoría (opcional)
     - Monto (obligatorio)
     - Método de pago (efectivo, tarjeta, transferencia, otro)

3. **Tabla de movimientos externos**
   - Se muestra cuando existen movimientos en el período
   - Colores distintivos: verde para ingresos, rojo para egresos
   - Incluye descripción expandida si existe

4. **Resumen mejorado**
   - Total General: Suma de servicios + ingresos externos - egresos externos
   - Desglose detallado en la tarjeta principal
   - Los métodos de pago incluyen movimientos externos

## Notas Importantes

- Los movimientos externos afectan el total por método de pago
- Los egresos se restan del total general
- Los ingresos se suman al total general
- El modal se puede cerrar haciendo clic fuera de él o en la X
- Todos los movimientos quedan registrados con fecha y hora
- Se puede filtrar por rango de fechas como antes

## Verificación

Para verificar que todo funciona correctamente:

1. Accede al Corte de Caja
2. Verifica que aparezca el botón "Registrar Movimiento"
3. Crea un movimiento de prueba (ingreso o egreso)
4. Verifica que aparezca en la tabla de movimientos
5. Verifica que el total general se actualice correctamente
6. Verifica que la tabla de pagos muestre los servicios de cada recibo
