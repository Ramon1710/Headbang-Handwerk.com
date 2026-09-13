import nodemailer from 'nodemailer';

let transporterPromise: Promise<nodemailer.Transporter> | null = null;

function createTransporter() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    throw new Error('SMTP is not configured');
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
  });
}

async function getTransporter() {
  if (!transporterPromise) {
    transporterPromise = Promise.resolve(createTransporter());
  }

  return transporterPromise;
}

export async function sendMailWithMetadata(options: {
  to: string;
  subject: string;
  text: string;
  html?: string;
  messageId?: string;
  headers?: Record<string, string>;
}) {
  const transporter = await getTransporter();

  const result = await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html,
    ...(options.messageId ? { messageId: options.messageId } : {}),
    ...(options.headers ? { headers: options.headers } : {}),
  });

  return {
    messageId: result.messageId || null,
  };
}

export async function sendMail(options: { to: string; subject: string; text: string; html?: string }) {
  await sendMailWithMetadata(options);
}