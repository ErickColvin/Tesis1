import nodemailer from 'nodemailer';

const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS,
  SMTP_FROM
} = process.env;

let transporter;
function getTransporter() {
  if (transporter) return transporter;
  if (!SMTP_HOST || !SMTP_PORT) {
    console.warn('[email] SMTP no configurado, se omite envio');
    return null;
  }
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: Number(SMTP_PORT) === 465,
    auth: SMTP_USER
      ? {
          user: SMTP_USER,
          pass: SMTP_PASS
        }
      : undefined
  });
  return transporter;
}

export async function sendEmail({ to, subject, text, html }) {
  const tx = getTransporter();
  if (!tx) return false;
  const payload = {
    from: SMTP_FROM || 'alertas@tracelink.local',
    to,
    subject,
    text,
    html
  };
  try {
    await tx.sendMail(payload);
    return true;
  } catch (err) {
    console.error('[email] error enviando correo', err.message);
    return false;
  }
}
