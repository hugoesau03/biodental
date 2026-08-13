/**
 * Valida que POST /api/portal/auth/registro exija aceptar tanto los
 * términos y condiciones como el Aviso de Privacidad (dos consentimientos
 * distintos, ya que el Portal trata datos de salud — sensibles conforme a
 * la LFPDPPP), y que quede constancia de cuándo se aceptó cada uno. La DB
 * se mockea igual que en auth.test.js.
 */

jest.mock('../config/database', () => ({
  pool: { query: jest.fn(), getConnection: jest.fn() },
  testConnection: jest.fn().mockResolvedValue(true)
}));

const request = require('supertest');
const { pool } = require('../config/database');
const app = require('../app');

afterEach(() => jest.clearAllMocks());

const payloadBase = {
  telefono: '5512345678',
  fecha_nacimiento: '1990-01-01',
  password: 'password123'
};

describe('POST /api/portal/auth/registro', () => {
  it('devuelve 400 si no se marca terminos_aceptados', async () => {
    const res = await request(app)
      .post('/api/portal/auth/registro')
      .send({ ...payloadBase, privacidad_aceptada: true }); // sin terminos_aceptados

    expect(res.status).toBe(400);
    expect(pool.query).not.toHaveBeenCalled();
  });

  it('devuelve 400 si no se marca privacidad_aceptada', async () => {
    const res = await request(app)
      .post('/api/portal/auth/registro')
      .send({ ...payloadBase, terminos_aceptados: true }); // sin privacidad_aceptada

    expect(res.status).toBe(400);
    expect(res.body.errors.some((e) => e.campo === 'privacidad_aceptada')).toBe(true);
    expect(pool.query).not.toHaveBeenCalled();
  });

  it('devuelve 400 si los campos llegan como string "true" en vez de boolean', async () => {
    const res = await request(app)
      .post('/api/portal/auth/registro')
      .send({ ...payloadBase, terminos_aceptados: 'true', privacidad_aceptada: 'true' });

    expect(res.status).toBe(400);
    expect(pool.query).not.toHaveBeenCalled();
  });

  it('activa el acceso y registra terminos_aceptados_en + privacidad_aceptada_en cuando se aceptan ambos', async () => {
    pool.query
      .mockResolvedValueOnce([[{ id: 3, uuid: 'uuid-paciente-3', consultorio_id: 1 }]]) // SELECT paciente
      .mockResolvedValueOnce([{}]); // UPDATE password_hash + terminos_aceptados_en + privacidad_aceptada_en

    const res = await request(app)
      .post('/api/portal/auth/registro')
      .send({ ...payloadBase, terminos_aceptados: true, privacidad_aceptada: true });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(pool.query.mock.calls[1][0]).toMatch(/terminos_aceptados_en = NOW\(\)/);
    expect(pool.query.mock.calls[1][0]).toMatch(/privacidad_aceptada_en = NOW\(\)/);
  });
});
