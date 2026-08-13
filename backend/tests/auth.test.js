/**
 * Tests del flujo de autenticación, incluyendo el nuevo flujo de
 * restablecer contraseña con token de un solo uso.
 *
 * La base de datos se mockea por completo (jest.mock del pool de
 * config/database) — estos tests nunca tocan MySQL real, ni el de
 * desarrollo local ni el de producción. Cada test controla exactamente
 * qué devuelve cada `pool.query(...)` en el orden en que el controlador
 * las llama.
 */

jest.mock('../config/database', () => ({
  pool: {
    query: jest.fn(),
    getConnection: jest.fn()
  },
  testConnection: jest.fn().mockResolvedValue(true)
}));

jest.mock('../services/emailService', () => ({
  enviarEmailResetPassword: jest.fn().mockResolvedValue({ simulado: true }),
  enviarEmail: jest.fn().mockResolvedValue({ simulado: true })
}));

const request = require('supertest');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');
const { enviarEmailResetPassword } = require('../services/emailService');
const app = require('../app');

// Firma un token igual al que emitiría authController.login, para probar
// authMiddleware directamente sin pasar por el login real.
const firmarTokenStaff = (userId, { iat } = {}) =>
  jwt.sign(
    { userId, consultorioId: 1, ...(iat ? { iat } : {}) },
    process.env.JWT_SECRET,
    iat ? {} : { expiresIn: '1h' } // jsonwebtoken rechaza expiresIn junto con un iat explícito
  );

afterEach(() => {
  jest.clearAllMocks();
});

describe('POST /api/auth/login', () => {
  it('devuelve 400 si falta email o password', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'a@a.com' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(pool.query).not.toHaveBeenCalled();
  });

  it('devuelve 401 si no existe una cuenta activa con ese correo', async () => {
    pool.query.mockResolvedValueOnce([[]]);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'noexiste@x.com', password: 'password123' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('devuelve 401 si la contraseña no coincide', async () => {
    const hash = await bcrypt.hash('correcta123', 10);
    pool.query.mockResolvedValueOnce([[{ id: 1, password_hash: hash, consultorio_id: 1 }]]);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'a@a.com', password: 'incorrecta' });

    expect(res.status).toBe(401);
  });

  it('devuelve un token cuando las credenciales son correctas', async () => {
    const hash = await bcrypt.hash('correcta123', 10);
    pool.query
      .mockResolvedValueOnce([[{
        id: 1,
        uuid: 'uuid-usuario-1',
        email: 'a@a.com',
        password_hash: hash,
        consultorio_id: 1,
        nombre: 'Ana',
        apellidos: 'Pérez',
        rol: 'admin',
        especialidad: null,
        avatar_url: null,
        es_superadmin: 0,
        consultorio_nombre: 'Clínica X',
        consultorio_uuid: 'uuid-consultorio-1',
        consultorio_slug: 'clinica-x'
      }]])
      .mockResolvedValueOnce([{}]); // UPDATE usuarios SET ultimo_login

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'a@a.com', password: 'correcta123' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toEqual(expect.any(String));
    expect(res.body.data.usuario.email).toBe('a@a.com');
  });
});

describe('GET /api/auth/me', () => {
  it('devuelve 401 sin token de autenticación', async () => {
    const res = await request(app).get('/api/auth/me');

    expect(res.status).toBe(401);
    expect(pool.query).not.toHaveBeenCalled();
  });
});

describe('Revocación de tokens (tokens_invalidos_antes)', () => {
  const usuarioBase = {
    id: 7,
    uuid: 'uuid-usuario-7',
    email: 'ana@x.com',
    nombre: 'Ana',
    apellidos: 'Pérez',
    rol: 'admin',
    consultorio_id: 1,
    especialidad: null,
    activo: 1,
    es_superadmin: 0,
    consultorio_nombre: 'Clínica X',
    consultorio_uuid: 'uuid-consultorio-1'
  };

  it('rechaza un token emitido antes de tokens_invalidos_antes (sesión cerrada en otro dispositivo / cambio de contraseña)', async () => {
    const iatAntiguo = Math.floor(Date.now() / 1000) - 3600; // hace 1 hora
    const token = firmarTokenStaff(usuarioBase.id, { iat: iatAntiguo });

    pool.query.mockResolvedValueOnce([[{
      ...usuarioBase,
      // La revocación es 10 minutos más reciente que el token → debe rechazarlo
      tokens_invalidos_antes: new Date(Date.now() - 10 * 60 * 1000)
    }]]);

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/sesión cerrada/i);
  });

  it('acepta un token emitido después de tokens_invalidos_antes', async () => {
    const token = firmarTokenStaff(usuarioBase.id); // iat = ahora

    pool.query
      .mockResolvedValueOnce([[{
        ...usuarioBase,
        // La revocación quedó registrada antes de que se emitiera el token → sigue siendo válido
        tokens_invalidos_antes: new Date(Date.now() - 60 * 60 * 1000)
      }]])
      .mockResolvedValueOnce([[{ ...usuarioBase, consultorio_slug: 'clinica-x', plan: 'basico' }]]); // SELECT dentro de getMe

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
  });

  it('acepta un token cuando tokens_invalidos_antes es NULL (nunca se cerró sesión ni cambió contraseña)', async () => {
    const token = firmarTokenStaff(usuarioBase.id);

    pool.query
      .mockResolvedValueOnce([[{ ...usuarioBase, tokens_invalidos_antes: null }]])
      .mockResolvedValueOnce([[{ ...usuarioBase, consultorio_slug: 'clinica-x', plan: 'basico' }]]);

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
  });
});

describe('POST /api/auth/logout', () => {
  it('devuelve 401 sin token', async () => {
    const res = await request(app).post('/api/auth/logout');

    expect(res.status).toBe(401);
  });

  it('marca tokens_invalidos_antes = NOW() para el usuario autenticado', async () => {
    const token = firmarTokenStaff(7);

    pool.query
      .mockResolvedValueOnce([[{
        id: 7, uuid: 'uuid-usuario-7', email: 'ana@x.com', nombre: 'Ana', apellidos: 'Pérez',
        rol: 'admin', consultorio_id: 1, especialidad: null, activo: 1, es_superadmin: 0,
        tokens_invalidos_antes: null,
        consultorio_nombre: 'Clínica X', consultorio_uuid: 'uuid-consultorio-1'
      }]]) // authMiddleware
      .mockResolvedValueOnce([{}]); // UPDATE usuarios SET tokens_invalidos_antes

    const res = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(pool.query.mock.calls[1][0]).toMatch(/UPDATE usuarios SET tokens_invalidos_antes/);
    expect(pool.query.mock.calls[1][1]).toEqual([7]);
  });
});

describe('PUT /api/auth/password', () => {
  it('invalida las demás sesiones al cambiar la contraseña (tokens_invalidos_antes = NOW())', async () => {
    const token = firmarTokenStaff(7);
    const hashActual = await bcrypt.hash('actual12345', 10);

    pool.query
      .mockResolvedValueOnce([[{
        id: 7, uuid: 'uuid-usuario-7', email: 'ana@x.com', nombre: 'Ana', apellidos: 'Pérez',
        rol: 'admin', consultorio_id: 1, especialidad: null, activo: 1, es_superadmin: 0,
        tokens_invalidos_antes: null,
        consultorio_nombre: 'Clínica X', consultorio_uuid: 'uuid-consultorio-1'
      }]]) // authMiddleware
      .mockResolvedValueOnce([[{ password_hash: hashActual }]]) // SELECT password_hash
      .mockResolvedValueOnce([{}]); // UPDATE usuarios SET password_hash, tokens_invalidos_antes

    const res = await request(app)
      .put('/api/auth/password')
      .set('Authorization', `Bearer ${token}`)
      .send({ current_password: 'actual12345', new_password: 'nuevaPass123' });

    expect(res.status).toBe(200);
    expect(pool.query.mock.calls[2][0]).toMatch(/tokens_invalidos_antes = NOW\(\)/);
  });
});

describe('POST /api/auth/solicitar-reset-password', () => {
  it('devuelve 400 si falta el email', async () => {
    const res = await request(app).post('/api/auth/solicitar-reset-password').send({});

    expect(res.status).toBe(400);
  });

  it('responde con éxito aunque la cuenta no exista, sin enviar correo (no filtra qué correos existen)', async () => {
    pool.query.mockResolvedValueOnce([[]]);

    const res = await request(app)
      .post('/api/auth/solicitar-reset-password')
      .send({ email: 'fantasma@x.com' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(enviarEmailResetPassword).not.toHaveBeenCalled();
  });

  it('genera un token, lo guarda hasheado y envía el correo cuando la cuenta existe', async () => {
    pool.query
      .mockResolvedValueOnce([[{ id: 5, nombre: 'Ana', email: 'ana@x.com' }]]) // SELECT usuario
      .mockResolvedValueOnce([{}]) // DELETE tokens previos sin usar
      .mockResolvedValueOnce([{ insertId: 1 }]); // INSERT token nuevo

    const res = await request(app)
      .post('/api/auth/solicitar-reset-password')
      .send({ email: 'ana@x.com' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(enviarEmailResetPassword).toHaveBeenCalledTimes(1);

    const llamada = enviarEmailResetPassword.mock.calls[0][0];
    expect(llamada.to).toBe('ana@x.com');
    expect(llamada.resetUrl).toContain('/restablecer-password?token=');

    // El token guardado en la BD debe ser un hash, no el token en claro del enlace
    const tokenPlano = llamada.resetUrl.split('token=')[1];
    const insertCall = pool.query.mock.calls[2];
    expect(insertCall[1][1]).not.toBe(tokenPlano);
    expect(insertCall[1][1]).toHaveLength(64); // hex de sha256
  });

  it('responde con éxito aunque falle el envío del correo (no revela el error al cliente)', async () => {
    pool.query
      .mockResolvedValueOnce([[{ id: 5, nombre: 'Ana', email: 'ana@x.com' }]])
      .mockResolvedValueOnce([{}])
      .mockResolvedValueOnce([{ insertId: 1 }]);
    enviarEmailResetPassword.mockRejectedValueOnce(new Error('SMTP caído'));

    const res = await request(app)
      .post('/api/auth/solicitar-reset-password')
      .send({ email: 'ana@x.com' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

describe('POST /api/auth/confirmar-reset-password', () => {
  it('devuelve 400 si falta el token o la nueva contraseña', async () => {
    const res = await request(app).post('/api/auth/confirmar-reset-password').send({ token: 'x' });

    expect(res.status).toBe(400);
  });

  it('devuelve 400 si la nueva contraseña es muy corta', async () => {
    const res = await request(app)
      .post('/api/auth/confirmar-reset-password')
      .send({ token: 'x', new_password: '123' });

    expect(res.status).toBe(400);
  });

  it('devuelve 400 si el token no existe', async () => {
    pool.query.mockResolvedValueOnce([[]]);

    const res = await request(app)
      .post('/api/auth/confirmar-reset-password')
      .send({ token: 'token-inexistente-de-prueba', new_password: 'nueva1234' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/no es válido/i);
  });

  it('devuelve 400 si el token ya fue usado', async () => {
    pool.query.mockResolvedValueOnce([[{
      id: 1, usuario_id: 5, fecha_expiracion: new Date(Date.now() + 100000), usado_en: new Date()
    }]]);

    const res = await request(app)
      .post('/api/auth/confirmar-reset-password')
      .send({ token: 'token-ya-usado-de-prueba', new_password: 'nueva1234' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/ya fue utilizado/i);
  });

  it('devuelve 400 si el token expiró', async () => {
    pool.query.mockResolvedValueOnce([[{
      id: 1, usuario_id: 5, fecha_expiracion: new Date(Date.now() - 1000), usado_en: null
    }]]);

    const res = await request(app)
      .post('/api/auth/confirmar-reset-password')
      .send({ token: 'token-expirado-de-prueba', new_password: 'nueva1234' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/expiró/i);
  });

  it('actualiza la contraseña y marca el token como usado cuando es válido', async () => {
    pool.query
      .mockResolvedValueOnce([[{
        id: 1, usuario_id: 5, fecha_expiracion: new Date(Date.now() + 100000), usado_en: null
      }]]) // SELECT token
      .mockResolvedValueOnce([{}]) // UPDATE usuarios password_hash
      .mockResolvedValueOnce([{}]); // UPDATE password_reset_tokens usado_en

    const res = await request(app)
      .post('/api/auth/confirmar-reset-password')
      .send({ token: 'token-valido-de-prueba', new_password: 'nuevaPass123' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(pool.query).toHaveBeenCalledTimes(3);
    // La segunda llamada debe ser el UPDATE de la contraseña del usuario correcto
    expect(pool.query.mock.calls[1][0]).toMatch(/UPDATE usuarios/);
    // Un reset de contraseña también debe cerrar cualquier otra sesión abierta
    expect(pool.query.mock.calls[1][0]).toMatch(/tokens_invalidos_antes = NOW\(\)/);
    expect(pool.query.mock.calls[1][1][1]).toBe(5);
  });
});

describe('POST /api/auth/register', () => {
  it('devuelve 400 si faltan campos requeridos', async () => {
    const res = await request(app).post('/api/auth/register').send({ usuario_email: 'a@a.com' });

    expect(res.status).toBe(400);
  });

  it('devuelve 400 si la contraseña es muy corta', async () => {
    const res = await request(app).post('/api/auth/register').send({
      consultorio_nombre: 'Clínica X',
      usuario_nombre: 'Ana',
      usuario_email: 'ana@x.com',
      password: '1234567'
    });

    expect(res.status).toBe(400);
    // Ahora la valida express-validator antes de llegar al controlador —
    // el mensaje específico viaja en el arreglo `errors`, no en `message`.
    expect(res.body.errors.some((e) => /al menos 8 caracteres/i.test(e.mensaje))).toBe(true);
  });

  it('devuelve 400 si el correo no tiene formato válido', async () => {
    const res = await request(app).post('/api/auth/register').send({
      consultorio_nombre: 'Clínica X',
      usuario_nombre: 'Ana',
      usuario_email: 'no-es-un-correo',
      password: 'password123'
    });

    expect(res.status).toBe(400);
    expect(res.body.errors.some((e) => e.campo === 'usuario_email')).toBe(true);
    expect(pool.query).not.toHaveBeenCalled();
  });
});
