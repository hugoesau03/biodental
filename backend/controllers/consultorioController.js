const { pool } = require('../config/database');
const { asyncHandler } = require('../middleware');

/**
 * Prueba una API key de OpenAI con una llamada real y barata (listar
 * modelos, no gasta tokens) antes de guardarla — así el admin sabe de
 * inmediato si la copió mal, en vez de enterarse hasta que el asistente
 * de WhatsApp falle con un paciente real.
 */
const probarOpenAI = async (apiKey) => {
  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: { Authorization: `Bearer ${apiKey}` }
    });
    if (response.ok) return { valido: true };
    const data = await response.json().catch(() => ({}));
    return { valido: false, mensaje: data?.error?.message || `OpenAI respondió ${response.status}` };
  } catch (err) {
    return { valido: false, mensaje: `No se pudo conectar con OpenAI: ${err.message}` };
  }
};

/**
 * Prueba una API key de YCloud listando los números de WhatsApp de la
 * cuenta (llamada de solo lectura, sin efectos secundarios).
 */
const probarYCloud = async (apiKey) => {
  try {
    const response = await fetch('https://api.ycloud.com/v2/whatsapp/phoneNumbers', {
      headers: { 'X-API-Key': apiKey }
    });
    const data = await response.json().catch(() => ({}));
    if (response.ok) {
      return { valido: true, numeros: (data.items || []).map(i => i.phoneNumber) };
    }
    return { valido: false, mensaje: data?.error?.message || data?.message || `YCloud respondió ${response.status}` };
  } catch (err) {
    return { valido: false, mensaje: `No se pudo conectar con YCloud: ${err.message}` };
  }
};

/**
 * Obtener información del consultorio actual
 * GET /api/consultorio
 */
const getConsultorio = asyncHandler(async (req, res) => {
  const [consultorios] = await pool.query(
    `SELECT uuid, nombre, slug, email, telefono, direccion, ciudad, estado,
            codigo_postal, logo_url, logo_blob, sitio_web, configuracion, plan, fecha_registro
     FROM consultorios
     WHERE id = ?`,
    [req.consultorioId]
  );

  if (consultorios.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'Consultorio no encontrado'
    });
  }

  const consultorio = consultorios[0];
  if (typeof consultorio.configuracion === 'string') {
    consultorio.configuracion = JSON.parse(consultorio.configuracion);
  }

  res.json({
    success: true,
    data: consultorio
  });
});

/**
 * Actualizar información del consultorio
 * PUT /api/consultorio
 */
const updateConsultorio = asyncHandler(async (req, res) => {
  const updates = req.body;

  const allowedFields = [
    'nombre', 'email', 'telefono', 'direccion', 'ciudad',
    'estado', 'codigo_postal', 'logo_url', 'logo_blob', 'sitio_web', 'configuracion'
  ];

  const fieldsToUpdate = {};
  for (const field of allowedFields) {
    if (updates[field] !== undefined) {
      if (field === 'configuracion' && typeof updates[field] === 'object') {
        fieldsToUpdate[field] = JSON.stringify(updates[field]);
      } else {
        fieldsToUpdate[field] = updates[field];
      }
    }
  }

  if (Object.keys(fieldsToUpdate).length === 0) {
    return res.status(400).json({
      success: false,
      message: 'No hay campos para actualizar'
    });
  }

  const setClause = Object.keys(fieldsToUpdate).map(f => `${f} = ?`).join(', ');
  const values = [...Object.values(fieldsToUpdate), req.consultorioId];

  await pool.query(
    `UPDATE consultorios SET ${setClause} WHERE id = ?`,
    values
  );

  res.json({
    success: true,
    message: 'Consultorio actualizado exitosamente'
  });
});

/**
 * Obtener configuración de WhatsApp (YCloud) del consultorio
 * GET /api/consultorio/whatsapp
 * Solo admin. La API key nunca se devuelve completa, solo un preview.
 */
const getWhatsappConfig = asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    'SELECT configuracion FROM consultorios WHERE id = ?',
    [req.consultorioId]
  );

  let whatsapp = {};
  if (rows[0]?.configuracion) {
    const configuracion = typeof rows[0].configuracion === 'string'
      ? JSON.parse(rows[0].configuracion)
      : rows[0].configuracion;
    whatsapp = configuracion.whatsapp || {};
  }

  const apiKey = whatsapp.ycloud_api_key || '';
  const webhookSecret = whatsapp.ycloud_webhook_secret || '';

  res.json({
    success: true,
    data: {
      configurado: Boolean(apiKey),
      api_key_preview: apiKey ? `••••${apiKey.slice(-4)}` : null,
      whatsapp_from: whatsapp.ycloud_whatsapp_from || '',
      prefijo_pais: whatsapp.prefijo_pais || '+52',
      template_confirmacion: whatsapp.template_confirmacion || '',
      template_recordatorio: whatsapp.template_recordatorio || '',
      template_lang: whatsapp.template_lang || 'es_MX',
      // Secreto del endpoint de webhook de YCloud (verifica que los mensajes
      // entrantes del asistente de WhatsApp con IA realmente vengan de YCloud).
      webhook_secret_configurado: Boolean(webhookSecret),
      webhook_secret_preview: webhookSecret ? `••••${webhookSecret.slice(-4)}` : null
    }
  });
});

/**
 * Actualizar configuración de WhatsApp (YCloud) del consultorio
 * PUT /api/consultorio/whatsapp
 * Solo admin.
 *
 * La API key solo se sobreescribe si se envía `api_key` con contenido;
 * así el admin puede editar el resto de los campos sin tener que volver
 * a pegar la clave cada vez. Para borrarla explícitamente se envía
 * `clear_api_key: true`.
 */
const updateWhatsappConfig = asyncHandler(async (req, res) => {
  const {
    api_key, clear_api_key, whatsapp_from, prefijo_pais,
    template_confirmacion, template_recordatorio, template_lang,
    webhook_secret, clear_webhook_secret
  } = req.body;

  const [rows] = await pool.query(
    'SELECT configuracion FROM consultorios WHERE id = ?',
    [req.consultorioId]
  );

  let configuracion = {};
  if (rows[0]?.configuracion) {
    configuracion = typeof rows[0].configuracion === 'string'
      ? JSON.parse(rows[0].configuracion)
      : rows[0].configuracion;
  }

  const whatsappActual = configuracion.whatsapp || {};

  let ycloudApiKey = whatsappActual.ycloud_api_key || '';
  let claveProbada = false;
  if (clear_api_key) {
    ycloudApiKey = '';
  } else if (typeof api_key === 'string' && api_key.trim()) {
    const prueba = await probarYCloud(api_key.trim());
    if (!prueba.valido) {
      return res.status(400).json({
        success: false,
        message: `La API Key de YCloud no es válida: ${prueba.mensaje}`
      });
    }
    ycloudApiKey = api_key.trim();
    claveProbada = true;
  }

  let ycloudWebhookSecret = whatsappActual.ycloud_webhook_secret || '';
  if (clear_webhook_secret) {
    ycloudWebhookSecret = '';
  } else if (typeof webhook_secret === 'string' && webhook_secret.trim()) {
    ycloudWebhookSecret = webhook_secret.trim();
  }

  configuracion.whatsapp = {
    ycloud_api_key: ycloudApiKey,
    ycloud_webhook_secret: ycloudWebhookSecret,
    ycloud_whatsapp_from: whatsapp_from !== undefined ? whatsapp_from : (whatsappActual.ycloud_whatsapp_from || ''),
    prefijo_pais: prefijo_pais !== undefined ? prefijo_pais : (whatsappActual.prefijo_pais || '+52'),
    template_confirmacion: template_confirmacion !== undefined ? template_confirmacion : (whatsappActual.template_confirmacion || ''),
    template_recordatorio: template_recordatorio !== undefined ? template_recordatorio : (whatsappActual.template_recordatorio || ''),
    template_lang: template_lang !== undefined ? template_lang : (whatsappActual.template_lang || 'es_MX')
  };

  await pool.query(
    'UPDATE consultorios SET configuracion = ? WHERE id = ?',
    [JSON.stringify(configuracion), req.consultorioId]
  );

  res.json({
    success: true,
    message: claveProbada
      ? 'Clave de YCloud verificada y configuración guardada exitosamente'
      : 'Configuración de WhatsApp actualizada exitosamente'
  });
});

/**
 * Obtener configuración del asistente de WhatsApp con IA (OpenAI)
 * GET /api/consultorio/asistente-whatsapp
 * Solo admin. La API key nunca se devuelve completa, solo un preview
 * (mismo patrón que getWhatsappConfig).
 */
const getAsistenteIAConfig = asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    'SELECT configuracion FROM consultorios WHERE id = ?',
    [req.consultorioId]
  );

  let asistente = {};
  if (rows[0]?.configuracion) {
    const configuracion = typeof rows[0].configuracion === 'string'
      ? JSON.parse(rows[0].configuracion)
      : rows[0].configuracion;
    asistente = configuracion.asistente_ia || {};
  }

  const apiKey = asistente.openai_api_key || '';

  res.json({
    success: true,
    data: {
      configurado: Boolean(apiKey),
      api_key_preview: apiKey ? `••••${apiKey.slice(-4)}` : null,
      modelo: asistente.openai_model || 'gpt-4.1'
    }
  });
});

/**
 * Actualizar configuración del asistente de WhatsApp con IA (OpenAI)
 * PUT /api/consultorio/asistente-whatsapp
 * Solo admin. Mismo patrón que updateWhatsappConfig: la API key solo se
 * sobreescribe si se manda con contenido; para borrarla, clear_api_key.
 */
const updateAsistenteIAConfig = asyncHandler(async (req, res) => {
  const { api_key, clear_api_key, modelo } = req.body;

  const [rows] = await pool.query(
    'SELECT configuracion FROM consultorios WHERE id = ?',
    [req.consultorioId]
  );

  let configuracion = {};
  if (rows[0]?.configuracion) {
    configuracion = typeof rows[0].configuracion === 'string'
      ? JSON.parse(rows[0].configuracion)
      : rows[0].configuracion;
  }

  const asistenteActual = configuracion.asistente_ia || {};

  let openaiApiKey = asistenteActual.openai_api_key || '';
  let claveProbada = false;
  if (clear_api_key) {
    openaiApiKey = '';
  } else if (typeof api_key === 'string' && api_key.trim()) {
    const prueba = await probarOpenAI(api_key.trim());
    if (!prueba.valido) {
      return res.status(400).json({
        success: false,
        message: `La API Key de OpenAI no es válida: ${prueba.mensaje}`
      });
    }
    openaiApiKey = api_key.trim();
    claveProbada = true;
  }

  configuracion.asistente_ia = {
    openai_api_key: openaiApiKey,
    openai_model: modelo !== undefined && modelo.trim() ? modelo.trim() : (asistenteActual.openai_model || 'gpt-4.1')
  };

  await pool.query(
    'UPDATE consultorios SET configuracion = ? WHERE id = ?',
    [JSON.stringify(configuracion), req.consultorioId]
  );

  res.json({
    success: true,
    message: claveProbada
      ? 'Clave de OpenAI verificada y configuración guardada exitosamente'
      : 'Configuración del asistente actualizada exitosamente'
  });
});

/**
 * Credenciales SIN enmascarar para que el propio asistente de WhatsApp
 * (agente Python, whatsapp-agentkit) las consuma en tiempo de ejecución.
 * GET /api/consultorio/asistente-whatsapp/credenciales
 *
 * A diferencia de getWhatsappConfig/getAsistenteIAConfig (admin-only,
 * para la UI), esta ruta solo exige estar autenticado como staff — igual
 * que /api/citas, /api/pacientes, etc., que el agente ya consume con su
 * propia cuenta de servicio (rol recepcionista). No se limita a admin
 * porque el agente nunca inicia sesión como admin.
 */
const getCredencialesAsistente = asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    'SELECT configuracion FROM consultorios WHERE id = ?',
    [req.consultorioId]
  );

  let whatsapp = {};
  let asistente = {};
  if (rows[0]?.configuracion) {
    const configuracion = typeof rows[0].configuracion === 'string'
      ? JSON.parse(rows[0].configuracion)
      : rows[0].configuracion;
    whatsapp = configuracion.whatsapp || {};
    asistente = configuracion.asistente_ia || {};
  }

  res.json({
    success: true,
    data: {
      openai_api_key: asistente.openai_api_key || '',
      openai_model: asistente.openai_model || 'gpt-4.1',
      ycloud_api_key: whatsapp.ycloud_api_key || '',
      ycloud_whatsapp_from: whatsapp.ycloud_whatsapp_from || '',
      ycloud_webhook_secret: whatsapp.ycloud_webhook_secret || '',
      prefijo_pais: whatsapp.prefijo_pais || '+52'
    }
  });
});

/**
 * Obtener estadísticas del consultorio
 * GET /api/consultorio/estadisticas
 */
const getEstadisticas = asyncHandler(async (req, res) => {
  const { desde, hasta } = req.query;

  // Fechas por defecto: último mes
  const fechaHasta = hasta || new Date().toISOString().split('T')[0];
  const fechaDesde = desde || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  // Total pacientes
  const [pacientesCount] = await pool.query(
    'SELECT COUNT(*) as total FROM pacientes WHERE consultorio_id = ? AND activo = TRUE',
    [req.consultorioId]
  );

  // Citas en el período
  const [citasStats] = await pool.query(
    `SELECT 
       COUNT(*) as total_citas,
       SUM(CASE WHEN estado = 'completada' THEN 1 ELSE 0 END) as completadas,
       SUM(CASE WHEN estado = 'cancelada' THEN 1 ELSE 0 END) as canceladas,
       SUM(CASE WHEN estado = 'no_asistio' THEN 1 ELSE 0 END) as no_asistieron
     FROM citas
     WHERE consultorio_id = ? AND fecha BETWEEN ? AND ?`,
    [req.consultorioId, fechaDesde, fechaHasta]
  );

  // Ingresos del período
  const [ingresos] = await pool.query(
    `SELECT 
       SUM(total) as total_ingresos,
       COUNT(*) as total_recibos
     FROM recibos
     WHERE consultorio_id = ? AND estado = 'pagado' 
     AND DATE(fecha_emision) BETWEEN ? AND ?`,
    [req.consultorioId, fechaDesde, fechaHasta]
  );

  // Citas de hoy
  const hoy = new Date().toISOString().split('T')[0];
  const [citasHoy] = await pool.query(
    `SELECT COUNT(*) as total FROM citas 
     WHERE consultorio_id = ? AND fecha = ? AND estado NOT IN ('cancelada')`,
    [req.consultorioId, hoy]
  );

  // Próximas citas (siguiente semana)
  const [proximasCitas] = await pool.query(
    `SELECT c.uuid, c.fecha, c.hora_inicio, c.estado,
            p.nombre as paciente_nombre, p.apellidos as paciente_apellidos,
            u.nombre as doctor_nombre
     FROM citas c
     JOIN pacientes p ON c.paciente_id = p.id
     JOIN usuarios u ON c.doctor_id = u.id
     WHERE c.consultorio_id = ? AND c.fecha >= ? AND c.estado = 'programada'
     ORDER BY c.fecha, c.hora_inicio
     LIMIT 10`,
    [req.consultorioId, hoy]
  );

  // Productos con stock bajo
  const [stockBajo] = await pool.query(
    `SELECT COUNT(*) as total FROM inventario 
     WHERE consultorio_id = ? AND stock <= stock_minimo AND activo = TRUE`,
    [req.consultorioId]
  );

  res.json({
    success: true,
    data: {
      periodo: { desde: fechaDesde, hasta: fechaHasta },
      pacientes: {
        total: pacientesCount[0].total
      },
      citas: {
        total: citasStats[0].total_citas,
        completadas: citasStats[0].completadas,
        canceladas: citasStats[0].canceladas,
        no_asistieron: citasStats[0].no_asistieron,
        hoy: citasHoy[0].total
      },
      ingresos: {
        total: ingresos[0].total_ingresos || 0,
        recibos: ingresos[0].total_recibos
      },
      inventario: {
        stock_bajo: stockBajo[0].total
      },
      proximas_citas: proximasCitas
    }
  });
});

/**
 * Obtener reporte de ingresos
 * GET /api/consultorio/reportes/ingresos
 */
const getReporteIngresos = asyncHandler(async (req, res) => {
  const { desde, hasta, agrupacion = 'dia' } = req.query;

  const fechaHasta = hasta || new Date().toISOString().split('T')[0];
  const fechaDesde = desde || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  let groupBy;
  let selectDate;
  
  switch (agrupacion) {
    case 'mes':
      groupBy = "DATE_FORMAT(fecha_emision, '%Y-%m')";
      selectDate = "DATE_FORMAT(fecha_emision, '%Y-%m') as periodo";
      break;
    case 'semana':
      groupBy = "YEARWEEK(fecha_emision)";
      selectDate = "YEARWEEK(fecha_emision) as periodo";
      break;
    default:
      groupBy = "DATE(fecha_emision)";
      selectDate = "DATE(fecha_emision) as periodo";
  }

  const [ingresos] = await pool.query(
    `SELECT ${selectDate}, SUM(total) as total, COUNT(*) as recibos
     FROM recibos
     WHERE consultorio_id = ? AND estado = 'pagado'
     AND DATE(fecha_emision) BETWEEN ? AND ?
     GROUP BY ${groupBy}
     ORDER BY periodo`,
    [req.consultorioId, fechaDesde, fechaHasta]
  );

  // Por método de pago
  const [porMetodo] = await pool.query(
    `SELECT metodo_pago, SUM(total) as total, COUNT(*) as cantidad
     FROM recibos
     WHERE consultorio_id = ? AND estado = 'pagado'
     AND DATE(fecha_emision) BETWEEN ? AND ?
     GROUP BY metodo_pago`,
    [req.consultorioId, fechaDesde, fechaHasta]
  );

  res.json({
    success: true,
    data: {
      periodo: { desde: fechaDesde, hasta: fechaHasta },
      ingresos_por_periodo: ingresos,
      ingresos_por_metodo: porMetodo
    }
  });
});

module.exports = {
  getConsultorio,
  updateConsultorio,
  getWhatsappConfig,
  updateWhatsappConfig,
  getAsistenteIAConfig,
  updateAsistenteIAConfig,
  getCredencialesAsistente,
  getEstadisticas,
  getReporteIngresos
};
