const { pool } = require('../config/database');
const { asyncHandler } = require('../middleware');
const { sincronizarDesdeGoogle } = require('./googleCalendarController');

// Throttle en memoria para no llamar a Google en cada consulta de
// disponibilidad/bloqueos: como máximo una sincronización cada 2 minutos
// por doctor. Fire-and-forget: la respuesta actual no espera el resultado,
// solo se benefician las consultas siguientes de datos más frescos.
const ultimoSyncDisparado = new Map();
const SYNC_THROTTLE_MS = 2 * 60 * 1000;

const dispararSyncSiNecesario = (doctorId) => {
  const ahora = Date.now();
  const ultimo = ultimoSyncDisparado.get(doctorId) || 0;
  if (ahora - ultimo < SYNC_THROTTLE_MS) return;

  ultimoSyncDisparado.set(doctorId, ahora);
  sincronizarDesdeGoogle(doctorId).catch(() => {});
};

/**
 * Obtener horarios de un doctor
 * GET /api/horarios/:doctor_uuid
 */
const getHorarios = asyncHandler(async (req, res) => {
  const { doctor_uuid } = req.params;

  const [horarios] = await pool.query(
    `SELECT h.id, h.dia_semana, h.hora_inicio, h.hora_fin, h.intervalo_minutos, h.activo
     FROM horarios_doctor h
     JOIN usuarios u ON h.doctor_id = u.id
     WHERE u.uuid = ? AND u.consultorio_id = ?
     ORDER BY h.dia_semana`,
    [doctor_uuid, req.consultorioId]
  );

  res.json({
    success: true,
    data: { horarios }
  });
});

/**
 * Establecer horarios de un doctor
 * POST /api/horarios/:doctor_uuid
 */
const setHorarios = asyncHandler(async (req, res) => {
  const { doctor_uuid } = req.params;
  const { horarios } = req.body;

  if (!horarios || !Array.isArray(horarios)) {
    return res.status(400).json({
      success: false,
      message: 'Se requiere un array de horarios'
    });
  }

  // Obtener doctor ID
  const [doctores] = await pool.query(
    'SELECT id FROM usuarios WHERE uuid = ? AND consultorio_id = ?',
    [doctor_uuid, req.consultorioId]
  );

  if (doctores.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'Doctor no encontrado'
    });
  }

  const doctorId = doctores[0].id;
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // Eliminar horarios existentes
    await connection.query(
      'DELETE FROM horarios_doctor WHERE doctor_id = ?',
      [doctorId]
    );

    // Insertar todos los horarios (activos e inactivos)
    for (const horario of horarios) {
      // Convertir activo a boolean de forma flexible (puede venir como true, "true", 1, etc.)
      const isActivo = horario.activo === true || horario.activo === 1 || horario.activo === "true" || horario.activo === "1";
      await connection.query(
        `INSERT INTO horarios_doctor (doctor_id, dia_semana, hora_inicio, hora_fin, intervalo_minutos, activo)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [doctorId, horario.dia_semana, horario.hora_inicio || '09:00', horario.hora_fin || '18:00',
         horario.intervalo_minutos || 30, isActivo ? 1 : 0]
      );
    }

    await connection.commit();

    res.json({
      success: true,
      message: 'Horarios actualizados exitosamente'
    });

  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
});

/**
 * Obtener bloqueos de horario de un doctor
 * GET /api/horarios/:doctor_uuid/bloqueos
 */
const getBloqueos = asyncHandler(async (req, res) => {
  const { doctor_uuid } = req.params;
  const { desde, hasta } = req.query;

  const [doctorRow] = await pool.query(
    'SELECT id FROM usuarios WHERE uuid = ? AND consultorio_id = ?',
    [doctor_uuid, req.consultorioId]
  );
  if (doctorRow.length > 0) dispararSyncSiNecesario(doctorRow[0].id);

  let query = `
    SELECT b.id, b.fecha_inicio, b.fecha_fin, b.motivo, b.todo_el_dia
    FROM bloqueos_horario b
    JOIN usuarios u ON b.doctor_id = u.id
    WHERE u.uuid = ? AND u.consultorio_id = ?
  `;
  const params = [doctor_uuid, req.consultorioId];

  if (desde && hasta) {
    query += ` AND DATE(b.fecha_inicio) <= ? AND DATE(b.fecha_fin) >= ?`;
    params.push(hasta, desde);
  }

  query += ` ORDER BY b.fecha_inicio`;

  const [bloqueos] = await pool.query(query, params);

  res.json({
    success: true,
    data: { bloqueos }
  });
});

/**
 * Crear bloqueo de horario
 * POST /api/horarios/:doctor_uuid/bloqueos
 */
const createBloqueo = asyncHandler(async (req, res) => {
  const { doctor_uuid } = req.params;
  const { fecha_inicio, fecha_fin, motivo, todo_el_dia, cita_uuid } = req.body;

  if (!fecha_inicio || !fecha_fin) {
    return res.status(400).json({
      success: false,
      message: 'Fecha de inicio y fin son requeridas'
    });
  }

  // Validar formato y orden de fechas
  const inicio = new Date(String(fecha_inicio).replace(' ', 'T'));
  const fin = new Date(String(fecha_fin).replace(' ', 'T'));

  if (isNaN(inicio.getTime()) || isNaN(fin.getTime())) {
    return res.status(400).json({
      success: false,
      message: 'Formato de fecha inválido'
    });
  }

  if (fin <= inicio) {
    return res.status(400).json({
      success: false,
      message: 'La fecha de fin debe ser posterior a la fecha de inicio'
    });
  }

  const [doctores] = await pool.query(
    'SELECT id FROM usuarios WHERE uuid = ? AND consultorio_id = ?',
    [doctor_uuid, req.consultorioId]
  );

  if (doctores.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'Doctor no encontrado'
    });
  }

  // Si el bloqueo está asociado a una cita, resolver su id
  // para que se elimine automáticamente al cancelar/reprogramar la cita
  let citaId = null;
  if (cita_uuid) {
    const [citas] = await pool.query(
      'SELECT id FROM citas WHERE uuid = ? AND consultorio_id = ?',
      [cita_uuid, req.consultorioId]
    );
    if (citas.length > 0) {
      citaId = citas[0].id;
    }
  }

  let result;
  try {
    [result] = await pool.query(
      `INSERT INTO bloqueos_horario (doctor_id, cita_id, fecha_inicio, fecha_fin, motivo, todo_el_dia)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [doctores[0].id, citaId, fecha_inicio, fecha_fin, motivo || null, todo_el_dia || false]
    );
  } catch (err) {
    if (err.code === 'ER_BAD_FIELD_ERROR') {
      // Migración add_bloqueo_cita.sql pendiente: insertar sin vínculo a cita
      console.warn('bloqueos_horario.cita_id no existe. Aplica la migración: backend/database/add_bloqueo_cita.sql');
      [result] = await pool.query(
        `INSERT INTO bloqueos_horario (doctor_id, fecha_inicio, fecha_fin, motivo, todo_el_dia)
         VALUES (?, ?, ?, ?, ?)`,
        [doctores[0].id, fecha_inicio, fecha_fin, motivo || null, todo_el_dia || false]
      );
    } else {
      throw err;
    }
  }

  res.status(201).json({
    success: true,
    message: 'Bloqueo creado exitosamente',
    data: { id: result.insertId }
  });
});

/**
 * Eliminar bloqueo de horario
 * DELETE /api/horarios/bloqueos/:id
 */
const deleteBloqueo = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const [result] = await pool.query(
    `DELETE b FROM bloqueos_horario b
     JOIN usuarios u ON b.doctor_id = u.id
     WHERE b.id = ? AND u.consultorio_id = ?`,
    [id, req.consultorioId]
  );

  if (result.affectedRows === 0) {
    return res.status(404).json({
      success: false,
      message: 'Bloqueo no encontrado'
    });
  }

  res.json({
    success: true,
    message: 'Bloqueo eliminado'
  });
});

/**
 * Obtener disponibilidad de un doctor en una fecha
 * GET /api/horarios/:doctor_uuid/disponibilidad
 */
const getDisponibilidad = asyncHandler(async (req, res) => {
  const { doctor_uuid } = req.params;
  const { fecha } = req.query;

  if (!fecha) {
    return res.status(400).json({
      success: false,
      message: 'Fecha es requerida'
    });
  }

  // Obtener doctor
  const [doctores] = await pool.query(
    'SELECT id FROM usuarios WHERE uuid = ? AND consultorio_id = ?',
    [doctor_uuid, req.consultorioId]
  );

  if (doctores.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'Doctor no encontrado'
    });
  }

  const doctorId = doctores[0].id;
  dispararSyncSiNecesario(doctorId);

  // Crear fecha correctamente para evitar problemas de zona horaria
  const [year, month, day] = fecha.split('-').map(Number);
  const fechaLocal = new Date(year, month - 1, day);
  const diaSemana = fechaLocal.getDay();

  // Obtener horarios del doctor.
  // Si no tiene NINGUNO configurado, se usa el horario por defecto
  // (lunes a viernes 09:00-18:00, intervalos de 30 min) — mismo criterio
  // que la validación de citas y el fallback histórico del frontend.
  const [horariosDoctor] = await pool.query(
    `SELECT dia_semana, hora_inicio, hora_fin, intervalo_minutos, activo
     FROM horarios_doctor
     WHERE doctor_id = ?`,
    [doctorId]
  );

  let horario;
  if (horariosDoctor.length === 0) {
    if (diaSemana === 0 || diaSemana === 6) {
      return res.json({
        success: true,
        data: {
          disponible: false,
          mensaje: 'El doctor no trabaja este día',
          slots: []
        }
      });
    }
    horario = { hora_inicio: '09:00', hora_fin: '18:00', intervalo_minutos: 30 };
  } else {
    horario = horariosDoctor.find(
      h => h.dia_semana === diaSemana && (h.activo === 1 || h.activo === true)
    );
    if (!horario) {
      return res.json({
        success: true,
        data: {
          disponible: false,
          mensaje: 'El doctor no trabaja este día',
          slots: []
        }
      });
    }
  }

  // Obtener citas existentes (ignorar citas donde hora_fin = hora_inicio, es decir, slots liberados)
  const [citas] = await pool.query(
    `SELECT hora_inicio, hora_fin FROM citas
     WHERE doctor_id = ? AND fecha = ? 
     AND estado NOT IN ('cancelada', 'no_asistio')
     AND hora_fin > hora_inicio`,
    [doctorId, fecha]
  );

  // Obtener bloqueos
  const [bloqueos] = await pool.query(
    `SELECT fecha_inicio, fecha_fin, todo_el_dia FROM bloqueos_horario
     WHERE doctor_id = ? AND DATE(fecha_inicio) <= ? AND DATE(fecha_fin) >= ?`,
    [doctorId, fecha, fecha]
  );

  // Verificar si todo el día está bloqueado
  const diaBloqueado = bloqueos.some(b => b.todo_el_dia);
  if (diaBloqueado) {
    return res.json({
      success: true,
      data: {
        disponible: false,
        mensaje: 'El día está bloqueado',
        slots: []
      }
    });
  }

  // Generar slots disponibles
  const slots = [];
  let [horaActual, minActual] = String(horario.hora_inicio).split(':').map(Number);
  const [horaFin, minFin] = String(horario.hora_fin).split(':').map(Number);
  const intervalo = horario.intervalo_minutos || 30;

  // Bloqueos parciales (los de día completo ya se manejaron arriba)
  const bloqueosParciales = bloqueos.filter(b => !b.todo_el_dia);
  const ahora = new Date();

  while (horaActual * 60 + minActual < horaFin * 60 + minFin) {
    const horaStr = `${String(horaActual).padStart(2, '0')}:${String(minActual).padStart(2, '0')}`;
    const slotDate = new Date(year, month - 1, day, horaActual, minActual);

    // Verificar si está ocupado por una cita
    const ocupado = citas.some(c => {
      const citaInicio = c.hora_inicio.substring(0, 5);
      const citaFin = c.hora_fin.substring(0, 5);
      return horaStr >= citaInicio && horaStr < citaFin;
    });

    // Verificar si cae dentro de un bloqueo parcial
    // (mysql2 devuelve DATETIME como objetos Date en hora local del servidor)
    const bloqueado = bloqueosParciales.some(b =>
      slotDate >= new Date(b.fecha_inicio) && slotDate < new Date(b.fecha_fin)
    );

    // Las horas que ya pasaron (para el día de hoy) no están disponibles
    const yaPaso = slotDate <= ahora;

    slots.push({
      hora: horaStr,
      disponible: !ocupado && !bloqueado && !yaPaso
    });

    // Siguiente slot
    minActual += intervalo;
    if (minActual >= 60) {
      horaActual += Math.floor(minActual / 60);
      minActual = minActual % 60;
    }
  }

  res.json({
    success: true,
    data: {
      disponible: true,
      horario: {
        inicio: horario.hora_inicio,
        fin: horario.hora_fin,
        intervalo: horario.intervalo_minutos
      },
      slots
    }
  });
});

module.exports = {
  getHorarios,
  setHorarios,
  getBloqueos,
  createBloqueo,
  deleteBloqueo,
  getDisponibilidad
};
