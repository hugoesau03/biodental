/**
 * Configuración del asistente de WhatsApp con IA (OpenAI) y el secreto de
 * webhook de YCloud, guardados en consultorios.configuracion. DB mockeada,
 * igual que el resto de la suite.
 */

jest.mock('../config/database', () => ({
  pool: { query: jest.fn(), getConnection: jest.fn() },
  testConnection: jest.fn().mockResolvedValue(true)
}));

const request = require('supertest');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');
const app = require('../app');

const ADMIN_MOCK = {
  id: 1, uuid: 'uuid-admin-1', email: 'ana@x.com', nombre: 'Ana', apellidos: 'Pérez',
  rol: 'admin', consultorio_id: 1, especialidad: null, activo: 1, es_superadmin: 0,
  tokens_invalidos_antes: null,
  consultorio_nombre: 'Clínica X', consultorio_uuid: 'uuid-consultorio-1'
};

const RECEPCIONISTA_MOCK = {
  ...ADMIN_MOCK, id: 29, uuid: 'uuid-agente-1', email: 'asistente-whatsapp@biodental.local', rol: 'recepcionista'
};

const tokenPara = (usuario) => jwt.sign({ userId: usuario.id, consultorioId: 1 }, process.env.JWT_SECRET, { expiresIn: '1h' });

// Guardar una api_key nueva dispara una llamada de prueba real a la API
// externa (OpenAI/YCloud) antes de guardar — se mockea global.fetch para
// no depender de la red ni de claves reales en los tests.
beforeEach(() => {
  global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
});

afterEach(() => {
  jest.clearAllMocks();
  delete global.fetch;
});

describe('GET /api/consultorio/asistente-whatsapp', () => {
  it('nunca devuelve la api key completa, solo un preview', async () => {
    pool.query
      .mockResolvedValueOnce([[ADMIN_MOCK]]) // authMiddleware
      .mockResolvedValueOnce([[{ configuracion: JSON.stringify({ asistente_ia: { openai_api_key: 'sk-proj-abcd1234', openai_model: 'gpt-4.1' } }) }]]);

    const res = await request(app)
      .get('/api/consultorio/asistente-whatsapp')
      .set('Authorization', `Bearer ${tokenPara(ADMIN_MOCK)}`);

    expect(res.status).toBe(200);
    expect(res.body.data.configurado).toBe(true);
    expect(res.body.data.api_key_preview).toBe('••••1234');
    expect(res.body.data.modelo).toBe('gpt-4.1');
    expect(JSON.stringify(res.body)).not.toMatch(/sk-proj-abcd1234/);
  });

  it('devuelve 403 si no es admin', async () => {
    pool.query.mockResolvedValueOnce([[RECEPCIONISTA_MOCK]]); // authMiddleware

    const res = await request(app)
      .get('/api/consultorio/asistente-whatsapp')
      .set('Authorization', `Bearer ${tokenPara(RECEPCIONISTA_MOCK)}`);

    expect(res.status).toBe(403);
  });
});

describe('PUT /api/consultorio/asistente-whatsapp', () => {
  it('guarda una api key nueva', async () => {
    pool.query
      .mockResolvedValueOnce([[ADMIN_MOCK]]) // authMiddleware
      .mockResolvedValueOnce([[{ configuracion: null }]]) // SELECT configuracion actual
      .mockResolvedValueOnce([{}]); // UPDATE

    const res = await request(app)
      .put('/api/consultorio/asistente-whatsapp')
      .set('Authorization', `Bearer ${tokenPara(ADMIN_MOCK)}`)
      .send({ api_key: 'sk-proj-nueva-key', modelo: 'gpt-4.1' });

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/verificada/i);
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.openai.com/v1/models',
      expect.objectContaining({ headers: { Authorization: 'Bearer sk-proj-nueva-key' } })
    );
    const updateCall = pool.query.mock.calls[2];
    const configuracionGuardada = JSON.parse(updateCall[1][0]);
    expect(configuracionGuardada.asistente_ia.openai_api_key).toBe('sk-proj-nueva-key');
  });

  it('no guarda la api key si la prueba contra OpenAI falla', async () => {
    global.fetch.mockResolvedValueOnce({ ok: false, status: 401, json: async () => ({ error: { message: 'Incorrect API key provided' } }) });
    pool.query
      .mockResolvedValueOnce([[ADMIN_MOCK]]) // authMiddleware
      .mockResolvedValueOnce([[{ configuracion: null }]]); // SELECT configuracion actual

    const res = await request(app)
      .put('/api/consultorio/asistente-whatsapp')
      .set('Authorization', `Bearer ${tokenPara(ADMIN_MOCK)}`)
      .send({ api_key: 'sk-invalida' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/no es válida/i);
    // Se consultó la config actual pero nunca se llegó al UPDATE
    expect(pool.query).toHaveBeenCalledTimes(2);
  });

  it('no borra la api key existente si se guardan otros campos sin mandarla', async () => {
    pool.query
      .mockResolvedValueOnce([[ADMIN_MOCK]])
      .mockResolvedValueOnce([[{ configuracion: JSON.stringify({ asistente_ia: { openai_api_key: 'sk-proj-existente', openai_model: 'gpt-4.1' } }) }]])
      .mockResolvedValueOnce([{}]);

    const res = await request(app)
      .put('/api/consultorio/asistente-whatsapp')
      .set('Authorization', `Bearer ${tokenPara(ADMIN_MOCK)}`)
      .send({ modelo: 'gpt-4.1-mini' });

    expect(res.status).toBe(200);
    const updateCall = pool.query.mock.calls[2];
    const configuracionGuardada = JSON.parse(updateCall[1][0]);
    expect(configuracionGuardada.asistente_ia.openai_api_key).toBe('sk-proj-existente');
    expect(configuracionGuardada.asistente_ia.openai_model).toBe('gpt-4.1-mini');
  });

  it('borra la api key cuando se manda clear_api_key', async () => {
    pool.query
      .mockResolvedValueOnce([[ADMIN_MOCK]])
      .mockResolvedValueOnce([[{ configuracion: JSON.stringify({ asistente_ia: { openai_api_key: 'sk-proj-existente' } }) }]])
      .mockResolvedValueOnce([{}]);

    const res = await request(app)
      .put('/api/consultorio/asistente-whatsapp')
      .set('Authorization', `Bearer ${tokenPara(ADMIN_MOCK)}`)
      .send({ clear_api_key: true });

    expect(res.status).toBe(200);
    const updateCall = pool.query.mock.calls[2];
    const configuracionGuardada = JSON.parse(updateCall[1][0]);
    expect(configuracionGuardada.asistente_ia.openai_api_key).toBe('');
  });
});

describe('GET /api/consultorio/asistente-whatsapp/credenciales', () => {
  it('devuelve las credenciales completas (sin enmascarar) a cualquier staff autenticado, no solo admin', async () => {
    pool.query
      .mockResolvedValueOnce([[RECEPCIONISTA_MOCK]]) // authMiddleware — la propia cuenta del bot
      .mockResolvedValueOnce([[{
        configuracion: JSON.stringify({
          asistente_ia: { openai_api_key: 'sk-proj-real', openai_model: 'gpt-4.1' },
          whatsapp: { ycloud_api_key: 'yc-real', ycloud_whatsapp_from: '+525512345678', ycloud_webhook_secret: 'sec-real', prefijo_pais: '+52' }
        })
      }]]);

    const res = await request(app)
      .get('/api/consultorio/asistente-whatsapp/credenciales')
      .set('Authorization', `Bearer ${tokenPara(RECEPCIONISTA_MOCK)}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({
      openai_api_key: 'sk-proj-real',
      openai_model: 'gpt-4.1',
      ycloud_api_key: 'yc-real',
      ycloud_whatsapp_from: '+525512345678',
      ycloud_webhook_secret: 'sec-real',
      prefijo_pais: '+52'
    });
  });

  it('devuelve 401 sin token', async () => {
    const res = await request(app).get('/api/consultorio/asistente-whatsapp/credenciales');
    expect(res.status).toBe(401);
  });
});

describe('PUT /api/consultorio/whatsapp — prueba de la api key de YCloud', () => {
  it('guarda la api key cuando la prueba contra YCloud es exitosa', async () => {
    global.fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ items: [{ phoneNumber: '+525512345678' }] }) });
    pool.query
      .mockResolvedValueOnce([[ADMIN_MOCK]]) // authMiddleware
      .mockResolvedValueOnce([[{ configuracion: null }]]) // SELECT configuracion actual
      .mockResolvedValueOnce([{}]); // UPDATE

    const res = await request(app)
      .put('/api/consultorio/whatsapp')
      .set('Authorization', `Bearer ${tokenPara(ADMIN_MOCK)}`)
      .send({ api_key: 'yc-nueva-key' });

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/verificada/i);
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.ycloud.com/v2/whatsapp/phoneNumbers',
      expect.objectContaining({ headers: { 'X-API-Key': 'yc-nueva-key' } })
    );
    const updateCall = pool.query.mock.calls[2];
    const configuracionGuardada = JSON.parse(updateCall[1][0]);
    expect(configuracionGuardada.whatsapp.ycloud_api_key).toBe('yc-nueva-key');
  });

  it('no guarda la api key si la prueba contra YCloud falla', async () => {
    global.fetch.mockResolvedValueOnce({ ok: false, status: 401, json: async () => ({ message: 'Unauthorized' }) });
    pool.query
      .mockResolvedValueOnce([[ADMIN_MOCK]]) // authMiddleware
      .mockResolvedValueOnce([[{ configuracion: null }]]); // SELECT configuracion actual

    const res = await request(app)
      .put('/api/consultorio/whatsapp')
      .set('Authorization', `Bearer ${tokenPara(ADMIN_MOCK)}`)
      .send({ api_key: 'yc-invalida' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/no es válida/i);
    expect(pool.query).toHaveBeenCalledTimes(2);
  });
});

describe('PUT /api/consultorio/whatsapp — webhook secret', () => {
  it('guarda el webhook secret y lo enmascara al leerlo', async () => {
    pool.query
      .mockResolvedValueOnce([[ADMIN_MOCK]]) // authMiddleware
      .mockResolvedValueOnce([[{ configuracion: null }]])
      .mockResolvedValueOnce([{}]);

    const putRes = await request(app)
      .put('/api/consultorio/whatsapp')
      .set('Authorization', `Bearer ${tokenPara(ADMIN_MOCK)}`)
      .send({ webhook_secret: 'secreto-de-prueba-1234' });

    expect(putRes.status).toBe(200);
    const updateCall = pool.query.mock.calls[2];
    const configuracionGuardada = JSON.parse(updateCall[1][0]);
    expect(configuracionGuardada.whatsapp.ycloud_webhook_secret).toBe('secreto-de-prueba-1234');

    pool.query
      .mockResolvedValueOnce([[ADMIN_MOCK]])
      .mockResolvedValueOnce([[{ configuracion: JSON.stringify(configuracionGuardada) }]]);

    const getRes = await request(app)
      .get('/api/consultorio/whatsapp')
      .set('Authorization', `Bearer ${tokenPara(ADMIN_MOCK)}`);

    expect(getRes.body.data.webhook_secret_configurado).toBe(true);
    expect(getRes.body.data.webhook_secret_preview).toBe('••••1234');
    expect(JSON.stringify(getRes.body)).not.toMatch(/secreto-de-prueba-1234/);
  });
});
