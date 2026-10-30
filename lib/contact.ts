export const contactInterestOptions = [
  'Sponsoring Bronze',
  'Sponsoring Silber',
  'Sponsoring Gold',
  'Exklusivpartner',
  'Bannerfläche',
  'Allgemeine Anfrage',
];

export const contactFieldLimits = {
  name: 200,
  company: 200,
  email: 254,
  subject: 200,
  message: 10000,
};

export type ContactSubmission = {
  name: string;
  company: string;
  email: string;
  subject: string;
  message: string;
  interests: string[];
};

export function isContactEmail(value: string) {
  return /^[^\s@<>,;:"\\]+@[^\s@<>,;:"\\]+\.[^\s@<>,;:"\\]+$/.test(value);
}

export function validateContactSubmission(value: unknown): ContactSubmission | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const body = value as Record<string, unknown>;
  const fields: Record<string, string> = {};

  for (const [field, limit] of Object.entries(contactFieldLimits)) {
    const raw = body[field] ?? (field === 'company' ? '' : undefined);
    if (typeof raw !== 'string' || raw.length > limit) return null;
    const text = raw.trim();
    if (field !== 'company' && !text) return null;
    if (field === 'message' ? /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(text) : /[\u0000-\u001f\u007f]/.test(text)) return null;
    fields[field] = text;
  }

  if (!isContactEmail(fields.email)) return null;
  const interests = body.interests ?? [];
  if (!Array.isArray(interests) || interests.length > contactInterestOptions.length) return null;
  if (!interests.every((item): item is string => typeof item === 'string' && contactInterestOptions.includes(item))) return null;

  return {
    name: fields.name,
    company: fields.company,
    email: fields.email,
    subject: fields.subject,
    message: fields.message,
    interests: [...new Set(interests)],
  };
}
