/**
 * Tests del flujo de restablecer contraseña del portal de pacientes
 * (paralelo al de staff en auth.test.js, pero identificando la cuenta por
 * correo en vez de teléfono). DB mockeada — nunca toca MySQL real.
 */

jest.mock('../config/database', () => ({
  pool: { query: jest.fn(), getConnection: jest.fn() },
  testConnection: jest.fn().mockResolvedValue(true)
}));

jest.mock('../services/emailService', () => ({
  enviarEmailResetPassword: jest.fn().mockResolvedValue({ simulado: true }),
  enviarEmail: jest.fn().mockResolvedValue({ simulado: true })
}));

const request = require('supertest');
const { pool } = require('../config/database');
const { enviarEmailResetPassword } = require('../services/emailService');
const app = require('../app');

afterEach(() => jest.clearAllMocks());

describe('POST /api/portal/auth/solicitar-reset-password', () => {
  it('devuelve 400 si el correo no tiene formato válido', async () => {
    const res = await request(app)
      .post('/api/portal/auth/solicitar-reset-password')
      .send({ email: 'no-es-un-correo' });

    expect(res.status).toBe(400);
    expect(pool.query).not.toHaveBeenCalled();
  });

  it('responde con éxito aunque la cuenta no exista, sin enviar correo (no filtra qué correos existen)', async () => {
    pool.query.mockResolvedValueOnce([[]]);

    const res = await request(app)
      .post('/api/portal/auth/solicitar-reset-password')
      .send({ email: 'fantasma@x.com' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(enviarEmailResetPassword).not.toHaveBeenCalled();
  });

  it('genera un token, lo guarda hasheado y envía el correo cuando la cuenta existe', async () => {
    pool.query
      .mockResolvedValueOnce([[{ id: 8, nombre: 'Sofía', email: 'sofia@x.com' }]]) // SELECT paciente
      .mockResolvedValueOnce([{}]) // DELETE tokens previos sin usar
      .mockResolvedValueOnce([{ insertId: 1 }]); // INSERT token nuevo

    const res = await request(app)
      .post('/api/portal/auth/solicitar-reset-password')
      .send({ email: 'sofia@x.com' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(enviarEmailResetPassword).toHaveBeenCalledTimes(1);

    const llamada = enviarEmailResetPassword.mock.calls[0][0];
    expect(llamada.to).toBe('sofia@x.com');
    expect(llamada.resetUrl).toContain('/portal/restablecer-password?token=');
  });
});

describe('POST /api/portal/auth/confirmar-reset-password', () => {
  it('devuelve 400 si el token no existe', async () => {
    pool.query.mockResolvedValueOnce([[]]);

    const res = await request(app)
      .post('/api/portal/auth/confirmar-reset-password')
      .send({ token: 'token-inexistente-de-prueba', new_password: 'nueva1234' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/no es válido/i);
  });

  it('devuelve 400 si el token ya fue usado', async () => {
    pool.query.mockResolvedValueOnce([[{
      id: 1, paciente_id: 8, fecha_expiracion: new Date(Date.now() + 100000), usado_en: new Date()
    }]]);

    const res = await request(app)
      .post('/api/portal/auth/confirmar-reset-password')
      .send({ token: 'token-ya-usado-de-prueba', new_password: 'nueva1234' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/ya fue utilizado/i);
  });

  it('devuelve 400 si el token expiró', async () => {
    pool.query.mockResolvedValueOnce([[{
      id: 1, paciente_id: 8, fecha_expiracion: new Date(Date.now() - 1000), usado_en: null
    }]]);

    const res = await request(app)
      .post('/api/portal/auth/confirmar-reset-password')
      .send({ token: 'token-expirado-de-prueba', new_password: 'nueva1234' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/expiró/i);
  });

  it('actualiza la contraseña, invalida sesiones previas y marca el token como usado cuando es válido', async () => {
    pool.query
      .mockResolvedValueOnce([[{
        id: 1, paciente_id: 8, fecha_expiracion: new Date(Date.now() + 100000), usado_en: null
      }]]) // SELECT token
      .mockResolvedValueOnce([{}]) // UPDATE pacientes password_hash + tokens_invalidos_antes
      .mockResolvedValueOnce([{}]); // UPDATE portal_password_reset_tokens usado_en

    const res = await request(app)
      .post('/api/portal/auth/confirmar-reset-password')
      .send({ token: 'token-valido-de-prueba', new_password: 'nuevaPass123' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(pool.query).toHaveBeenCalledTimes(3);
    expect(pool.query.mock.calls[1][0]).toMatch(/UPDATE pacientes/);
    expect(pool.query.mock.calls[1][0]).toMatch(/tokens_invalidos_antes = NOW\(\)/);
    expect(pool.query.mock.calls[1][1][1]).toBe(8);
  });
});
