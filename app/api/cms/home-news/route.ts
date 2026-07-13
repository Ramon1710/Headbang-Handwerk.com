import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/cms/auth';
import {
  isFirebaseStorageBucketNotFoundError,
  isFirebaseStoragePermissionError,
  isFirebaseStorageUploadError,
  uploadCmsAsset,
} from '@/lib/cms/file-storage';
import { hasFirebaseConfig, isFirebaseAuthError, isInvalidFirebaseConfigError } from '@/lib/cms/firebase';
import { sanitizeLiveEditorHtml } from '@/lib/cms/live-editor';
import {
  getCmsContent,
  isFirebaseAuthSaveError,
  isInvalidFirebaseSaveError,
  isReadonlyFallbackError,
  saveCmsContent,
} from '@/lib/cms/storage';
import type { MediaAsset } from '@/lib/cms/schema';

function toAsset(fileUpload: Awaited<ReturnType<typeof uploadCmsAsset>>): MediaAsset {
  return {
    assetUrl: fileUpload.url,
    assetName: fileUpload.name,
    assetContentType: fileUpload.contentType,
  };
}

function uploadErrorResponse(error: unknown) {
  if (isInvalidFirebaseConfigError(error)) {
    return NextResponse.json({ error: 'missing-config' }, { status: 503 });
  }

  if (isFirebaseStorageBucketNotFoundError(error) || isFirebaseStoragePermissionError(error) || isFirebaseStorageUploadError(error) || isFirebaseAuthError(error)) {
    return NextResponse.json({ error: 'missing-config' }, { status: 503 });
  }

  return NextResponse.json({ error: 'upload-failed' }, { status: 500 });
}

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const formData = await request.formData();
  const editorKey = String(formData.get('editorKey') || '').trim();
  const html = sanitizeLiveEditorHtml(String(formData.get('html') || ''));

  if (!editorKey) {
    return NextResponse.json({ error: 'missing-key' }, { status: 400 });
  }

  const current = await getCmsContent();
  const removeIndices = formData
    .getAll('removeImageIndices')
    .map((value) => Number.parseInt(String(value), 10))
    .filter((value) => Number.isInteger(value) && value >= 0);

  let newsImages = current.site.home.newsImages.filter((_, index) => !removeIndices.includes(index));
  const files = formData.getAll('newsImages').filter((value): value is File => value instanceof File && value.size > 0);

  if (newsImages.length + files.length > 2) {
    return NextResponse.json({ error: 'too-many-images' }, { status: 400 });
  }

  if (files.length > 0 && !hasFirebaseConfig()) {
    return NextResponse.json({ error: 'missing-config' }, { status: 503 });
  }

  for (const [index, file] of files.entries()) {
    try {
      const uploaded = await uploadCmsAsset(file, 'home-news', `news-${index + 1}`);
      newsImages = [...newsImages, toAsset(uploaded)];
    } catch (error) {
      return uploadErrorResponse(error);
    }
  }

  const next = {
    ...current,
    site: {
      ...current.site,
      liveEditor: {
        ...current.site.liveEditor,
        richText: {
          ...current.site.liveEditor.richText,
          [editorKey]: html,
        },
        boxStyles: {
          ...current.site.liveEditor.boxStyles,
        },
      },
      home: {
        ...current.site.home,
        newsImages,
      },
    },
  };

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
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    return NextResponse.json({ error: 'save-failed' }, { status: 500 });
  }

  revalidatePath('/', 'layout');
  revalidatePath('/');

  return NextResponse.json({ ok: true });
}