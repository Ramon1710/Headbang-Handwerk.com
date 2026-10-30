import { NextRequest, NextResponse } from 'next/server';
import { isContactEmail, validateContactSubmission } from '@/lib/contact';
import { EmailConfigurationError, sendMailWithMetadata } from '@/lib/email';

export const runtime = 'nodejs';
export const maxDuration = 60;

const CONTACT_RECIPIENT = 'info@headbang-handwerk.de';

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Die Formulardaten konnten nicht gelesen werden. Bitte prüfe deine Eingaben.' }, { status: 400 });
  }

  const submission = validateContactSubmission(body);
  if (!submission) {
    return NextResponse.json({
      error: 'Bitte prüfe die Pflichtfelder, die E-Mail-Adresse und die ausgewählten Interessen. Beachte auch die maximalen Feldlängen.',
    }, { status: 400 });
  }

  try {
    const from = (process.env.SMTP_FROM || process.env.SMTP_USER || '').trim();
    const senderAddress = from.match(/^[^<>\r\n]*<([^<>]+)>$/)?.[1] ?? from;
    if (!isContactEmail(senderAddress) || /[\r\n]/.test(from)) {
      throw new EmailConfigurationError('SMTP sender is not configured correctly');
    }

    await sendMailWithMetadata({
      to: CONTACT_RECIPIENT,
      from,
      replyTo: submission.email,
      subject: `Kontaktanfrage: ${submission.subject}`,
      text: [
        `Name: ${submission.name}`,
        `Unternehmen: ${submission.company || 'Nicht angegeben'}`,
        `E-Mail: ${submission.email}`,
        `Betreff: ${submission.subject}`,
        `Interessen: ${submission.interests.join(', ') || 'Keine ausgewählt'}`,
        '',
        'Nachricht:',
        submission.message,
      ].join('\n'),
      requireAcceptance: true,
    });

    return NextResponse.json({ success: true, status: 'accepted' });
  } catch (error) {
    const configurationError = error instanceof EmailConfigurationError;
    const code = error && typeof error === 'object' && 'code' in error && typeof error.code === 'string'
      && ['EAUTH', 'ECONNECTION', 'ESOCKET', 'ETIMEDOUT', 'EDNS', 'EENVELOPE', 'EMESSAGE'].includes(error.code)
      ? error.code
      : 'SMTP_FAILURE';
    console.error('Contact email failed', {
      category: configurationError ? 'configuration' : 'delivery',
      code: configurationError ? 'SMTP_CONFIG' : code,
    });
    return NextResponse.json({
      error: configurationError
        ? 'Der Mailversand ist derzeit nicht eingerichtet. Deine Nachricht wurde nicht versendet. Bitte schreibe direkt an info@headbang-handwerk.de.'
        : 'Der Maildienst hat den Versand nicht bestätigt. Bitte versuche es später erneut oder schreibe direkt an info@headbang-handwerk.de.',
    }, { status: configurationError ? 503 : 502 });
  }
}
