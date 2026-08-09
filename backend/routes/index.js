const express = require('express');
const router = express.Router();

// Importar todas las rutas
const authRoutes = require('./auth');
const pacientesRoutes = require('./pacientes');
const citasRoutes = require('./citas');
const serviciosRoutes = require('./servicios');
const usuariosRoutes = require('./usuarios');
const inventarioRoutes = require('./inventario');
const recibosRoutes = require('./recibos');
const pagosRoutes = require('./pagos');
const horariosRoutes = require('./horarios');
const formulariosRoutes = require('./formularios');
const consultorioRoutes = require('./consultorio');
const notificacionesRoutes = require('./notificaciones');
const consultoriosInternosRoutes = require('./consultoriosInternos');
const movimientosRoutes = require('./movimientos');
const whatsappRoutes = require('./whatsapp');
const recetasRoutes = require('./recetas');
const presupuestosRoutes = require('./presupuestos');
const googleCalendarRoutes = require('./googleCalendar');
const portalRoutes = require('./portal');
const promocionesRoutes = require('./promociones');

// Montar rutas
router.use('/auth', authRoutes);
router.use('/pacientes', pacientesRoutes);
router.use('/citas', citasRoutes);
router.use('/servicios', serviciosRoutes);
router.use('/usuarios', usuariosRoutes);
router.use('/inventario', inventarioRoutes);
router.use('/recibos', recibosRoutes);
router.use('/pagos', pagosRoutes);
router.use('/horarios', horariosRoutes);
router.use('/formularios', formulariosRoutes);
router.use('/consultorio', consultorioRoutes);
router.use('/notificaciones', notificacionesRoutes);
router.use('/consultorios-internos', consultoriosInternosRoutes);
router.use('/movimientos-externos', movimientosRoutes);
router.use('/whatsapp', whatsappRoutes);
router.use('/recetas', recetasRoutes);
router.use('/presupuestos', presupuestosRoutes);
router.use('/google-calendar', googleCalendarRoutes);
router.use('/portal', portalRoutes);
router.use('/promociones', promocionesRoutes);

// Ruta de health check
router.get('/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Biodental API funcionando correctamente',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
