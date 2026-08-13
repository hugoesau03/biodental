const nodemailer = require('nodemailer');

/**
 * Envío de correos transaccionales (por ahora solo el de restablecer
 * contraseña). Se configura con variables de entorno SMTP genéricas —
 * funciona con Gmail, SendGrid, Mailgun, Amazon SES o un servidor propio,
 * lo que se tenga a mano.
 *
 * Si no hay SMTP configurado (SMTP_HOST vacío) no se lanza error: se
 * registra el contenido del correo en consola. Es el comportamiento
 * esperado en desarrollo local sin credenciales — el flujo de restablecer
 * contraseña sigue siendo probable de punta a punta leyendo el enlace del
 * log del servidor.
 */

let transporter = null;
let transporterInicializado = false;

const obtenerTransporter = () => {
  if (transporterInicializado) return transporter;
  transporterInicializado = true;

  if (!process.env.SMTP_HOST) {
    return null;
  }

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true', // true para el puerto 465, false para STARTTLS (587)
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
      : undefined
  });

  return transporter;
};

const remitente = () => process.env.SMTP_FROM || 'Bio Dental <no-reply@biodental.local>';

const enviarEmail = async ({ to, subject, html, text }) => {
  const t = obtenerTransporter();

  if (!t) {
    console.warn('⚠️  SMTP no configurado (SMTP_HOST vacío) — correo no enviado, solo mostrado aquí:');
    console.warn(`   Para: ${to}`);
    console.warn(`   Asunto: ${subject}`);
    console.warn(`   ${text || html}`);
    return { simulado: true };
  }

  return t.sendMail({ from: remitente(), to, subject, html, text });
};

const enviarEmailResetPassword = async ({ to, nombre, resetUrl }) => {
  const subject = 'Restablece tu contraseña — Bio Dental';
  const saludo = nombre ? `Hola ${nombre},` : 'Hola,';

  const text = `${saludo}\n\nRecibimos una solicitud para restablecer tu contraseña en Bio Dental. Este enlace es válido durante 1 hora:\n${resetUrl}\n\nSi tú no solicitaste esto, ignora este correo — tu contraseña seguirá siendo la misma.`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #1a1a1a;">
      <h2 style="color:#1E88E5;">Restablece tu contraseña</h2>
      <p>${saludo}</p>
      <p>Recibimos una solicitud para restablecer tu contraseña en Bio Dental. Este enlace es válido durante <strong>1 hora</strong>:</p>
      <p style="text-align:center; margin: 24px 0;">
        <a href="${resetUrl}" style="background:#1E88E5; color:#fff; padding:12px 24px; border-radius:8px; text-decoration:none; font-weight:600; display:inline-block;">
          Restablecer contraseña
        </a>
      </p>
      <p style="font-size:12px; color:#888;">Si tú no solicitaste esto, ignora este correo — tu contraseña seguirá siendo la misma.</p>
    </div>
  `;

  return enviarEmail({ to, subject, html, text });
};

module.exports = { enviarEmail, enviarEmailResetPassword };
