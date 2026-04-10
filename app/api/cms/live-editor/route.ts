import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/cms/auth';
import { sanitizeLiveEditorBoxStyle, sanitizeLiveEditorHtml } from '@/lib/cms/live-editor';
import {
  getCmsContent,
  isFirebaseAuthSaveError,
  isInvalidFirebaseSaveError,
  isReadonlyFallbackError,
  saveCmsContent,
} from '@/lib/cms/storage';

export async function POST(request: Request) {
  try {
    if (!(await isAdminAuthenticated())) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    const body = (await request.json()) as
      | { kind: 'richText'; key?: string; html?: string }
      | { kind: 'boxStyle'; key?: string; style?: { width?: string; height?: string; minHeight?: string; x?: string; y?: string } }
      | { kind: 'boxStyles'; styles?: Record<string, { width?: string; height?: string; minHeight?: string; x?: string; y?: string }> };

    if (body.kind !== 'boxStyles' && !body?.key) {
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
      const key = body.key;

      if (!key) {
        return NextResponse.json({ error: 'missing-key' }, { status: 400 });
      }

      next.site.liveEditor.richText[key] = sanitizeLiveEditorHtml(String(body.html || ''));
    }

    if (body.kind === 'boxStyle') {
      const key = body.key;

      if (!key) {
        return NextResponse.json({ error: 'missing-key' }, { status: 400 });
      }

      next.site.liveEditor.boxStyles[key] = sanitizeLiveEditorBoxStyle(body.style || {});
    }

    if (body.kind === 'boxStyles') {
      for (const [key, style] of Object.entries(body.styles || {})) {
        next.site.liveEditor.boxStyles[key] = sanitizeLiveEditorBoxStyle(style || {});
      }
    }

    try {
      await saveCmsContent(next);
    } catch (error) {
      if (isReadonlyFallbackError(error)) {
        return NextResponse.json({ error: 'missing-config' }, { status: 503 });
      }

      if (isInvalidFirebaseSaveError(error)) {
        return NextResponse.json({ error: 'invalid-firebase' }, { status: 500 });
      }

      if (isFirebaseAuthSaveError(error)) {
        return NextResponse.json({ error: 'firebase-auth' }, { status: 401 });
      }

      return NextResponse.json(
        {
          error: 'unknown-save-error',
          detail: error instanceof Error ? error.message : 'unknown',
        },
        { status: 500 }
      );
    }

    try {
      revalidatePath('/', 'layout');
      revalidatePath('/');
    } catch {
      // Saving layout changes is more important than cache invalidation; a later refresh can still pick them up.
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'route-failure',
        detail: error instanceof Error ? error.message : 'unknown',
      },
      { status: 500 }
    );
  }
}