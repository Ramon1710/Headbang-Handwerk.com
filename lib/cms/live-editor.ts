import type { CSSProperties } from 'react';
import type { LiveEditorBoxStyle, LiveEditorContent } from './schema';

export const emptyLiveEditorContent: LiveEditorContent = {
  richText: {},
  boxStyles: {},
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function textToHtml(value: string) {
  return escapeHtml(value).replace(/\n/g, '<br />');
}

function stripDangerousMarkup(html: string) {
  return html
    .replace(/<\/?(script|style)[^>]*>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\son[a-z]+="[^"]*"/gi, '')
    .replace(/\son[a-z]+='[^']*'/gi, '')
    .replace(/\son[a-z]+=[^\s>]+/gi, '');
}

function sanitizeStyleAttribute(value: string) {
  const allowedDeclarations = value
    .split(';')
    .map((declaration) => declaration.trim())
    .filter(Boolean)
    .map((declaration) => declaration.split(':').map((part) => part.trim()))
    .filter(([property, rawValue]) => {
      if (!property || !rawValue) {
        return false;
      }

      if (!['font-family', 'font-size', 'font-weight', 'font-style', 'text-decoration'].includes(property)) {
        return false;
      }

      return /^[a-zA-Z0-9\s,'".%()-]+$/.test(rawValue);
    })
    .map(([property, rawValue]) => `${property}: ${rawValue}`);

  return allowedDeclarations.join('; ');
}

export function sanitizeLiveEditorHtml(value: string) {
  const stripped = stripDangerousMarkup(value)
    .replace(/<(?!\/?(b|strong|i|em|u|br|span|p|div)\b)[^>]+>/gi, '')
    .replace(/style="([^"]*)"/gi, (_, styleValue) => {
      const sanitized = sanitizeStyleAttribute(styleValue);
      return sanitized ? `style="${sanitized}"` : '';
    });

  return stripped.trim() || '<p></p>';
}

function sanitizeCssValue(value?: string) {
  if (!value) {
    return undefined;
  }

  const trimmed = value.trim();
  return /^\d+(\.\d+)?(px|%|rem|vw|vh)$/.test(trimmed) ? trimmed : undefined;
}

export function sanitizeLiveEditorBoxStyle(style: Partial<LiveEditorBoxStyle>) {
  return {
    width: sanitizeCssValue(style.width),
    height: sanitizeCssValue(style.height),
    minHeight: sanitizeCssValue(style.minHeight),
    x: sanitizeCssValue(style.x),
    y: sanitizeCssValue(style.y),
  } satisfies LiveEditorBoxStyle;
}

export function resolveLiveHtml(liveEditor: LiveEditorContent | undefined, key: string, fallbackText: string) {
  const html = liveEditor?.richText[key];
  return html && html.trim() ? html : textToHtml(fallbackText);
}

export function resolveLiveRichHtml(liveEditor: LiveEditorContent | undefined, key: string, fallbackHtml: string) {
  const html = liveEditor?.richText[key];
  return html && html.trim() ? html : fallbackHtml;
}

export function resolveLiveBoxStyle(liveEditor: LiveEditorContent | undefined, key: string): CSSProperties | undefined {
  const boxStyle = liveEditor?.boxStyles[key];

  if (!boxStyle) {
    return undefined;
  }

  return {
    position: boxStyle.x || boxStyle.y ? 'relative' : undefined,
    width: boxStyle.width,
    height: boxStyle.height,
    minHeight: boxStyle.minHeight,
    left: boxStyle.x,
    top: boxStyle.y,
  };
}