/**
 * Validación de archivos enviados como data URL base64
 * (`data:<mime>;base64,<...>`) — este backend no tiene subida multipart,
 * avatares y documentos de paciente viajan así dentro del JSON. Antes de
 * este validador, el backend confiaba ciegamente en el `tipo_archivo` y
 * `tamanio` que mandara el cliente, sin verificar nada del contenido real.
 */

const parseDataUrl = (dataUrl) => {
  if (typeof dataUrl !== 'string') return null;
  const match = dataUrl.match(/^data:([a-zA-Z0-9.+-]+\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!match) return null;
  return { mime: match[1].toLowerCase(), base64: match[2] };
};

/**
 * @param {string} dataUrl - contenido a validar
 * @param {{mimesPermitidos: string[], maxBytes: number}} opciones
 * @returns {{valido: true, mime: string, bytes: number} | {valido: false, error: string}}
 */
const validarArchivoBase64 = (dataUrl, { mimesPermitidos, maxBytes }) => {
  const parsed = parseDataUrl(dataUrl);

  if (!parsed) {
    return {
      valido: false,
      error: 'El archivo debe enviarse como data URL base64 válida (data:<tipo>;base64,...)'
    };
  }

  if (!mimesPermitidos.includes(parsed.mime)) {
    return {
      valido: false,
      error: `Tipo de archivo no permitido (${parsed.mime}). Permitidos: ${mimesPermitidos.join(', ')}`
    };
  }

  // Tamaño real decodificado — nunca confiar en un campo "tamanio" que
  // mande el cliente. Cada 4 caracteres base64 codifican 3 bytes; se
  // descuenta el padding '=' final.
  const padding = (parsed.base64.match(/=+$/) || [''])[0].length;
  const bytes = Math.floor((parsed.base64.length * 3) / 4) - padding;

  if (bytes > maxBytes) {
    return {
      valido: false,
      error: `El archivo supera el tamaño máximo permitido (${Math.round((maxBytes / 1024 / 1024) * 10) / 10}MB)`
    };
  }

  return { valido: true, mime: parsed.mime, bytes };
};

module.exports = { validarArchivoBase64 };
