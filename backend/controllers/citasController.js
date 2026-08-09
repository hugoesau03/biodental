const { v4: uuidv4 } = require('uuid');
const { pool } = require('../config/database');
const { asyncHandler } = require('../middleware');
const { crearNotificacionInterna } = require('./notificacionesController');
const { sincronizarCitaHaciaGoogle } = require('./googleCalendarController');

/**
 * Obtener todas las citas del consultorio
 * GET /api/citas
 */
const getCitas = asyncHandler(async (req, res) => {
  const { fecha, doctor_id, paciente_id, estado, desde, hasta, year, month, page = 1, limit = 500 } = req.query;
  const offset = (page - 1) * limit;

  let query = `
    SELECT c.uuid, c.fecha, c.hora_inicio, c.hora_fin, c.estado, c.tipo,
           c.motivo, c.notas, c.precio_total, c.pagado,
           p.uuid as paciente_uuid, p.nombre as paciente_nombre, 
           p.apellidos as paciente_apellidos, p.telefono as paciente_telefono,
           u.uuid as doctor_uuid, u.nombre as doctor_nombre, 
           u.apellidos as doctor_apellidos, u.especialidad,
           ci.uuid as consultorio_interno_uuid, ci.nombre as consultorio_interno_nombre,
           ci.color as consultorio_interno_color
    FROM citas c
    JOIN pacientes p ON c.paciente_id = p.id
    JOIN usuarios u ON c.doctor_id = u.id
    LEFT JOIN consultorios_internos ci ON c.consultorio_interno_id = ci.id
    WHERE c.consultorio_id = ?
  `;
  const params = [req.consultorioId];

  if (fecha) {
    query += ` AND c.fecha = ?`;
    params.push(fecha);
  }

  // Filtro por año y mes
  if (year && month) {
    query += ` AND YEAR(c.fecha) = ? AND MONTH(c.fecha) = ?`;
    params.push(parseInt(year), parseInt(month));
  }

  if (desde && hasta) {
    query += ` AND c.fecha BETWEEN ? AND ?`;
    params.push(desde, hasta);
  } else if (desde) {
    query += ` AND c.fecha >= ?`;
    params.push(desde);
  } else if (hasta) {
    query += ` AND c.fecha <= ?`;
    params.push(hasta);
  }

  if (doctor_id) {
    query += ` AND u.uuid = ?`;
    params.push(doctor_id);
  }

  if (paciente_id) {
    query += ` AND p.uuid = ?`;
    params.push(paciente_id);
  }

  if (estado) {
    query += ` AND c.estado = ?`;
    params.push(estado);
  }

  query += ` ORDER BY c.fecha, c.hora_inicio LIMIT ? OFFSET ?`;
  params.push(parseInt(limit), offset);

  const [citas] = await pool.query(query, params);

  // Obtener servicios de cada cita
  for (let cita of citas) {
    const [servicios] = await pool.query(
      `SELECT s.uuid, s.nombre, cs.precio, cs.cantidad
       FROM cita_servicios cs
       JOIN servicios s ON cs.servicio_id = s.id
       JOIN citas c ON cs.cita_id = c.id
       WHERE c.uuid = ?`,
      [cita.uuid]
    );
    cita.servicios = servicios;
  }

  res.json({
    success: true,
    data: { citas }
  });
});

/**
 * Obtener una cita por UUID
 * GET /api/citas/:uuid
 */
const getCita = asyncHandler(async (req, res) => {
  const { uuid } = req.params;

  const [citas] = await pool.query(
    `SELECT c.*, 
            p.uuid as paciente_uuid, p.nombre as paciente_nombre, 
            p.apellidos as paciente_apellidos, p.telefono as paciente_telefono,
            p.email as paciente_email,
            u.uuid as doctor_uuid, u.nombre as doctor_nombre, 
            u.apellidos as doctor_apellidos, u.especialidad,
            ci.uuid as consultorio_interno_uuid, ci.nombre as consultorio_interno_nombre,
            ci.color as consultorio_interno_color
     FROM citas c
     JOIN pacientes p ON c.paciente_id = p.id
     JOIN usuarios u ON c.doctor_id = u.id
     LEFT JOIN consultorios_internos ci ON c.consultorio_interno_id = ci.id
     WHERE c.uuid = ? AND c.consultorio_id = ?`,
    [uuid, req.consultorioId]
  );

  if (citas.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'Cita no encontrada'
    });
  }

  // Obtener servicios
  const [servicios] = await pool.query(
    `SELECT s.id, s.uuid, s.nombre, s.duracion_minutos, cs.precio, cs.cantidad
     FROM cita_servicios cs
     JOIN servicios s ON cs.servicio_id = s.id
     WHERE cs.cita_id = (SELECT id FROM citas WHERE uuid = ?)`,
    [uuid]
  );

  res.json({
    success: true,
    data: {
      ...citas[0],
      servicios
    }
  });
});

/**
 * Crear nueva cita
 * POST /api/citas
 */
const createCita = asyncHandler(async (req, res) => {
  const {
    paciente_uuid, doctor_uuid, fecha, hora_inicio, hora_fin,
    tipo, motivo, notas, servicios_uuids, consultorio_interno_uuid,
    permitir_fuera_horario
  } = req.body;

  if (!paciente_uuid || !doctor_uuid || !fecha || !hora_inicio) {
    return res.status(400).json({
      success: false,
      message: 'Paciente, doctor, fecha y hora son requeridos'
    });
  }

  // Validar formato de fecha y horas
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha) || !/^\d{2}:\d{2}(:\d{2})?$/.test(hora_inicio) ||
      (hora_fin && !/^\d{2}:\d{2}(:\d{2})?$/.test(hora_fin))) {
    return res.status(400).json({
      success: false,
      message: 'Formato de fecha u hora inválido'
    });
  }

  // No permitir citas en fechas pasadas (el día de hoy sí se permite)
  if (fecha < formatFechaLocal(new Date())) {
    return res.status(400).json({
      success: false,
      message: 'No se pueden crear citas en fechas pasadas'
    });
  }

  // Obtener IDs
  const [pacientes] = await pool.query(
    'SELECT id FROM pacientes WHERE uuid = ? AND consultorio_id = ?',
    [paciente_uuid, req.consultorioId]
  );

  const [doctores] = await pool.query(
    'SELECT id FROM usuarios WHERE uuid = ? AND consultorio_id = ? AND rol = "doctor"',
    [doctor_uuid, req.consultorioId]
  );

  if (pacientes.length === 0) {
    return res.status(404).json({ success: false, message: 'Paciente no encontrado' });
  }

  if (doctores.length === 0) {
    return res.status(404).json({ success: false, message: 'Doctor no encontrado' });
  }

  const pacienteId = pacientes[0].id;
  const doctorId = doctores[0].id;

  // Obtener ID del consultorio interno si se proporcionó
  let consultorioInternoId = null;
  let consultorioInternoNombre = null;
  if (consultorio_interno_uuid) {
    const [consultoriosInternos] = await pool.query(
      'SELECT id, nombre FROM consultorios_internos WHERE uuid = ? AND consultorio_id = ? AND activo = TRUE',
      [consultorio_interno_uuid, req.consultorioId]
    );
    if (consultoriosInternos.length > 0) {
      consultorioInternoId = consultoriosInternos[0].id;
      consultorioInternoNombre = consultoriosInternos[0].nombre;
    }
  }

  const horaFin = hora_fin || calcularHoraFin(hora_inicio, 30);

  // Toda la validación de disponibilidad ocurre DENTRO de la transacción,
  // con las filas del doctor (y sala) bloqueadas. Dos reservas simultáneas
  // para el mismo doctor se serializan: la segunda espera y ve la cita de
  // la primera, en vez de pasar ambas la validación.
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    await connection.query('SELECT id FROM usuarios WHERE id = ? FOR UPDATE', [doctorId]);
    if (consultorioInternoId) {
      await connection.query('SELECT id FROM consultorios_internos WHERE id = ? FOR UPDATE', [consultorioInternoId]);

      // Disponibilidad de la sala: solapamiento de rangos (no solo hora de inicio).
      // Ignorar citas canceladas/no asistidas y slots liberados (hora_fin = hora_inicio)
      const [conflictosConsultorio] = await connection.query(
        `SELECT c.id, p.nombre as paciente_nombre, p.apellidos as paciente_apellidos
         FROM citas c
         JOIN pacientes p ON c.paciente_id = p.id
         WHERE c.consultorio_interno_id = ?
         AND c.fecha = ?
         AND c.estado NOT IN ('cancelada', 'no_asistio')
         AND c.hora_fin > c.hora_inicio
         AND c.hora_inicio < ? AND c.hora_fin > ?`,
        [consultorioInternoId, fecha, horaFin, hora_inicio]
      );

      if (conflictosConsultorio.length > 0) {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          message: `El consultorio "${consultorioInternoNombre}" no está disponible en ese horario. Ya tiene una cita con ${conflictosConsultorio[0].paciente_nombre} ${conflictosConsultorio[0].paciente_apellidos}.`
        });
      }
    }

    // Disponibilidad del doctor: solapamientos y bloqueos (error duro),
    // horario laboral (advertencia confirmable)
    const disponibilidad = await validarDisponibilidadDoctor(
      doctorId, fecha, hora_inicio, horaFin, null, connection
    );

    if (disponibilidad.error) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: disponibilidad.error
      });
    }

    if (disponibilidad.advertencia && !permitir_fuera_horario) {
      await connection.rollback();
      return res.status(409).json({
        success: false,
        code: 'FUERA_HORARIO',
        message: disponibilidad.advertencia
      });
    }

    const citaUuid = uuidv4();

    const [result] = await connection.query(
      `INSERT INTO citas (consultorio_id, consultorio_interno_id, uuid, paciente_id, doctor_id, fecha, 
                          hora_inicio, hora_fin, tipo, motivo, notas)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.consultorioId, consultorioInternoId, citaUuid, pacienteId, doctorId, fecha, 
       hora_inicio, horaFin, tipo || 'seguimiento', motivo || null, notas || null]
    );

    const citaId = result.insertId;
    let precioTotal = 0;

    // Agregar servicios si se proporcionaron
    if (servicios_uuids && servicios_uuids.length > 0) {
      for (const servicioUuid of servicios_uuids) {
        const [servicios] = await connection.query(
          'SELECT id, precio FROM servicios WHERE uuid = ? AND consultorio_id = ?',
          [servicioUuid, req.consultorioId]
        );

        if (servicios.length > 0) {
          await connection.query(
            'INSERT INTO cita_servicios (cita_id, servicio_id, precio) VALUES (?, ?, ?)',
            [citaId, servicios[0].id, servicios[0].precio]
          );
          precioTotal += parseFloat(servicios[0].precio) || 0;
        }
      }

      // Actualizar precio total
      await connection.query(
        'UPDATE citas SET precio_total = ? WHERE id = ?',
        [precioTotal, citaId]
      );
    }

    await connection.commit();

    // Crear notificación de nueva cita (visible para todo el consultorio)
    try {
      await crearNotificacionInterna(req.consultorioId, {
        usuario_id: null,
        tipo: 'cita',
        titulo: 'Nueva cita programada',
        mensaje: `Cita programada para el ${fecha} a las ${hora_inicio}`,
        icono: 'calendar',
        color: 'primary',
        enlace: `/detalle-cita/${citaUuid}`,
        referencia_tipo: 'cita',
        referencia_uuid: citaUuid
      });
    } catch (notifError) {
      console.error('Error creando notificación:', notifError);
    }

    res.status(201).json({
      success: true,
      message: 'Cita creada exitosamente',
      data: {
        uuid: citaUuid,
        fecha,
        hora_inicio,
        hora_fin: horaFin,
        precio_total: precioTotal
      }
    });

    // Sincronizar con Google Calendar del doctor (si lo tiene conectado).
    // No se espera (fire-and-forget): no debe retrasar la respuesta ni
    // fallar la creación de la cita si Google no responde.
    sincronizarCitaHaciaGoogle(citaId).catch(() => {});

  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
});

/**
 * Actualizar cita
 * PUT /api/citas/:uuid
 */
const updateCita = asyncHandler(async (req, res) => {
  const { uuid } = req.params;
  const updates = req.body;

  const [existing] = await pool.query(
    `SELECT c.id, c.doctor_id, c.fecha, c.hora_inicio, c.hora_fin, c.estado,
            p.nombre as paciente_nombre, p.apellidos as paciente_apellidos
     FROM citas c
     JOIN pacientes p ON c.paciente_id = p.id
     WHERE c.uuid = ? AND c.consultorio_id = ?`,
    [uuid, req.consultorioId]
  );

  if (existing.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'Cita no encontrada'
    });
  }

  const citaId = existing[0].id;
  const citaActual = existing[0];
  const pacienteNombre = `${citaActual.paciente_nombre} ${citaActual.paciente_apellidos || ''}`.trim();

  // Detectar si el CLIENTE está reprogramando (antes de que los ajustes
  // automáticos de completada/no_asistio modifiquen updates.hora_fin)
  const reprogramando = updates.fecha !== undefined ||
    updates.hora_inicio !== undefined ||
    updates.hora_fin !== undefined;

  // Si se está completando la cita, ajustar hora_fin al momento actual
  // para liberar el tiempo restante automáticamente
  if (updates.estado === 'completada' && citaActual.estado !== 'completada') {
    const ahora = new Date();
    const horaActual = `${String(ahora.getHours()).padStart(2, '0')}:${String(ahora.getMinutes()).padStart(2, '0')}`;
    
    // Solo ajustar si la hora actual es antes de la hora_fin programada
    // y después de la hora_inicio (la cita ya empezó)
    const horaFinOriginal = citaActual.hora_fin;
    const horaInicio = citaActual.hora_inicio;
    
    if (horaActual > horaInicio && horaActual < horaFinOriginal) {
      // La cita terminó antes de lo programado, actualizar hora_fin
      updates.hora_fin = horaActual;
      console.log(`Cita ${uuid} completada antes de tiempo. Hora fin ajustada de ${horaFinOriginal} a ${horaActual}`);
    }
  }

  // Si se marca como no_asistio, liberar el horario completamente
  // ajustando hora_fin igual a hora_inicio y eliminando bloqueos asociados
  if (updates.estado === 'no_asistio' && citaActual.estado !== 'no_asistio') {
    updates.hora_fin = citaActual.hora_inicio;
    await eliminarBloqueosDeCita(citaId, citaActual);
  }

  // Si se cancela la cita, eliminar también los bloqueos asociados
  // para que el horario quede libre de nuevo
  if (updates.estado === 'cancelada' && citaActual.estado !== 'cancelada') {
    await eliminarBloqueosDeCita(citaId, citaActual);
  }

  // Si se está reprogramando, validar disponibilidad del nuevo horario
  if (reprogramando && updates.estado !== 'cancelada' && updates.estado !== 'no_asistio') {
    const nuevaFecha = updates.fecha || formatFechaLocal(citaActual.fecha);
    const nuevaHoraInicio = normalizarHora(updates.hora_inicio || citaActual.hora_inicio);

    // Si solo se mueve la hora de inicio, conservar la duración original
    let nuevaHoraFin;
    if (updates.hora_fin !== undefined) {
      nuevaHoraFin = normalizarHora(updates.hora_fin);
    } else if (updates.hora_inicio !== undefined) {
      const [hi, mi] = normalizarHora(citaActual.hora_inicio).split(':').map(Number);
      const [hf, mf] = normalizarHora(citaActual.hora_fin).split(':').map(Number);
      const duracion = Math.max((hf * 60 + mf) - (hi * 60 + mi), 0) || 30;
      nuevaHoraFin = calcularHoraFin(nuevaHoraInicio, duracion);
      updates.hora_fin = nuevaHoraFin;
    } else {
      nuevaHoraFin = normalizarHora(citaActual.hora_fin);
    }

    // El bloqueo asociado cubre el horario viejo: eliminarlo antes de validar
    // para que no rechace el nuevo horario si se traslapa con el anterior
    await eliminarBloqueosDeCita(citaId, citaActual);

    const disponibilidad = await validarDisponibilidadDoctor(
      citaActual.doctor_id, nuevaFecha, nuevaHoraInicio, nuevaHoraFin, citaId
    );

    if (disponibilidad.error) {
      return res.status(400).json({
        success: false,
        message: disponibilidad.error
      });
    }

    // Fuera del horario laboral: requiere confirmación explícita del usuario
    if (disponibilidad.advertencia && !updates.permitir_fuera_horario) {
      return res.status(409).json({
        success: false,
        code: 'FUERA_HORARIO',
        message: disponibilidad.advertencia
      });
    }
  }

  // Si se está actualizando el consultorio interno, verificar disponibilidad
  if (updates.consultorio_interno_uuid) {
    const [consultoriosInternos] = await pool.query(
      'SELECT id, nombre FROM consultorios_internos WHERE uuid = ? AND consultorio_id = ? AND activo = TRUE',
      [updates.consultorio_interno_uuid, req.consultorioId]
    );

    if (consultoriosInternos.length > 0) {
      const consultorioInternoId = consultoriosInternos[0].id;
      const fecha = updates.fecha || existing[0].fecha;
      const horaInicio = updates.hora_inicio || existing[0].hora_inicio;
      const horaFin = updates.hora_fin || existing[0].hora_fin;

      // Verificar disponibilidad del consultorio interno (excluyendo la cita actual)
      const [conflictosConsultorio] = await pool.query(
        `SELECT c.id, p.nombre as paciente_nombre, p.apellidos as paciente_apellidos 
         FROM citas c
         JOIN pacientes p ON c.paciente_id = p.id
         WHERE c.consultorio_interno_id = ? 
         AND c.fecha = ? 
         AND c.id != ?
         AND c.estado NOT IN ('cancelada', 'no_asistio')
         AND ((c.hora_inicio <= ? AND c.hora_fin > ?) OR (c.hora_inicio < ? AND c.hora_fin >= ?) OR (c.hora_inicio >= ? AND c.hora_fin <= ?))`,
        [consultorioInternoId, fecha, citaId, horaInicio, horaInicio, horaFin, horaFin, horaInicio, horaFin]
      );

      if (conflictosConsultorio.length > 0) {
        return res.status(400).json({
          success: false,
          message: `El consultorio "${consultoriosInternos[0].nombre}" no está disponible en ese horario.`
        });
      }

      updates.consultorio_interno_id = consultorioInternoId;
    }
    delete updates.consultorio_interno_uuid;
  }

  const allowedFields = [
    'fecha', 'hora_inicio', 'hora_fin', 'estado', 'tipo',
    'motivo', 'notas', 'notas_medicas', 'receta', 'pagado', 'consultorio_interno_id'
  ];

  const fieldsToUpdate = {};
  for (const field of allowedFields) {
    if (updates[field] !== undefined) {
      fieldsToUpdate[field] = updates[field];
    }
  }

  if (Object.keys(fieldsToUpdate).length > 0) {
    const setClause = Object.keys(fieldsToUpdate).map(f => `${f} = ?`).join(', ');
    const values = [...Object.values(fieldsToUpdate), uuid, req.consultorioId];

    await pool.query(
      `UPDATE citas SET ${setClause} WHERE uuid = ? AND consultorio_id = ?`,
      values
    );
  }

  // Actualizar servicios si se proporcionaron
  if (updates.servicios_uuids !== undefined) {
    // Eliminar servicios anteriores
    await pool.query(
      'DELETE FROM cita_servicios WHERE cita_id = ?',
      [citaId]
    );

    let precioTotal = 0;

    // Agregar nuevos servicios
    if (updates.servicios_uuids && updates.servicios_uuids.length > 0) {
      for (const servicioUuid of updates.servicios_uuids) {
        const [servicios] = await pool.query(
          'SELECT id, precio FROM servicios WHERE uuid = ? AND consultorio_id = ?',
          [servicioUuid, req.consultorioId]
        );

        if (servicios.length > 0) {
          await pool.query(
            'INSERT INTO cita_servicios (cita_id, servicio_id, precio) VALUES (?, ?, ?)',
            [citaId, servicios[0].id, servicios[0].precio]
          );
          precioTotal += parseFloat(servicios[0].precio) || 0;
        }
      }
    }

    // Actualizar precio total de la cita
    await pool.query(
      'UPDATE citas SET precio_total = ? WHERE id = ?',
      [precioTotal, citaId]
    );
    
    // Si existe un recibo para esta cita, actualizarlo también
    try {
      const [recibos] = await pool.query(
        'SELECT id FROM recibos WHERE cita_id = ?',
        [citaId]
      );
      
      if (recibos.length > 0) {
        const reciboId = recibos[0].id;
        
        // Eliminar items de servicio anteriores del recibo
        await pool.query(
          'DELETE FROM recibo_items WHERE recibo_id = ? AND tipo = "servicio"',
          [reciboId]
        );
        
        // Agregar los nuevos servicios al recibo
        let subtotalRecibo = 0;
        for (const servicioUuid of updates.servicios_uuids) {
          const [servicios] = await pool.query(
            'SELECT id, uuid, nombre, precio, duracion_minutos FROM servicios WHERE uuid = ? AND consultorio_id = ?',
            [servicioUuid, req.consultorioId]
          );
          
          if (servicios.length > 0) {
            await pool.query(
              `INSERT INTO recibo_items (recibo_id, tipo, servicio_id, descripcion, cantidad, precio_unitario)
               VALUES (?, 'servicio', ?, ?, 1, ?)`,
              [reciboId, servicios[0].id, servicios[0].nombre, servicios[0].precio]
            );
            subtotalRecibo += parseFloat(servicios[0].precio) || 0;
          }
        }
        
        // Sumar productos del recibo si existen
        const [productos] = await pool.query(
          'SELECT SUM(cantidad * precio_unitario) as total_productos FROM recibo_items WHERE recibo_id = ? AND tipo = "producto"',
          [reciboId]
        );
        
        const totalProductos = parseFloat(productos[0]?.total_productos) || 0;
        const totalRecibo = subtotalRecibo + totalProductos;
        
        // Actualizar totales del recibo
        await pool.query(
          'UPDATE recibos SET subtotal = ?, total = ? WHERE id = ?',
          [subtotalRecibo + totalProductos, totalRecibo, reciboId]
        );
        
        console.log(`Recibo actualizado con nuevos servicios para cita ${uuid}`);
      }
    } catch (reciboErr) {
      console.error('Error actualizando recibo:', reciboErr);
      // No fallar la actualización de la cita si falla el recibo
    }
  }

  // Incluir hora_fin en la respuesta si fue ajustada
  const responseData = {
    success: true,
    message: 'Cita actualizada exitosamente'
  };

  if (updates.hora_fin && updates.estado === 'completada') {
    responseData.data = {
      hora_fin_ajustada: updates.hora_fin,
      mensaje_tiempo: 'El tiempo restante ha sido liberado automáticamente'
    };
  }

  res.json(responseData);

  // Sincronizar con Google Calendar del doctor (crea/actualiza/elimina el
  // evento según corresponda). Fire-and-forget: no debe retrasar la
  // respuesta ni fallar la actualización de la cita.
  sincronizarCitaHaciaGoogle(citaId).catch(() => {});

  // Crear notificaciones según el cambio de estado
  try {
    const fechaFormateada = citaActual.fecha instanceof Date 
      ? citaActual.fecha.toLocaleDateString('es-MX') 
      : new Date(citaActual.fecha).toLocaleDateString('es-MX');

    // Notificación de cita completada
    if (updates.estado === 'completada' && citaActual.estado !== 'completada') {
      await crearNotificacionInterna(req.consultorioId, {
        tipo: 'cita',
        titulo: 'Cita completada',
        mensaje: `La cita de ${pacienteNombre} del ${fechaFormateada} ha sido completada`,
        icono: 'check-circle',
        color: 'success',
        enlace: `/detalle-cita/${uuid}`,
        referencia_tipo: 'cita',
        referencia_uuid: uuid
      });
    }

    // Notificación de cita cancelada
    if (updates.estado === 'cancelada' && citaActual.estado !== 'cancelada') {
      await crearNotificacionInterna(req.consultorioId, {
        tipo: 'cita',
        titulo: 'Cita cancelada',
        mensaje: `La cita de ${pacienteNombre} del ${fechaFormateada} a las ${citaActual.hora_inicio} ha sido cancelada`,
        icono: 'x-circle',
        color: 'danger',
        enlace: `/detalle-cita/${uuid}`,
        referencia_tipo: 'cita',
        referencia_uuid: uuid
      });
    }

    // Notificación de cita reprogramada (cambio de fecha u hora)
    if ((updates.fecha && updates.fecha !== formatFechaLocal(citaActual.fecha)) ||
        (updates.hora_inicio && updates.hora_inicio !== citaActual.hora_inicio)) {
      const nuevaFecha = updates.fecha || formatFechaLocal(citaActual.fecha);
      const nuevaHora = updates.hora_inicio || citaActual.hora_inicio;
      await crearNotificacionInterna(req.consultorioId, {
        tipo: 'cita',
        titulo: 'Cita reprogramada',
        mensaje: `La cita de ${pacienteNombre} ha sido reprogramada para el ${nuevaFecha} a las ${nuevaHora}`,
        icono: 'calendar',
        color: 'warning',
        enlace: `/detalle-cita/${uuid}`,
        referencia_tipo: 'cita',
        referencia_uuid: uuid
      });
    }
  } catch (notifError) {
    console.error('Error creando notificación:', notifError);
  }
});

/**
 * Cancelar cita
 * DELETE /api/citas/:uuid
 */
const deleteCita = asyncHandler(async (req, res) => {
  const { uuid } = req.params;

  // Obtener info de la cita para la notificación y limpieza de bloqueos
  const [citaInfo] = await pool.query(
    `SELECT c.id, c.doctor_id, c.fecha, c.hora_inicio, c.hora_fin,
            p.nombre as paciente_nombre, p.apellidos as paciente_apellidos
     FROM citas c
     JOIN pacientes p ON c.paciente_id = p.id
     WHERE c.uuid = ? AND c.consultorio_id = ?`,
    [uuid, req.consultorioId]
  );

  const [result] = await pool.query(
    `UPDATE citas SET estado = 'cancelada' WHERE uuid = ? AND consultorio_id = ?`,
    [uuid, req.consultorioId]
  );

  if (result.affectedRows === 0) {
    return res.status(404).json({
      success: false,
      message: 'Cita no encontrada'
    });
  }

  // Eliminar bloqueos asociados para liberar el horario
  if (citaInfo.length > 0) {
    await eliminarBloqueosDeCita(citaInfo[0].id, citaInfo[0]);
  }

  res.json({
    success: true,
    message: 'Cita cancelada exitosamente'
  });

  // Eliminar el evento del Google Calendar del doctor si estaba sincronizado
  if (citaInfo.length > 0) {
    sincronizarCitaHaciaGoogle(citaInfo[0].id).catch(() => {});
  }

  // Crear notificación de cita cancelada
  if (citaInfo.length > 0) {
    try {
      const cita = citaInfo[0];
      const pacienteNombre = `${cita.paciente_nombre} ${cita.paciente_apellidos || ''}`.trim();
      const fechaFormateada = cita.fecha instanceof Date 
        ? cita.fecha.toLocaleDateString('es-MX') 
        : new Date(cita.fecha).toLocaleDateString('es-MX');

      await crearNotificacionInterna(req.consultorioId, {
        tipo: 'cita',
        titulo: 'Cita cancelada',
        mensaje: `La cita de ${pacienteNombre} del ${fechaFormateada} a las ${cita.hora_inicio} ha sido cancelada`,
        icono: 'x-circle',
        color: 'danger',
        enlace: `/detalle-cita/${uuid}`,
        referencia_tipo: 'cita',
        referencia_uuid: uuid
      });
    } catch (notifError) {
      console.error('Error creando notificación:', notifError);
    }
  }
});

// Función auxiliar para calcular hora de fin
function calcularHoraFin(horaInicio, duracionMinutos) {
  const [horas, minutos] = horaInicio.split(':').map(Number);
  const totalMinutos = horas * 60 + minutos + duracionMinutos;
  const nuevasHoras = Math.floor(totalMinutos / 60);
  const nuevosMinutos = totalMinutos % 60;
  return `${String(nuevasHoras).padStart(2, '0')}:${String(nuevosMinutos).padStart(2, '0')}`;
}

// Normaliza una hora a formato HH:MM (acepta HH:MM:SS o HH:MM)
function normalizarHora(hora) {
  return String(hora).substring(0, 5);
}

// Convierte un valor de fecha (Date de mysql2 o string) a 'YYYY-MM-DD' local
function formatFechaLocal(fecha) {
  if (fecha instanceof Date) {
    const y = fecha.getFullYear();
    const m = String(fecha.getMonth() + 1).padStart(2, '0');
    const d = String(fecha.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  return String(fecha).substring(0, 10);
}

/**
 * Valida que un doctor esté disponible en fecha/rango horario.
 * Devuelve { error, advertencia }:
 * - error: conflicto duro (solapamiento con otra cita, bloqueo, rango inválido).
 *   La cita NO debe crearse.
 * - advertencia: la cita cae fuera del horario laboral del doctor. Puede
 *   crearse si el usuario lo confirma (permitir_fuera_horario).
 *
 * db permite pasar una conexión de transacción para que las lecturas
 * participen de los bloqueos de fila (evita reservas concurrentes encimadas).
 */
async function validarDisponibilidadDoctor(doctorId, fecha, horaInicio, horaFin, excluirCitaId = null, db = pool) {
  horaInicio = normalizarHora(horaInicio);
  horaFin = normalizarHora(horaFin);

  if (horaFin <= horaInicio) {
    return { error: 'La hora de fin debe ser posterior a la hora de inicio', advertencia: null };
  }

  // 1. Horario laboral del doctor (ADVERTENCIA, no bloquea).
  // Si no tiene ningún horario configurado no se advierte (mismo comportamiento
  // que el fallback del frontend).
  let advertencia = null;
  const [horariosDoc] = await db.query(
    'SELECT dia_semana, hora_inicio, hora_fin, activo FROM horarios_doctor WHERE doctor_id = ?',
    [doctorId]
  );

  if (horariosDoc.length > 0) {
    const [y, m, d] = fecha.split('-').map(Number);
    const diaSemana = new Date(y, m - 1, d).getDay();
    const horarioDia = horariosDoc.find(h => h.dia_semana === diaSemana && (h.activo === 1 || h.activo === true));

    if (!horarioDia) {
      advertencia = 'El doctor no atiende ese día según su horario configurado';
    } else {
      const laboralInicio = normalizarHora(horarioDia.hora_inicio);
      const laboralFin = normalizarHora(horarioDia.hora_fin);
      if (horaInicio < laboralInicio || horaFin > laboralFin) {
        advertencia = `La cita está fuera del horario laboral del doctor (${laboralInicio} - ${laboralFin})`;
      }
    }
  }

  // 2. Solapamiento con otras citas (rango contra rango) — ERROR duro.
  // Se ignoran citas canceladas, no asistidas y slots liberados (hora_fin = hora_inicio).
  let queryConflictos = `
    SELECT id FROM citas
    WHERE doctor_id = ? AND fecha = ?
    AND estado NOT IN ('cancelada', 'no_asistio')
    AND hora_fin > hora_inicio
    AND hora_inicio < ? AND hora_fin > ?`;
  const paramsConflictos = [doctorId, fecha, horaFin, horaInicio];

  if (excluirCitaId) {
    queryConflictos += ' AND id != ?';
    paramsConflictos.push(excluirCitaId);
  }

  const [conflictos] = await db.query(queryConflictos, paramsConflictos);
  if (conflictos.length > 0) {
    return { error: 'El doctor ya tiene otra cita que se cruza con ese horario', advertencia };
  }

  // 3. Bloqueos de horario (día completo o parciales, evaluando el rango completo) — ERROR duro.
  const [bloqueos] = await db.query(
    `SELECT id, motivo FROM bloqueos_horario
     WHERE doctor_id = ?
     AND (
       (todo_el_dia = TRUE AND DATE(fecha_inicio) <= ? AND DATE(fecha_fin) >= ?)
       OR
       (todo_el_dia = FALSE AND fecha_inicio < ? AND fecha_fin > ?)
     )`,
    [doctorId, fecha, fecha, `${fecha} ${horaFin}:00`, `${fecha} ${horaInicio}:00`]
  );

  if (bloqueos.length > 0) {
    return {
      error: `El horario no está disponible. ${bloqueos[0].motivo ? `Motivo: ${bloqueos[0].motivo}` : 'El doctor tiene el horario bloqueado.'}`,
      advertencia
    };
  }

  return { error: null, advertencia };
}

/**
 * Elimina los bloqueos de horario asociados a una cita.
 * Primero por cita_id (si la migración add_bloqueo_cita.sql está aplicada)
 * y después, para bloqueos antiguos sin vínculo, por coincidencia exacta
 * con el horario original de la cita.
 */
async function eliminarBloqueosDeCita(citaId, citaOriginal) {
  try {
    await pool.query('DELETE FROM bloqueos_horario WHERE cita_id = ?', [citaId]);
  } catch (err) {
    if (err.code === 'ER_BAD_FIELD_ERROR') {
      console.warn('bloqueos_horario.cita_id no existe. Aplica la migración: backend/database/add_bloqueo_cita.sql');
    } else {
      console.error('Error eliminando bloqueos por cita_id:', err.message);
    }
  }

  if (citaOriginal && citaOriginal.doctor_id) {
    try {
      await pool.query(
        `DELETE FROM bloqueos_horario
         WHERE doctor_id = ?
         AND (cita_id IS NULL OR cita_id = ?)
         AND DATE(fecha_inicio) = DATE(?)
         AND TIME(fecha_inicio) = ?
         AND TIME(fecha_fin) = ?
         AND todo_el_dia = FALSE`,
        [citaOriginal.doctor_id, citaId, citaOriginal.fecha, citaOriginal.hora_inicio, citaOriginal.hora_fin]
      );
    } catch (err) {
      if (err.code === 'ER_BAD_FIELD_ERROR') {
        // Sin la columna cita_id: mismo borrado por coincidencia exacta (comportamiento anterior)
        await pool.query(
          `DELETE FROM bloqueos_horario
           WHERE doctor_id = ?
           AND DATE(fecha_inicio) = DATE(?)
           AND TIME(fecha_inicio) = ?
           AND TIME(fecha_fin) = ?
           AND todo_el_dia = FALSE`,
          [citaOriginal.doctor_id, citaOriginal.fecha, citaOriginal.hora_inicio, citaOriginal.hora_fin]
        ).catch(e => console.error('Error eliminando bloqueos asociados:', e.message));
      } else {
        console.error('Error eliminando bloqueos asociados:', err.message);
      }
    }
  }
}

module.exports = {
  getCitas,
  getCita,
  createCita,
  updateCita,
  deleteCita,
  validarDisponibilidadDoctor,
  eliminarBloqueosDeCita
};
