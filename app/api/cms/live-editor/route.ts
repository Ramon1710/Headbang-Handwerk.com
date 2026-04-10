import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/cms/auth';
import { sanitizeLiveEditorBoxStyle, sanitizeLiveEditorHtml } from '@/lib/cms/live-editor';
import { getCmsContent, saveCmsContent } from '@/lib/cms/storage';

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const body = (await request.json()) as
    | { kind: 'richText'; key?: string; html?: string }
    | { kind: 'boxStyle'; key?: string; style?: { width?: string; height?: string; minHeight?: string } };

  if (!body?.key) {
    return NextResponse.json({ error: 'missing-key' }, { status: 400 });
  }

  const current = await getCmsContent();
  const next = {
    ...current,
    site: {
      ...current.site,
      liveEditor: {
        ...current.site.liveEditor,
        richText: { ...current.site.liveEditor.richText },
        boxStyles: { ...current.site.liveEditor.boxStyles },
      },
    },
  };

  if (body.kind === 'richText') {
    next.site.liveEditor.richText[body.key] = sanitizeLiveEditorHtml(String(body.html || ''));
  }

  if (body.kind === 'boxStyle') {
    next.site.liveEditor.boxStyles[body.key] = sanitizeLiveEditorBoxStyle(body.style || {});
  }

  await saveCmsContent(next);
  revalidatePath('/', 'layout');
  revalidatePath('/');

  return NextResponse.json({ ok: true });
}