/**
 * Prueba createRateLimiter directamente (sin pasar por supertest/la app
 * completa) invocando el middleware a mano con req/res simulados. Fuerza
 * temporalmente NODE_ENV a 'development' porque el propio limiter se
 * desactiva por completo cuando NODE_ENV === 'test' (ver rateLimiter.js) —
 * necesario para que el resto de la suite no se vea afectado por el
 * conteo compartido entre tests, pero significa que hay que salir de ese
 * modo aquí para poder probar el límite en sí. Restaura NODE_ENV al
 * terminar para no afectar a otros archivos de test (la suite corre con
 * --runInBand, en el mismo proceso).
 */

const { createRateLimiter } = require('../middleware/rateLimiter');

const mockRes = () => {
  const res = {};
  res.set = jest.fn().mockReturnValue(res);
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('createRateLimiter', () => {
  const NODE_ENV_ORIGINAL = process.env.NODE_ENV;

  beforeEach(() => {
    process.env.NODE_ENV = 'development';
  });

  afterEach(() => {
    process.env.NODE_ENV = NODE_ENV_ORIGINAL;
  });

  it('permite peticiones hasta el máximo y bloquea con 429 al superarlo', () => {
    const limiter = createRateLimiter({ windowMs: 60000, max: 3 });
    const req = { ip: '10.0.0.1' };

    for (let i = 0; i < 3; i++) {
      const res = mockRes();
      const next = jest.fn();
      limiter(req, res, next);
      expect(next).toHaveBeenCalledTimes(1);
      expect(res.status).not.toHaveBeenCalled();
    }

    // Cuarta petición dentro de la misma ventana: bloqueada
    const res = mockRes();
    const next = jest.fn();
    limiter(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(429);
    expect(res.set).toHaveBeenCalledWith('Retry-After', expect.any(String));
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false })
    );
  });

  it('cuenta por IP de forma independiente', () => {
    const limiter = createRateLimiter({ windowMs: 60000, max: 1 });

    const res1 = mockRes();
    const next1 = jest.fn();
    limiter({ ip: '10.0.0.1' }, res1, next1);
    expect(next1).toHaveBeenCalledTimes(1);

    // Otra IP: no debería verse afectada por el conteo de la primera
    const res2 = mockRes();
    const next2 = jest.fn();
    limiter({ ip: '10.0.0.2' }, res2, next2);
    expect(next2).toHaveBeenCalledTimes(1);
    expect(res2.status).not.toHaveBeenCalled();
  });

  it('se desactiva por completo en NODE_ENV=test (para no interferir con el resto de la suite)', () => {
    process.env.NODE_ENV = 'test';
    const limiter = createRateLimiter({ windowMs: 60000, max: 1 });
    const req = { ip: '10.0.0.1' };

    for (let i = 0; i < 5; i++) {
      const res = mockRes();
      const next = jest.fn();
      limiter(req, res, next);
      expect(next).toHaveBeenCalledTimes(1);
      expect(res.status).not.toHaveBeenCalled();
    }
  });
});
