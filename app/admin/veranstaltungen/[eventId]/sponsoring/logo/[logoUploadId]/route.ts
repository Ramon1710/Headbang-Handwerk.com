import { canAccessHeadbangAdmin } from '@/lib/cms/auth-core';
import { getAuthenticatedAdminSessionFromRequest } from '@/lib/cms/auth';
import { readEventSponsoringLogoFile } from '@/lib/event-sponsoring/logo-upload-storage';
import { getEventSponsoringLogoUploadById } from '@/lib/event-sponsoring/store';

function sanitizeDownloadFilename(filename: string) {
  const normalized = filename
    .normalize('NFKD')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  return normalized || 'sponsoring-logo';
}

export async function GET(
  request: Request,
  context: { params: Promise<{ eventId: string; logoUploadId: string }> },
) {
  const session = await getAuthenticatedAdminSessionFromRequest(request);

  if (!canAccessHeadbangAdmin(session)) {
    return new Response('Nicht autorisiert.', { status: 401 });
  }

  const { eventId, logoUploadId } = await context.params;
  const upload = await getEventSponsoringLogoUploadById(logoUploadId);

  if (!upload || upload.eventId !== eventId) {
    return new Response('Datei nicht gefunden.', { status: 404 });
  }

  try {
    const file = await readEventSponsoringLogoFile(upload);

    return new Response(new Uint8Array(file.content), {
      status: 200,
      headers: {
        'Content-Type': file.contentType || 'application/octet-stream',
        'Content-Length': String(file.content.byteLength),
        'Content-Disposition': `attachment; filename="${sanitizeDownloadFilename(file.filename)}"`,
        'Cache-Control': 'private, no-store, max-age=0',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch {
    return new Response('Datei konnte nicht gelesen werden.', { status: 500 });
  }
}