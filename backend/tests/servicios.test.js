/**
 * Valida el campo agendable_bot de servicios (qué tratamientos puede
 * ofrecer para agendar el asistente de WhatsApp). DB mockeada, igual que
 * el resto de la suite.
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

afterEach(() => jest.clearAllMocks());

describe('POST /api/servicios (agendable_bot)', () => {
  it('guarda agendable_bot=1 cuando se envía true', async () => {
    pool.query
      .mockResolvedValueOnce([[USUARIO_MOCK]]) // authMiddleware
      .mockResolvedValueOnce([{ insertId: 5 }]); // INSERT

    const res = await request(app)
      .post('/api/servicios')
      .set('Authorization', `Bearer ${token()}`)
      .send({ nombre: 'Consulta de valoración', precio: 300, duracion_minutos: 30, agendable_bot: true });

    expect(res.status).toBe(201);
    const insertCall = pool.query.mock.calls[1];
    expect(insertCall[0]).toMatch(/agendable_bot/);
    expect(insertCall[1]).toContain(1);
  });

  it('por default guarda agendable_bot=0 cuando no se envía', async () => {
    pool.query
      .mockResolvedValueOnce([[USUARIO_MOCK]])
      .mockResolvedValueOnce([{ insertId: 6 }]);

    const res = await request(app)
      .post('/api/servicios')
      .set('Authorization', `Bearer ${token()}`)
      .send({ nombre: 'Endodoncia', precio: 2500, duracion_minutos: 90 });

    expect(res.status).toBe(201);
    const insertCall = pool.query.mock.calls[1];
    const valores = insertCall[1];
    // El último valor insertado corresponde a agendable_bot
    expect(valores[valores.length - 1]).toBe(0);
  });
});

describe('PUT /api/servicios/:uuid (agendable_bot)', () => {
  it('permite activar agendable_bot en un servicio existente', async () => {
    pool.query
      .mockResolvedValueOnce([[USUARIO_MOCK]]) // authMiddleware
      .mockResolvedValueOnce([{ affectedRows: 1 }]); // UPDATE

    const res = await request(app)
      .put('/api/servicios/uuid-servicio-1')
      .set('Authorization', `Bearer ${token()}`)
      .send({ agendable_bot: true });

    expect(res.status).toBe(200);
    const updateCall = pool.query.mock.calls[1];
    expect(updateCall[0]).toMatch(/agendable_bot = \?/);
    expect(updateCall[1]).toContain(1);
  });
});

describe('GET /api/servicios', () => {
  it('incluye agendable_bot en la respuesta', async () => {
    pool.query
      .mockResolvedValueOnce([[USUARIO_MOCK]]) // authMiddleware
      .mockResolvedValueOnce([[{ uuid: 'uuid-servicio-1', nombre: 'Consulta de valoración', agendable_bot: 1 }]]);

    const res = await request(app)
      .get('/api/servicios')
      .set('Authorization', `Bearer ${token()}`);

    expect(res.status).toBe(200);
    expect(res.body.data.servicios[0].agendable_bot).toBe(1);
    expect(pool.query.mock.calls[1][0]).toMatch(/agendable_bot/);
  });
});
