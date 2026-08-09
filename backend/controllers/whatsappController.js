const { pool } = require('../config/database');
const { asyncHandler } = require('../middleware');

/**
 * Envío de confirmaciones y recordatorios de cita por WhatsApp vía YCloud.
 *
 * La configuración (API key, número emisor, plantillas) se guarda por
 * consultorio en consultorios.configuracion.whatsapp — editable desde
 * Perfil > Administración > WhatsApp (solo admin, PUT /api/consultorio/whatsapp).
 *
 * Como respaldo, si un consultorio no tiene configuración propia se usan
 * las variables de entorno del backend (útil para una instalación de un
 * solo consultorio): YCLOUD_API_KEY, YCLOUD_WHATSAPP_FROM,
 * WHATSAPP_PREFIJO_PAIS, YCLOUD_TEMPLATE_CONFIRMACION,
 * YCLOUD_TEMPLATE_RECORDATORIO, YCLOUD_TEMPLATE_LANG.
 *
 * Si hay plantilla configurada se envía como plantilla (obligatorio para
 * iniciar conversación fuera de la ventana de 24 h de WhatsApp) con las
 * variables {{1}}=paciente, {{2}}=fecha, {{3}}=hora, {{4}}=doctor.
 * Sin plantilla se envía texto libre (solo funciona dentro de la ventana
 * de 24 h desde el último mensaje del paciente).
 */

const YCLOUD_URL = 'https://api.ycloud.com/v2/whatsapp/messages/sendDirectly';

// Obtiene la configuración de WhatsApp del consultorio, con respaldo en .env
const obtenerConfigWhatsapp = async (consultorioId) => {
  const [rows] = await pool.query(
    'SELECT configuracion FROM consultorios WHERE id = ?',
    [consultorioId]
  );

  let whatsapp = {};
  if (rows[0]?.configuracion) {
    const configuracion = typeof rows[0].configuracion === 'string'
      ? JSON.parse(rows[0].configuracion)
      : rows[0].configuracion;
    whatsapp = configuracion.whatsapp || {};
  }

  return {
    apiKey: whatsapp.ycloud_api_key || process.env.YCLOUD_API_KEY || '',
    from: whatsapp.ycloud_whatsapp_from || process.env.YCLOUD_WHATSAPP_FROM || '',
    prefijoPais: whatsapp.prefijo_pais || process.env.WHATSAPP_PREFIJO_PAIS || '+52',
    templateConfirmacion: whatsapp.template_confirmacion || process.env.YCLOUD_TEMPLATE_CONFIRMACION || '',
    templateRecordatorio: whatsapp.template_recordatorio || process.env.YCLOUD_TEMPLATE_RECORDATORIO || '',
    templateLang: whatsapp.template_lang || process.env.YCLOUD_TEMPLATE_LANG || 'es_MX'
  };
};

// Normaliza un teléfono a formato E.164 (usa el prefijo de país configurado para números de 10 dígitos)
const normalizarTelefono = (telefono, prefijoPais = '+52') => {
  const soloDigitos = String(telefono || '').replace(/\D/g, '');

  if (!soloDigitos) return null;
  if (String(telefono).trim().startsWith('+')) return `+${soloDigitos}`;
  if (soloDigitos.length === 10) return `${prefijoPais}${soloDigitos}`;
  return `+${soloDigitos}`;
};

const formatearFecha = (fecha) => {
  const d = fecha instanceof Date ? fecha : new Date(`${String(fecha).substring(0, 10)}T12:00:00`);
  return d.toLocaleDateString('es-MX', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
};

// Textos de los mensajes por tipo
const construirMensaje = (tipo, datos) => {
  const { paciente, consultorio, fecha, hora, doctor } = datos;

  if (tipo === 'confirmacion') {
    return `Hola ${paciente} 👋\n\n` +
      `Tu cita en *${consultorio}* ha sido agendada:\n\n` +
      `📅 Fecha: ${fecha}\n` +
      `🕐 Hora: ${hora}\n` +
      `👨‍⚕️ Atiende: ${doctor}\n\n` +
      `Por favor responde *SÍ* para confirmar tu asistencia. ` +
      `Si necesitas reprogramar, contáctanos por este medio.`;
  }

  // recordatorio
  return `Hola ${paciente} 👋\n\n` +
    `Te recordamos tu próxima cita en *${consultorio}*:\n\n` +
    `📅 Fecha: ${fecha}\n` +
    `🕐 Hora: ${hora}\n` +
    `👨‍⚕️ Atiende: ${doctor}\n\n` +
    `Por favor responde *SÍ* para confirmar tu asistencia, ` +
    `o *NO* si necesitas reprogramar.`;
};

// Llama al API de YCloud. Devuelve la respuesta o lanza error con mensaje claro.
const enviarYCloud = async (config, to, tipo, datos, mensajeTexto) => {
  if (!config.apiKey || !config.from) {
    const err = new Error('WhatsApp no está configurado para este consultorio. Ve a Perfil > Administración > WhatsApp para configurarlo.');
    err.statusCode = 503;
    throw err;
  }

  const templateName = tipo === 'confirmacion' ? config.templateConfirmacion : config.templateRecordatorio;

  const payload = { from: config.from, to };

  if (templateName) {
    payload.type = 'template';
    payload.template = {
      name: templateName,
      language: { code: config.templateLang },
      components: [
        {
          type: 'body',
          parameters: [
            { type: 'text', text: datos.paciente },
            { type: 'text', text: datos.fecha },
            { type: 'text', text: datos.hora },
            { type: 'text', text: datos.doctor }
          ]
        }
      ]
    };
  } else {
    payload.type = 'text';
    payload.text = { body: mensajeTexto };
  }

  const response = await fetch(YCLOUD_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': config.apiKey
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const detalle = data?.error?.message || data?.message || `YCloud respondió ${response.status}`;
    const err = new Error(`No se pudo enviar el WhatsApp: ${detalle}`);
    err.statusCode = 502;
    throw err;
  }

  return data;
};

// Obtiene los datos de la cita necesarios para el mensaje (filtrado por consultorio)
const obtenerDatosCita = async (uuid, consultorioId) => {
  const [citas] = await pool.query(
    `SELECT c.id, c.fecha, c.hora_inicio, c.estado,
            p.id as paciente_id, p.nombre as paciente_nombre, p.apellidos as paciente_apellidos,
            p.telefono as paciente_telefono,
            u.nombre as doctor_nombre, u.apellidos as doctor_apellidos,
            co.nombre as consultorio_nombre
     FROM citas c
     JOIN pacientes p ON c.paciente_id = p.id
     JOIN usuarios u ON c.doctor_id = u.id
     JOIN consultorios co ON c.consultorio_id = co.id
     WHERE c.uuid = ? AND c.consultorio_id = ?`,
    [uuid, consultorioId]
  );
  return citas[0] || null;
};

// Registra el envío (tolera que la migración add_whatsapp_mensajes.sql no esté aplicada)
const registrarEnvio = async (registro) => {
  try {
    await pool.query(
      `INSERT INTO whatsapp_mensajes
       (consultorio_id, cita_id, paciente_id, tipo, telefono, mensaje, ycloud_id, estado, error, enviado_por)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [registro.consultorio_id, registro.cita_id, registro.paciente_id, registro.tipo,
       registro.telefono, registro.mensaje, registro.ycloud_id || null,
       registro.estado, registro.error || null, registro.enviado_por || null]
    );
  } catch (err) {
    if (err.code === 'ER_NO_SUCH_TABLE') {
      console.warn('Tabla whatsapp_mensajes no existe. Aplica la migración: backend/database/add_whatsapp_mensajes.sql');
    } else {
      console.error('Error registrando envío de WhatsApp:', err.message);
    }
  }
};

/**
 * Enviar mensaje de WhatsApp para una cita
 * POST /api/whatsapp/citas/:uuid/confirmacion
 * POST /api/whatsapp/citas/:uuid/recordatorio
 */
const enviarMensajeCita = (tipo) => asyncHandler(async (req, res) => {
  const { uuid } = req.params;

  const cita = await obtenerDatosCita(uuid, req.consultorioId);

  if (!cita) {
    return res.status(404).json({ success: false, message: 'Cita no encontrada' });
  }

  const config = await obtenerConfigWhatsapp(req.consultorioId);
  const telefono = normalizarTelefono(cita.paciente_telefono, config.prefijoPais);
  if (!telefono) {
    return res.status(400).json({
      success: false,
      message: 'El paciente no tiene teléfono registrado'
    });
  }

  const datos = {
    paciente: `${cita.paciente_nombre} ${cita.paciente_apellidos || ''}`.trim(),
    consultorio: cita.consultorio_nombre,
    fecha: formatearFecha(cita.fecha),
    hora: String(cita.hora_inicio).substring(0, 5),
    doctor: `${cita.doctor_nombre} ${cita.doctor_apellidos || ''}`.trim()
  };

  const mensajeTexto = construirMensaje(tipo, datos);

  try {
    const respuesta = await enviarYCloud(config, telefono, tipo, datos, mensajeTexto);

    await registrarEnvio({
      consultorio_id: req.consultorioId,
      cita_id: cita.id,
      paciente_id: cita.paciente_id,
      tipo,
      telefono,
      mensaje: mensajeTexto,
      ycloud_id: respuesta.id || null,
      estado: 'enviado',
      enviado_por: req.userId
    });

    res.json({
      success: true,
      message: tipo === 'confirmacion'
        ? 'Confirmación enviada por WhatsApp'
        : 'Recordatorio de asistencia enviado por WhatsApp',
      data: { telefono, ycloud_id: respuesta.id || null }
    });
  } catch (err) {
    // Registrar el intento fallido para auditoría
    await registrarEnvio({
      consultorio_id: req.consultorioId,
      cita_id: cita.id,
      paciente_id: cita.paciente_id,
      tipo,
      telefono,
      mensaje: mensajeTexto,
      estado: 'error',
      error: err.message,
      enviado_por: req.userId
    });

    return res.status(err.statusCode || 502).json({
      success: false,
      message: err.message
    });
  }
});

/**
 * Historial de mensajes de WhatsApp de una cita
 * GET /api/whatsapp/citas/:uuid
 */
const getMensajesCita = asyncHandler(async (req, res) => {
  const { uuid } = req.params;

  const cita = await obtenerDatosCita(uuid, req.consultorioId);
  if (!cita) {
    return res.status(404).json({ success: false, message: 'Cita no encontrada' });
  }

  const config = await obtenerConfigWhatsapp(req.consultorioId);

  let mensajes = [];
  try {
    const [rows] = await pool.query(
      `SELECT m.tipo, m.telefono, m.estado, m.error, m.fecha_envio,
              u.nombre as enviado_por_nombre
       FROM whatsapp_mensajes m
       LEFT JOIN usuarios u ON m.enviado_por = u.id
       WHERE m.cita_id = ? AND m.consultorio_id = ?
       ORDER BY m.fecha_envio DESC`,
      [cita.id, req.consultorioId]
    );
    mensajes = rows;
  } catch (err) {
    if (err.code !== 'ER_NO_SUCH_TABLE') throw err;
  }

  res.json({
    success: true,
    data: {
      configurado: Boolean(config.apiKey && config.from),
      telefono_paciente: normalizarTelefono(cita.paciente_telefono, config.prefijoPais),
      mensajes
    }
  });
});

module.exports = {
  enviarConfirmacion: enviarMensajeCita('confirmacion'),
  enviarRecordatorio: enviarMensajeCita('recordatorio'),
  getMensajesCita
};
