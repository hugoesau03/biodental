/**
 * Valida que POST /api/pacientes exija nombre, fecha de nacimiento, correo
 * y teléfono. La DB se mockea igual que en el resto de la suite.
 */

jest.mock('../config/database', () => ({
  pool: { query: jest.fn(), getConnection: jest.fn() },
  testConnection: jest.fn().mockResolvedValue(true)
}));

const request = require('supertest');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');
const app = require('../app');

const USUARIO_MOCK = {
  id: 1, uuid: 'uuid-usuario-1', email: 'ana@x.com', nombre: 'Ana', apellidos: 'Pérez',
  rol: 'admin', consultorio_id: 1, especialidad: null, activo: 1, es_superadmin: 0,
  tokens_invalidos_antes: null,
  consultorio_nombre: 'Clínica X', consultorio_uuid: 'uuid-consultorio-1'
};

const token = () => jwt.sign({ userId: 1, consultorioId: 1 }, process.env.JWT_SECRET, { expiresIn: '1h' });

const pacienteCompleto = {
  nombre: 'Sofía',
  apellidos: 'Martínez',
  fecha_nacimiento: '1995-05-20',
  email: 'sofia@example.com',
  telefono: '5512345678'
};

afterEach(() => jest.clearAllMocks());

describe('POST /api/pacientes', () => {
  it('devuelve 400 si falta la fecha de nacimiento', async () => {
    pool.query.mockResolvedValueOnce([[USUARIO_MOCK]]); // authMiddleware

    const { fecha_nacimiento, ...sinFecha } = pacienteCompleto;
    const res = await request(app)
      .post('/api/pacientes')
      .set('Authorization', `Bearer ${token()}`)
      .send(sinFecha);

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/fecha de nacimiento/i);
  });

  it('devuelve 400 si falta el correo', async () => {
    pool.query.mockResolvedValueOnce([[USUARIO_MOCK]]);

    const { email, ...sinEmail } = pacienteCompleto;
    const res = await request(app)
      .post('/api/pacientes')
      .set('Authorization', `Bearer ${token()}`)
      .send(sinEmail);

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/correo/i);
  });

  it('devuelve 400 si falta el teléfono', async () => {
    pool.query.mockResolvedValueOnce([[USUARIO_MOCK]]);

    const { telefono, ...sinTelefono } = pacienteCompleto;
    const res = await request(app)
      .post('/api/pacientes')
      .set('Authorization', `Bearer ${token()}`)
      .send(sinTelefono);

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/teléfono/i);
  });

  it('crea el paciente cuando vienen nombre, fecha de nacimiento, correo y teléfono', async () => {
    pool.query
      .mockResolvedValueOnce([[USUARIO_MOCK]]) // authMiddleware
      .mockResolvedValueOnce([[]]) // SELECT último numero_expediente
      .mockResolvedValueOnce([{ insertId: 10 }]); // INSERT paciente

    const res = await request(app)
      .post('/api/pacientes')
      .set('Authorization', `Bearer ${token()}`)
      .send(pacienteCompleto);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });
});

describe('GET /api/pacientes?telefono=', () => {
  it('filtra por los últimos 10 dígitos del teléfono, ignorando formato', async () => {
    pool.query
      .mockResolvedValueOnce([[USUARIO_MOCK]]) // authMiddleware
      .mockResolvedValueOnce([[{ total: 1 }]]) // COUNT
      .mockResolvedValueOnce([[{ uuid: 'uuid-paciente-1', nombre: 'Sofía' }]]); // SELECT

    const res = await request(app)
      .get('/api/pacientes')
      .query({ telefono: '+52 1 55-1234-5678' })
      .set('Authorization', `Bearer ${token()}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // La 2a y 3a llamada (COUNT y SELECT) deben incluir solo los 10 dígitos finales
    const countCall = pool.query.mock.calls[1];
    const selectCall = pool.query.mock.calls[2];
    expect(countCall[0]).toMatch(/REGEXP_REPLACE/);
    expect(countCall[1]).toContain('5512345678');
    expect(selectCall[1]).toContain('5512345678');
  });

  it('ignora el filtro si telefono no trae dígitos', async () => {
    pool.query
      .mockResolvedValueOnce([[USUARIO_MOCK]])
      .mockResolvedValueOnce([[{ total: 0 }]])
      .mockResolvedValueOnce([[]]);

    const res = await request(app)
      .get('/api/pacientes')
      .query({ telefono: '---' })
      .set('Authorization', `Bearer ${token()}`);

    expect(res.status).toBe(200);
    const countCall = pool.query.mock.calls[1];
    expect(countCall[0]).not.toMatch(/REGEXP_REPLACE/);
  });
});
