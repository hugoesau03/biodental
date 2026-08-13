const { validarArchivoBase64 } = require('../utils/archivoValidator');

const dataUrl = (mime, bytes) => {
  const buffer = Buffer.alloc(bytes, 'a');
  return `data:${mime};base64,${buffer.toString('base64')}`;
};

describe('validarArchivoBase64', () => {
  it('acepta un archivo con MIME permitido y dentro del límite de tamaño', () => {
    const resultado = validarArchivoBase64(dataUrl('image/png', 1000), {
      mimesPermitidos: ['image/png', 'image/jpeg'],
      maxBytes: 2000
    });

    expect(resultado.valido).toBe(true);
    expect(resultado.mime).toBe('image/png');
    expect(resultado.bytes).toBeCloseTo(1000, -1); // el base64 no da el byte exacto, pero debe rondarlo
  });

  it('rechaza un tipo MIME que no está en la whitelist, aunque el cliente lo declare distinto', () => {
    const resultado = validarArchivoBase64(dataUrl('text/html', 100), {
      mimesPermitidos: ['image/png', 'image/jpeg'],
      maxBytes: 2000
    });

    expect(resultado.valido).toBe(false);
    expect(resultado.error).toMatch(/no permitido/i);
  });

  it('rechaza contenido que no es una data URL válida', () => {
    const resultado = validarArchivoBase64('esto-no-es-una-data-url', {
      mimesPermitidos: ['image/png'],
      maxBytes: 2000
    });

    expect(resultado.valido).toBe(false);
    expect(resultado.error).toMatch(/data url/i);
  });

  it('rechaza contenido que no es un string (p. ej. un objeto)', () => {
    const resultado = validarArchivoBase64({ foo: 'bar' }, {
      mimesPermitidos: ['image/png'],
      maxBytes: 2000
    });

    expect(resultado.valido).toBe(false);
  });

  it('rechaza un archivo que excede el tamaño máximo, calculado sobre el contenido real (no lo que declare el cliente)', () => {
    const resultado = validarArchivoBase64(dataUrl('image/png', 5000), {
      mimesPermitidos: ['image/png'],
      maxBytes: 2000
    });

    expect(resultado.valido).toBe(false);
    expect(resultado.error).toMatch(/tamaño máximo/i);
  });
});
