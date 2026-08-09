const { pool } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

// Obtener todos los consultorios internos
const getAll = async (req, res) => {
  try {
    const consultorioId = req.user.consultorio_id;
    
    const [consultorios] = await pool.query(
      `SELECT * FROM consultorios_internos 
       WHERE consultorio_id = ? 
       ORDER BY nombre ASC`,
      [consultorioId]
    );
    
    res.json({
      success: true,
      data: { consultorios }
    });
  } catch (error) {
    console.error('Error al obtener consultorios internos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener consultorios internos'
    });
  }
};

// Obtener consultorios activos
const getActivos = async (req, res) => {
  try {
    const consultorioId = req.user.consultorio_id;
    
    console.log('Buscando consultorios internos activos para consultorio_id:', consultorioId);
    
    const [consultorios] = await pool.query(
      `SELECT * FROM consultorios_internos 
       WHERE consultorio_id = ? AND activo = TRUE
       ORDER BY nombre ASC`,
      [consultorioId]
    );
    
    console.log('Consultorios encontrados:', consultorios.length);
    
    // Si no hay activos, verificar si hay inactivos
    if (consultorios.length === 0) {
      const [todosConsultorios] = await pool.query(
        `SELECT id, nombre, activo FROM consultorios_internos WHERE consultorio_id = ?`,
        [consultorioId]
      );
      console.log('Total consultorios (incluyendo inactivos):', todosConsultorios);
    }
    
    res.json({
      success: true,
      data: { consultorios }
    });
  } catch (error) {
    console.error('Error al obtener consultorios activos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener consultorios activos'
    });
  }
};

// Obtener un consultorio por UUID
const getByUuid = async (req, res) => {
  try {
    const { uuid } = req.params;
    const consultorioId = req.user.consultorio_id;
    
    const [consultorios] = await pool.query(
      `SELECT * FROM consultorios_internos 
       WHERE uuid = ? AND consultorio_id = ?`,
      [uuid, consultorioId]
    );
    
    if (consultorios.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Consultorio no encontrado'
      });
    }
    
    res.json({
      success: true,
      data: consultorios[0]
    });
  } catch (error) {
    console.error('Error al obtener consultorio:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener consultorio'
    });
  }
};

// Crear un nuevo consultorio interno
const create = async (req, res) => {
  try {
    const consultorioId = req.user.consultorio_id;
    const { nombre, descripcion, ubicacion, color, capacidad, equipamiento } = req.body;
    
    if (!nombre) {
      return res.status(400).json({
        success: false,
        message: 'El nombre del consultorio es requerido'
      });
    }
    
    const uuid = uuidv4();
    
    const [result] = await pool.query(
      `INSERT INTO consultorios_internos 
       (consultorio_id, uuid, nombre, descripcion, ubicacion, color, capacidad, equipamiento) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [consultorioId, uuid, nombre, descripcion || null, ubicacion || null, 
       color || '#4F46E5', capacidad || 1, equipamiento || null]
    );
    
    res.status(201).json({
      success: true,
      message: 'Consultorio creado exitosamente',
      data: {
        id: result.insertId,
        uuid,
        nombre
      }
    });
  } catch (error) {
    console.error('Error al crear consultorio:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear consultorio'
    });
  }
};

// Actualizar un consultorio interno
const update = async (req, res) => {
  try {
    const { uuid } = req.params;
    const consultorioId = req.user.consultorio_id;
    const { nombre, descripcion, ubicacion, color, capacidad, equipamiento, activo } = req.body;
    
    // Verificar que el consultorio existe
    const [existing] = await pool.query(
      'SELECT id FROM consultorios_internos WHERE uuid = ? AND consultorio_id = ?',
      [uuid, consultorioId]
    );
    
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Consultorio no encontrado'
      });
    }
    
    // Construir query dinámica
    const updates = [];
    const values = [];
    
    if (nombre !== undefined) {
      updates.push('nombre = ?');
      values.push(nombre);
    }
    if (descripcion !== undefined) {
      updates.push('descripcion = ?');
      values.push(descripcion);
    }
    if (ubicacion !== undefined) {
      updates.push('ubicacion = ?');
      values.push(ubicacion);
    }
    if (color !== undefined) {
      updates.push('color = ?');
      values.push(color);
    }
    if (capacidad !== undefined) {
      updates.push('capacidad = ?');
      values.push(capacidad);
    }
    if (equipamiento !== undefined) {
      updates.push('equipamiento = ?');
      values.push(equipamiento);
    }
    if (activo !== undefined) {
      updates.push('activo = ?');
      values.push(activo);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No hay campos para actualizar'
      });
    }
    
    values.push(uuid, consultorioId);
    
    await pool.query(
      `UPDATE consultorios_internos SET ${updates.join(', ')} WHERE uuid = ? AND consultorio_id = ?`,
      values
    );
    
    res.json({
      success: true,
      message: 'Consultorio actualizado exitosamente'
    });
  } catch (error) {
    console.error('Error al actualizar consultorio:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar consultorio'
    });
  }
};

// Eliminar un consultorio interno
const remove = async (req, res) => {
  try {
    const { uuid } = req.params;
    const consultorioId = req.user.consultorio_id;
    
    // Verificar que el consultorio existe
    const [existing] = await pool.query(
      'SELECT id FROM consultorios_internos WHERE uuid = ? AND consultorio_id = ?',
      [uuid, consultorioId]
    );
    
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Consultorio no encontrado'
      });
    }
    
    await pool.query(
      'DELETE FROM consultorios_internos WHERE uuid = ? AND consultorio_id = ?',
      [uuid, consultorioId]
    );
    
    res.json({
      success: true,
      message: 'Consultorio eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar consultorio:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar consultorio'
    });
  }
};

// Obtener disponibilidad de un consultorio en una fecha
const getDisponibilidad = async (req, res) => {
  try {
    const { uuid } = req.params;
    const { fecha } = req.query;
    const consultorioId = req.user.consultorio_id;
    
    if (!fecha) {
      return res.status(400).json({
        success: false,
        message: 'La fecha es requerida'
      });
    }
    
    // Obtener el consultorio interno
    const [consultorioInterno] = await pool.query(
      'SELECT id FROM consultorios_internos WHERE uuid = ? AND consultorio_id = ?',
      [uuid, consultorioId]
    );
    
    if (consultorioInterno.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Consultorio no encontrado'
      });
    }
    
    // Obtener citas del consultorio para esa fecha
    const [citas] = await pool.query(
      `SELECT c.hora_inicio, c.hora_fin, c.estado,
              CONCAT(p.nombre, ' ', p.apellidos) as paciente_nombre,
              CONCAT(u.nombre, ' ', u.apellidos) as doctor_nombre
       FROM citas c
       JOIN pacientes p ON c.paciente_id = p.id
       JOIN usuarios u ON c.doctor_id = u.id
       WHERE c.consultorio_interno_id = ? 
         AND c.fecha = ?
         AND c.estado NOT IN ('cancelada')
       ORDER BY c.hora_inicio`,
      [consultorioInterno[0].id, fecha]
    );
    
    res.json({
      success: true,
      data: { citas }
    });
  } catch (error) {
    console.error('Error al obtener disponibilidad:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener disponibilidad'
    });
  }
};

module.exports = {
  getAll,
  getActivos,
  getByUuid,
  create,
  update,
  remove,
  getDisponibilidad
};
