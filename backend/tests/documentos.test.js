/**
 * Valida que POST /api/pacientes/:uuid/documentos rechace archivos con
 * MIME no permitido o que excedan el tamaño máximo, y que confíe en el
 * tipo/tamaño verificado del contenido real — no en lo que declare el
 * cliente. La DB se mockea igual que en auth.test.js.
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

const dataUrl = (mime, bytes) => `data:${mime};base64,${Buffer.alloc(bytes, 'a').toString('base64')}`;

afterEach(() => jest.clearAllMocks());

describe('POST /api/pacientes/:uuid/documentos', () => {
  it('rechaza un tipo de archivo no permitido (p. ej. un ejecutable disfrazado de "imagen")', async () => {
    pool.query.mockResolvedValueOnce([[USUARIO_MOCK]]); // authMiddleware

    const res = await request(app)
      .post('/api/pacientes/uuid-paciente-1/documentos')
      .set('Authorization', `Bearer ${token()}`)
      .send({
        nombre: 'radiografia.png',
        contenido: dataUrl('application/x-msdownload', 100)
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/no permitido/i);
    // No debió siquiera consultar si el paciente existe
    expect(pool.query).toHaveBeenCalledTimes(1);
  });

  it('rechaza un archivo que excede el tamaño máximo', async () => {
    pool.query.mockResolvedValueOnce([[USUARIO_MOCK]]); // authMiddleware

    const res = await request(app)
      .post('/api/pacientes/uuid-paciente-1/documentos')
      .set('Authorization', `Bearer ${token()}`)
      .send({
        nombre: 'radiografia.png',
        contenido: dataUrl('image/png', 11 * 1024 * 1024) // 11MB > límite de 10MB
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/tamaño máximo/i);
  });

  it('acepta un PDF válido y guarda el tipo/tamaño verificado, no el declarado por el cliente', async () => {
    pool.query
      .mockResolvedValueOnce([[USUARIO_MOCK]]) // authMiddleware
      .mockResolvedValueOnce([[{ id: 42 }]]) // SELECT paciente
      .mockResolvedValueOnce([{ insertId: 99 }]); // INSERT documento

    const res = await request(app)
      .post('/api/pacientes/uuid-paciente-1/documentos')
      .set('Authorization', `Bearer ${token()}`)
      .send({
        nombre: 'consentimiento.pdf',
        // El cliente podría mandar cualquier cosa aquí — no se usa
        tipo_archivo: 'lo-que-sea',
        tamanio: 1,
        contenido: dataUrl('application/pdf', 500)
      });

    expect(res.status).toBe(201);
    expect(res.body.data.tipo_archivo).toBe('application/pdf');
    expect(res.body.data.tamanio).toBeGreaterThan(0);

    const insertCall = pool.query.mock.calls[2];
    expect(insertCall[1][3]).toBe('application/pdf'); // tipo_archivo real, no 'lo-que-sea'
  });
});
