import axios from 'axios';

// URL base del API
export const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

// Crear instancia de axios
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor para agregar token a las peticiones
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('biodental_token') || sessionStorage.getItem('biodental_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores de respuesta
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Si el token expiró o es inválido
    if (error.response?.status === 401) {
      localStorage.removeItem('biodental_token');
      sessionStorage.removeItem('biodental_token');
      localStorage.removeItem('biodental_user');
      sessionStorage.removeItem('biodental_user');
      
      // Redirigir a login si no estamos ya ahí
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// ============================================
// PORTAL DE PACIENTES: instancia de axios independiente
// ============================================
// Usa sus propias claves de almacenamiento (biodental_portal_token) para que
// una sesión de staff y una de paciente puedan convivir en el mismo
// navegador sin pisarse, y para que un token nunca se cuele en el otro realm.
const portalApi = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

portalApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('biodental_portal_token') || sessionStorage.getItem('biodental_portal_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

portalApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('biodental_portal_token');
      sessionStorage.removeItem('biodental_portal_token');
      localStorage.removeItem('biodental_portal_paciente');
      sessionStorage.removeItem('biodental_portal_paciente');

      if (!window.location.pathname.startsWith('/portal/login') && !window.location.pathname.startsWith('/portal/registro')) {
        window.location.href = '/portal/login';
      }
    }
    return Promise.reject(error);
  }
);

export { portalApi };

export const portalService = {
  registro: async (data) => {
    const response = await portalApi.post('/portal/auth/registro', data);
    return response.data;
  },

  login: async (telefono, password) => {
    const response = await portalApi.post('/portal/auth/login', { telefono, password });
    return response.data;
  },

  getMe: async () => {
    const response = await portalApi.get('/portal/me');
    return response.data;
  },

  updatePassword: async (currentPassword, newPassword) => {
    const response = await portalApi.put('/portal/password', {
      current_password: currentPassword,
      new_password: newPassword
    });
    return response.data;
  },

  getCitas: async () => {
    const response = await portalApi.get('/portal/citas');
    return response.data;
  },

  crearCita: async (citaData) => {
    const response = await portalApi.post('/portal/citas', citaData);
    return response.data;
  },

  checkin: async (citaUuid) => {
    const response = await portalApi.post(`/portal/citas/${citaUuid}/checkin`);
    return response.data;
  },

  getHistorial: async () => {
    const response = await portalApi.get('/portal/historial');
    return response.data;
  },

  getDoctores: async () => {
    const response = await portalApi.get('/portal/doctores');
    return response.data;
  },

  getServiciosDoctor: async (doctorUuid) => {
    const response = await portalApi.get(`/portal/doctores/${doctorUuid}/servicios`);
    return response.data;
  },

  getDisponibilidad: async (doctorUuid, fecha) => {
    const response = await portalApi.get(`/portal/doctores/${doctorUuid}/disponibilidad`, { params: { fecha } });
    return response.data;
  },

  getCuenta: async () => {
    const response = await portalApi.get('/portal/cuenta');
    return response.data;
  },

  getRecompensas: async () => {
    const response = await portalApi.get('/portal/recompensas');
    return response.data;
  },

  getPromociones: async () => {
    const response = await portalApi.get('/portal/promociones');
    return response.data;
  },

  getCanjeCatalogo: async () => {
    const response = await portalApi.get('/portal/canje-catalogo');
    return response.data;
  },

  crearCanje: async (tipo, uuid, cantidad = 1) => {
    const response = await portalApi.post('/portal/canjes', { tipo, uuid, cantidad });
    return response.data;
  },

  getMisCanjes: async () => {
    const response = await portalApi.get('/portal/canjes');
    return response.data;
  }
};

// ============================================
// CANJES SERVICES (lado staff: canjes de puntos por productos)
// ============================================
export const canjesService = {
  getAll: async (params = {}) => {
    const response = await api.get('/canjes', { params });
    return response.data;
  },

  entregar: async (uuid) => {
    const response = await api.put(`/canjes/${uuid}/entregar`);
    return response.data;
  },

  cancelar: async (uuid) => {
    const response = await api.put(`/canjes/${uuid}/cancelar`);
    return response.data;
  }
};

// ============================================
// PROMOCIONES SERVICES (lado staff: administrar promociones del portal)
// ============================================
export const promocionesService = {
  getAll: async () => {
    const response = await api.get('/promociones');
    return response.data;
  },

  create: async (promocionData) => {
    const response = await api.post('/promociones', promocionData);
    return response.data;
  },

  update: async (uuid, promocionData) => {
    const response = await api.put(`/promociones/${uuid}`, promocionData);
    return response.data;
  },

  delete: async (uuid) => {
    const response = await api.delete(`/promociones/${uuid}`);
    return response.data;
  }
};

// ============================================
// AUTH SERVICES
// ============================================
export const authService = {
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  updatePassword: async (currentPassword, newPassword) => {
    const response = await api.put('/auth/password', {
      current_password: currentPassword,
      new_password: newPassword
    });
    return response.data;
  }
};

// ============================================
// PACIENTES SERVICES
// ============================================
export const pacientesService = {
  getAll: async (params = {}) => {
    const response = await api.get('/pacientes', { params });
    return response.data;
  },

  getById: async (uuid) => {
    const response = await api.get(`/pacientes/${uuid}`);
    return response.data;
  },

  create: async (pacienteData) => {
    const response = await api.post('/pacientes', pacienteData);
    return response.data;
  },

  update: async (uuid, pacienteData) => {
    const response = await api.put(`/pacientes/${uuid}`, pacienteData);
    return response.data;
  },

  delete: async (uuid) => {
    const response = await api.delete(`/pacientes/${uuid}`);
    return response.data;
  },

  search: async (query) => {
    const response = await api.get('/pacientes', { params: { search: query } });
    return response.data;
  }
};

// ============================================
// DOCUMENTOS PACIENTE SERVICES
// ============================================
export const documentosService = {
  getAll: async (pacienteUuid) => {
    const response = await api.get(`/pacientes/${pacienteUuid}/documentos`);
    return response.data;
  },

  create: async (pacienteUuid, documentoData) => {
    const response = await api.post(`/pacientes/${pacienteUuid}/documentos`, documentoData);
    return response.data;
  },

  delete: async (pacienteUuid, docUuid) => {
    const response = await api.delete(`/pacientes/${pacienteUuid}/documentos/${docUuid}`);
    return response.data;
  }
};

// ============================================
// CITAS SERVICES
// ============================================
export const citasService = {
  getAll: async (params = {}) => {
    const response = await api.get('/citas', { params });
    return response.data;
  },

  getById: async (uuid) => {
    const response = await api.get(`/citas/${uuid}`);
    return response.data;
  },

  // Alias para compatibilidad
  getOne: async (uuid) => {
    const response = await api.get(`/citas/${uuid}`);
    return response.data;
  },

  create: async (citaData) => {
    const response = await api.post('/citas', citaData);
    return response.data;
  },

  update: async (uuid, citaData) => {
    const response = await api.put(`/citas/${uuid}`, citaData);
    return response.data;
  },

  updateEstado: async (uuid, estado) => {
    const response = await api.patch(`/citas/${uuid}/estado`, { estado });
    return response.data;
  },

  delete: async (uuid) => {
    const response = await api.delete(`/citas/${uuid}`);
    return response.data;
  },

  getByFecha: async (fecha) => {
    const response = await api.get('/citas', { params: { fecha } });
    return response.data;
  },

  getByMes: async (year, month) => {
    const response = await api.get('/citas', { params: { year, month } });
    return response.data;
  },

  getByDoctor: async (doctorUuid, params = {}) => {
    const response = await api.get('/citas', { params: { doctor_id: doctorUuid, ...params } });
    return response.data;
  }
};

// ============================================
// USUARIOS/DOCTORES SERVICES
// ============================================
export const usuariosService = {
  getAll: async (params = {}) => {
    const response = await api.get('/usuarios', { params });
    return response.data;
  },

  getDoctores: async () => {
    const response = await api.get('/usuarios/doctores');
    return response.data;
  },

  getById: async (uuid) => {
    const response = await api.get(`/usuarios/${uuid}`);
    return response.data;
  },

  create: async (usuarioData) => {
    const response = await api.post('/usuarios', usuarioData);
    return response.data;
  },

  update: async (uuid, usuarioData) => {
    const response = await api.put(`/usuarios/${uuid}`, usuarioData);
    return response.data;
  },

  delete: async (uuid) => {
    const response = await api.delete(`/usuarios/${uuid}`);
    return response.data;
  },

  getDoctors: async () => {
    const response = await api.get('/usuarios', { params: { rol: 'doctor' } });
    return response.data;
  }
};

// ============================================
// SERVICIOS MÉDICOS SERVICES
// ============================================
export const serviciosService = {
  getAll: async (params = {}) => {
    const response = await api.get('/servicios', { params });
    return response.data;
  },

  getById: async (uuid) => {
    const response = await api.get(`/servicios/${uuid}`);
    return response.data;
  },

  create: async (servicioData) => {
    const response = await api.post('/servicios', servicioData);
    return response.data;
  },

  update: async (uuid, servicioData) => {
    const response = await api.put(`/servicios/${uuid}`, servicioData);
    return response.data;
  },

  delete: async (uuid) => {
    const response = await api.delete(`/servicios/${uuid}`);
    return response.data;
  },

  // Servicios por doctor
  getByDoctor: async (doctorUuid) => {
    const response = await api.get(`/servicios/doctor/${doctorUuid}`);
    return response.data;
  },

  setDoctorServicios: async (doctorUuid, servicios) => {
    const response = await api.post(`/servicios/doctor/${doctorUuid}`, { servicios });
    return response.data;
  },

  agregarADoctor: async (doctorUuid, servicioUuid, precioPersonalizado = null) => {
    const response = await api.post(`/servicios/doctor/${doctorUuid}/agregar/${servicioUuid}`, { precio_personalizado: precioPersonalizado });
    return response.data;
  },

  quitarDeDoctor: async (doctorUuid, servicioUuid) => {
    const response = await api.delete(`/servicios/doctor/${doctorUuid}/quitar/${servicioUuid}`);
    return response.data;
  }
};

// ============================================
// INVENTARIO SERVICES
// ============================================
export const inventarioService = {
  getAll: async (params = {}) => {
    const response = await api.get('/inventario', { params });
    return response.data;
  },

  getAlertas: async () => {
    const response = await api.get('/inventario/alertas');
    return response.data;
  },

  getById: async (uuid) => {
    const response = await api.get(`/inventario/${uuid}`);
    return response.data;
  },

  create: async (productoData) => {
    const response = await api.post('/inventario', productoData);
    return response.data;
  },

  update: async (uuid, productoData) => {
    const response = await api.put(`/inventario/${uuid}`, productoData);
    return response.data;
  },

  delete: async (uuid) => {
    const response = await api.delete(`/inventario/${uuid}`);
    return response.data;
  },

  ajustarStock: async (uuid, cantidad, tipoAjuste, motivo) => {
    const response = await api.post(`/inventario/${uuid}/ajustar-stock`, {
      cantidad,
      tipo_ajuste: tipoAjuste,
      motivo
    });
    return response.data;
  }
};

// ============================================
// RECIBOS SERVICES
// ============================================
export const recibosService = {
  getAll: async (params = {}) => {
    const response = await api.get('/recibos', { params });
    return response.data;
  },

  getById: async (uuid) => {
    const response = await api.get(`/recibos/${uuid}`);
    return response.data;
  },

  getByCita: async (citaUuid) => {
    const response = await api.get(`/recibos/cita/${citaUuid}`);
    return response.data;
  },

  create: async (reciboData) => {
    const response = await api.post('/recibos', reciboData);
    return response.data;
  },

  update: async (uuid, reciboData) => {
    const response = await api.put(`/recibos/${uuid}`, reciboData);
    return response.data;
  },

  delete: async (uuid) => {
    const response = await api.delete(`/recibos/${uuid}`);
    return response.data;
  },

  addItem: async (uuid, itemData) => {
    const response = await api.post(`/recibos/${uuid}/items`, itemData);
    return response.data;
  },

  removeItem: async (uuid, itemId) => {
    const response = await api.delete(`/recibos/${uuid}/items/${itemId}`);
    return response.data;
  }
};

// ============================================
// HORARIOS SERVICES
// ============================================
export const horariosService = {
  getHorarios: async (doctorUuid) => {
    const response = await api.get(`/horarios/doctor/${doctorUuid}`);
    return response.data;
  },

  // Alias para compatibilidad
  getByDoctor: async (doctorUuid) => {
    const response = await api.get(`/horarios/doctor/${doctorUuid}`);
    return response.data;
  },

  setHorarios: async (doctorUuid, horarios) => {
    const response = await api.put(`/horarios/doctor/${doctorUuid}`, { horarios });
    return response.data;
  },

  getDisponibilidad: async (doctorUuid, fecha) => {
    const response = await api.get(`/horarios/disponibilidad/${doctorUuid}`, { params: { fecha } });
    return response.data;
  },

  getBloqueos: async (doctorUuid, params = {}) => {
    const response = await api.get(`/horarios/bloqueos/${doctorUuid}`, { params });
    return response.data;
  },

  createBloqueo: async (doctorUuid, bloqueoData) => {
    const response = await api.post(`/horarios/bloqueos/${doctorUuid}`, bloqueoData);
    return response.data;
  },

  deleteBloqueo: async (id) => {
    const response = await api.delete(`/horarios/bloqueos/${id}`);
    return response.data;
  }
};

// ============================================
// FORMULARIOS SERVICES
// ============================================
export const formulariosService = {
  // Plantillas
  getPlantillas: async (params = {}) => {
    const response = await api.get('/formularios', { params });
    return response.data;
  },

  getPlantilla: async (uuid) => {
    const response = await api.get(`/formularios/${uuid}`);
    return response.data;
  },

  createPlantilla: async (plantillaData) => {
    const response = await api.post('/formularios', plantillaData);
    return response.data;
  },

  updatePlantilla: async (uuid, plantillaData) => {
    const response = await api.put(`/formularios/${uuid}`, plantillaData);
    return response.data;
  },

  deletePlantilla: async (uuid) => {
    const response = await api.delete(`/formularios/${uuid}`);
    return response.data;
  },

  // Alias para compatibilidad
  getAll: async (params = {}) => {
    const response = await api.get('/formularios', { params });
    return response.data;
  },

  getById: async (uuid) => {
    const response = await api.get(`/formularios/${uuid}`);
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/formularios', data);
    return response.data;
  },

  update: async (uuid, data) => {
    const response = await api.put(`/formularios/${uuid}`, data);
    return response.data;
  },

  delete: async (uuid) => {
    const response = await api.delete(`/formularios/${uuid}`);
    return response.data;
  },

  // Formularios completados
  getCompletados: async (params = {}) => {
    const response = await api.get('/formularios/completados', { params });
    return response.data;
  },

  completar: async (formData) => {
    const response = await api.post('/formularios/completados', formData);
    return response.data;
  },

  deleteCompletado: async (id) => {
    const response = await api.delete(`/formularios/completados/${id}`);
    return response.data;
  },

  // Alias para compatibilidad
  submitResponse: async (formData) => {
    const response = await api.post('/formularios/completados', formData);
    return response.data;
  }
};

// ============================================
// NOTIFICACIONES SERVICES
// ============================================
export const notificacionesService = {
  getAll: async (params = {}) => {
    const response = await api.get('/notificaciones', { params });
    return response.data;
  },

  getConteo: async () => {
    const response = await api.get('/notificaciones/conteo');
    return response.data;
  },

  marcarLeida: async (id) => {
    const response = await api.put(`/notificaciones/${id}/leer`);
    return response.data;
  },

  marcarTodasLeidas: async () => {
    const response = await api.put('/notificaciones/leer-todas');
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/notificaciones/${id}`);
    return response.data;
  },

  limpiarTodas: async () => {
    const response = await api.delete('/notificaciones/limpiar-todas');
    return response.data;
  }
};

// ============================================
// CONSULTORIO SERVICES
// ============================================
export const consultorioService = {
  get: async () => {
    const response = await api.get('/consultorio');
    return response.data;
  },

  update: async (consultorioData) => {
    const response = await api.put('/consultorio', consultorioData);
    return response.data;
  },

  getDashboard: async () => {
    const response = await api.get('/consultorio/dashboard');
    return response.data;
  },

  getWhatsappConfig: async () => {
    const response = await api.get('/consultorio/whatsapp');
    return response.data;
  },

  updateWhatsappConfig: async (config) => {
    const response = await api.put('/consultorio/whatsapp', config);
    return response.data;
  }
};

// ============================================
// PAGOS SERVICES
// ============================================
export const pagosService = {
  getAll: async (params = {}) => {
    const response = await api.get('/pagos', { params });
    return response.data;
  },

  getByRecibo: async (reciboUuid) => {
    const response = await api.get(`/pagos/recibo/${reciboUuid}`);
    return response.data;
  },

  registrar: async (pagoData) => {
    const response = await api.post('/pagos', pagoData);
    return response.data;
  }
};

// ============================================
// CONSULTORIOS INTERNOS SERVICES
// ============================================
export const consultoriosInternosService = {
  getAll: async () => {
    const response = await api.get('/consultorios-internos');
    return response.data;
  },

  getActivos: async () => {
    const response = await api.get('/consultorios-internos/activos');
    return response.data;
  },

  getByUuid: async (uuid) => {
    const response = await api.get(`/consultorios-internos/${uuid}`);
    return response.data;
  },

  getDisponibilidad: async (uuid, fecha) => {
    const response = await api.get(`/consultorios-internos/${uuid}/disponibilidad`, {
      params: { fecha }
    });
    return response.data;
  },

  create: async (consultorioData) => {
    const response = await api.post('/consultorios-internos', consultorioData);
    return response.data;
  },

  update: async (uuid, consultorioData) => {
    const response = await api.put(`/consultorios-internos/${uuid}`, consultorioData);
    return response.data;
  },

  delete: async (uuid) => {
    const response = await api.delete(`/consultorios-internos/${uuid}`);
    return response.data;
  }
};

// ============================================
// MOVIMIENTOS EXTERNOS SERVICES
// ============================================
export const movimientosService = {
  getAll: async (params = {}) => {
    const response = await api.get('/movimientos-externos', { params });
    return response.data;
  },

  getByUuid: async (uuid) => {
    const response = await api.get(`/movimientos-externos/${uuid}`);
    return response.data;
  },

  create: async (movimientoData) => {
    const response = await api.post('/movimientos-externos', movimientoData);
    return response.data;
  },

  update: async (uuid, movimientoData) => {
    const response = await api.put(`/movimientos-externos/${uuid}`, movimientoData);
    return response.data;
  },

  delete: async (uuid) => {
    const response = await api.delete(`/movimientos-externos/${uuid}`);
    return response.data;
  }
};

// ============================================
// WHATSAPP SERVICES (confirmaciones y recordatorios de cita)
// ============================================
export const whatsappService = {
  getMensajesCita: async (citaUuid) => {
    const response = await api.get(`/whatsapp/citas/${citaUuid}`);
    return response.data;
  },

  enviarConfirmacion: async (citaUuid) => {
    const response = await api.post(`/whatsapp/citas/${citaUuid}/confirmacion`);
    return response.data;
  },

  enviarRecordatorio: async (citaUuid) => {
    const response = await api.post(`/whatsapp/citas/${citaUuid}/recordatorio`);
    return response.data;
  }
};

// ============================================
// RECETAS SERVICES (recetas médicas)
// ============================================
export const recetasService = {
  getAll: async (params = {}) => {
    const response = await api.get('/recetas', { params });
    return response.data;
  },

  getByUuid: async (uuid) => {
    const response = await api.get(`/recetas/${uuid}`);
    return response.data;
  },

  getByCita: async (citaUuid) => {
    const response = await api.get(`/recetas/cita/${citaUuid}`);
    return response.data;
  },

  create: async (recetaData) => {
    const response = await api.post('/recetas', recetaData);
    return response.data;
  },

  update: async (uuid, recetaData) => {
    const response = await api.put(`/recetas/${uuid}`, recetaData);
    return response.data;
  }
};

// ============================================
// PRESUPUESTOS SERVICES (cotizaciones)
// ============================================
export const presupuestosService = {
  getAll: async (params = {}) => {
    const response = await api.get('/presupuestos', { params });
    return response.data;
  },

  getByUuid: async (uuid) => {
    const response = await api.get(`/presupuestos/${uuid}`);
    return response.data;
  },

  getByCita: async (citaUuid) => {
    const response = await api.get(`/presupuestos/cita/${citaUuid}`);
    return response.data;
  },

  create: async (presupuestoData) => {
    const response = await api.post('/presupuestos', presupuestoData);
    return response.data;
  },

  update: async (uuid, presupuestoData) => {
    const response = await api.put(`/presupuestos/${uuid}`, presupuestoData);
    return response.data;
  },

  updateEstado: async (uuid, estado) => {
    const response = await api.put(`/presupuestos/${uuid}/estado`, { estado });
    return response.data;
  }
};

// ============================================
// GOOGLE CALENDAR SERVICES (vinculación por doctor)
// ============================================
export const googleCalendarService = {
  getConfig: async () => {
    const response = await api.get('/google-calendar/config');
    return response.data;
  },

  updateConfig: async (config) => {
    const response = await api.put('/google-calendar/config', config);
    return response.data;
  },

  getAuthUrl: async () => {
    const response = await api.get('/google-calendar/auth-url');
    return response.data;
  },

  getStatus: async () => {
    const response = await api.get('/google-calendar/status');
    return response.data;
  },

  disconnect: async () => {
    const response = await api.delete('/google-calendar');
    return response.data;
  },

  syncNow: async () => {
    const response = await api.post('/google-calendar/sync');
    return response.data;
  }
};

