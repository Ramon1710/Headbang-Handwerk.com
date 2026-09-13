import { createHmac, timingSafeEqual } from 'node:crypto';

const DEFAULT_CONFIRMATION_MAX_AGE_SECONDS = 60 * 30;

interface ConfirmationPayload {
  orderId: string;
  orderNumber: string;
  exp: number;
}

function getConfirmationSecret() {
  return process.env.ZOLLHAUS_CONFIRMATION_SECRET || process.env.ADMIN_SESSION_SECRET || process.env.CMS_SESSION_SECRET || 'zollhaus-confirmation-local-secret';
}

function encodeBase64Url(input: string) {
  return Buffer.from(input, 'utf8').toString('base64url');
}

function decodeBase64Url(input: string) {
  return Buffer.from(input, 'base64url').toString('utf8');
}

function sign(payload: string) {
  return createHmac('sha256', getConfirmationSecret()).update(payload).digest('base64url');
}

export function createZollhausConfirmationToken(input: { orderId: string; orderNumber: string; maxAgeSeconds?: number }) {
  const payload: ConfirmationPayload = {
    orderId: input.orderId,
    orderNumber: input.orderNumber,
    exp: Math.floor(Date.now() / 1000) + (input.maxAgeSeconds ?? DEFAULT_CONFIRMATION_MAX_AGE_SECONDS),
  };

  const encodedPayload = encodeBase64Url(JSON.stringify(payload));
  const signature = sign(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

export function verifyZollhausConfirmationToken(token: string) {
  const [encodedPayload, signature] = String(token || '').split('.');

  if (!encodedPayload || !signature) {
    return null;
  }

  const expectedSignature = sign(encodedPayload);

  if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
    return null;
  }

  try {
    const payload = JSON.parse(decodeBase64Url(encodedPayload)) as ConfirmationPayload;

    if (!payload.orderId || !payload.orderNumber || !payload.exp) {
      return null;
    }

    if (payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}