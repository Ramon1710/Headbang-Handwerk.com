'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import type { MediaAsset } from '@/lib/cms/schema';

interface HomeNewsEditorProps {
  editorKey: string;
  initialHtml: string;
  title: string;
  isAdmin: boolean;
  className?: string;
  images: MediaAsset[];
  imagePositionX: number;
  imagePositionY: number;
}

const FONT_FAMILIES = [
  { label: 'Cinzel', value: 'Cinzel' },
  { label: 'Exo 2', value: 'Exo 2' },
  { label: 'Georgia', value: 'Georgia' },
  { label: 'Segoe UI', value: 'Segoe UI' },
];

const FONT_SIZES = ['14px', '16px', '18px', '20px', '24px', '28px', '32px', '40px'];
const DEFAULT_TEXT_COLOR = '#f5e7d5';

function applyExecCommand(command: 'bold' | 'italic' | 'underline') {
  document.execCommand('styleWithCSS', false, 'false');
  document.execCommand(command, false);
}

function wrapSelectionWithStyle(style: Partial<CSSStyleDeclaration>) {
  const selection = window.getSelection();

  if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
    return;
  }

  const range = selection.getRangeAt(0);
  const wrapper = document.createElement('span');

  Object.assign(wrapper.style, style);
  wrapper.appendChild(range.extractContents());
  range.insertNode(wrapper);
  selection.removeAllRanges();

  const nextRange = document.createRange();
  nextRange.selectNodeContents(wrapper);
  selection.addRange(nextRange);
}

function isSelectionInsideEditor(selection: Selection, editor: HTMLDivElement) {
  if (!selection.anchorNode) {
    return false;
  }

  return editor.contains(selection.anchorNode);
}

function stripTypographyStyles(html: string) {
  return html
    .replace(/\salign=("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/style=("([^"]*)"|'([^']*)')/gi, (fullMatch, _styleAttr, doubleQuoted, singleQuoted) => {
      const rawValue = (doubleQuoted ?? singleQuoted ?? '').trim();

      if (!rawValue) {
        return '';
      }

      const filteredDeclarations = rawValue
        .split(';')
        .map((declaration: string) => declaration.trim())
        .filter(Boolean)
        .filter((declaration: string) => {
          const property = declaration.split(':')[0]?.trim().toLowerCase();

          return property && !['color', 'font-size', 'font-family', 'font-weight', 'line-height', 'text-align'].includes(property);
        });

      if (filteredDeclarations.length === 0) {
        return '';
      }

      return `style="${filteredDeclarations.join('; ')}"`;
    });
}

function hasVisibleText(html: string) {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .trim().length > 0;
}

export function HomeNewsEditor({ editorKey, initialHtml, title, isAdmin, className, images, imagePositionX, imagePositionY }: HomeNewsEditorProps) {
  const router = useRouter();
  const editorRef = useRef<HTMLDivElement | null>(null);
  const selectionRef = useRef<Range | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [html, setHtml] = useState(initialHtml);
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [removeIndices, setRemoveIndices] = useState<number[]>([]);
  const [positionX, setPositionX] = useState(imagePositionX);
  const [positionY, setPositionY] = useState(imagePositionY);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setHtml(initialHtml);
  }, [initialHtml]);

  useEffect(() => {
    setPositionX(imagePositionX);
    setPositionY(imagePositionY);
  }, [imagePositionX, imagePositionY]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen || !editorRef.current) {
      return;
    }

    editorRef.current.innerHTML = html;
    editorRef.current.focus();
  }, [html, isOpen]);

  useEffect(() => {
    if (!isOpen || !editorRef.current) {
      return;
    }

    function handleSelectionChange() {
      if (!editorRef.current) {
        return;
      }

      const selection = window.getSelection();

      if (!selection || selection.rangeCount === 0 || !isSelectionInsideEditor(selection, editorRef.current)) {
        return;
      }

      selectionRef.current = selection.getRangeAt(0).cloneRange();
    }

    document.addEventListener('selectionchange', handleSelectionChange);

    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, [isOpen]);

  function captureSelection() {
    if (!editorRef.current) {
      return;
    }

    const selection = window.getSelection();

    if (!selection || selection.rangeCount === 0 || !isSelectionInsideEditor(selection, editorRef.current)) {
      return;
    }

    selectionRef.current = selection.getRangeAt(0).cloneRange();
  }

  function restoreSelection() {
    const selection = window.getSelection();

    if (editorRef.current && selection && selection.rangeCount > 0 && isSelectionInsideEditor(selection, editorRef.current)) {
      selectionRef.current = selection.getRangeAt(0).cloneRange();
      return true;
    }

    if (!editorRef.current || !selectionRef.current) {
      return false;
    }

    editorRef.current.focus();

    if (!selection) {
      return false;
    }

    selection.removeAllRanges();
    selection.addRange(selectionRef.current);
    return true;
  }

  function handleFormat(command: 'bold' | 'italic' | 'underline') {
    if (!restoreSelection()) {
      return;
    }

    applyExecCommand(command);
    captureSelection();
  }

  function handleStyleWrap(style: Partial<CSSStyleDeclaration>) {
    if (!restoreSelection()) {
      return;
    }

    wrapSelectionWithStyle(style);
    captureSelection();
  }

  function toggleRemoval(index: number) {
    setRemoveIndices((current) =>
      current.includes(index) ? current.filter((item) => item !== index) : [...current, index]
    );
  }

  function openEditor() {
    setPendingFiles([]);
    setRemoveIndices([]);
    setPositionX(imagePositionX);
    setPositionY(imagePositionY);
    setError(null);
    setIsOpen(true);
  }

  async function save() {
    if (!editorRef.current) {
      return;
    }

    const remainingSlots = Math.max(0, 1 - (images.length - removeIndices.length));

    if (pendingFiles.length > remainingSlots) {
      setError(`Es kann maximal 1 Bild gespeichert werden. Bitte höchstens ${remainingSlots} neues Bild auswählen.`);
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const formData = new FormData();
      const nextHtml = editorRef.current.innerHTML;

      formData.set('editorKey', editorKey);
      formData.set('html', nextHtml);
      formData.set('imagePositionX', String(positionX));
      formData.set('imagePositionY', String(positionY));
      removeIndices.forEach((index) => formData.append('removeImageIndices', String(index)));
      pendingFiles.forEach((file) => formData.append('newsImages', file));

      const response = await fetch('/api/cms/home-news', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error || 'save-failed');
      }

      setHtml(nextHtml);
      setIsOpen(false);
      setPendingFiles([]);
      setRemoveIndices([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      router.refresh();
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : 'save-failed';

      if (message === 'too-many-images') {
        setError('Es ist maximal 1 Bild erlaubt.');
      } else if (message === 'missing-config') {
        setError('Firebase ist für Uploads noch nicht vollständig eingerichtet.');
      } else if (message === 'unauthorized') {
        setError('Die Admin-Sitzung ist abgelaufen. Bitte neu anmelden.');
      } else {
        setError('Speichern fehlgeschlagen. Bitte Upload-Konfiguration prüfen.');
      }
    } finally {
      setIsSaving(false);
    }
  }

  const renderedHtml = stripTypographyStyles(html);
  const showPlaceholder = isAdmin && !hasVisibleText(renderedHtml);
  const displayHtml = showPlaceholder ? `<span style="opacity:.7">${title}</span>` : renderedHtml;
  const visibleImages = images.filter((image, index) => image.assetUrl && !removeIndices.includes(index));
  const availableUploadSlots = Math.max(0, 1 - visibleImages.length);
  const previewImage = pendingFiles[0] ? URL.createObjectURL(pendingFiles[0]) : visibleImages[0]?.assetUrl;

  return (
    <>
      <div
        className={`${className || ''}${isAdmin ? ' cursor-pointer rounded-md outline outline-1 outline-dashed outline-transparent transition hover:outline-[#ff9d3c]/45' : ''}${showPlaceholder ? ' inline-block min-h-[1.5rem] min-w-[8rem] text-[#ffcf98]' : ''}`}
        dangerouslySetInnerHTML={{ __html: displayHtml }}
        onClick={isAdmin ? openEditor : undefined}
        title={isAdmin ? `${title} bearbeiten` : undefined}
      />

      {isOpen && isMounted
        ? createPortal(
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 px-4 py-6 backdrop-blur-sm">
              <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-[1.6rem] border border-[#704321] bg-[#120d0a] p-5 shadow-[0_30px_70px_rgba(0,0,0,0.45)] sm:p-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#ffbf76]">Live Editor</p>
                    <h3 className="mt-2 text-2xl font-black text-[#fff0da]">{title}</h3>
                  </div>
                  <button type="button" onClick={() => setIsOpen(false)} className="rounded-xl border border-[#704321] px-3 py-2 text-sm font-semibold text-[#f6e7d3]">
                    Schließen
                  </button>
                </div>

                <div className="mt-5 flex flex-wrap gap-2 rounded-2xl border border-white/8 bg-black/20 p-3">
                  <button type="button" onMouseDown={(event) => { event.preventDefault(); captureSelection(); handleFormat('bold'); }} className="rounded-lg border border-[#704321] px-3 py-2 text-sm font-semibold text-[#f3dfc4]">Fett</button>
                  <button type="button" onMouseDown={(event) => { event.preventDefault(); captureSelection(); handleFormat('italic'); }} className="rounded-lg border border-[#704321] px-3 py-2 text-sm font-semibold text-[#f3dfc4]">Kursiv</button>
                  <button type="button" onMouseDown={(event) => { event.preventDefault(); captureSelection(); handleFormat('underline'); }} className="rounded-lg border border-[#704321] px-3 py-2 text-sm font-semibold text-[#f3dfc4]">Unterstreichen</button>
                  <select
                    onFocus={captureSelection}
                    onChange={(event) => {
                      handleStyleWrap({ fontFamily: event.target.value });
                      event.target.selectedIndex = 0;
                    }}
                    defaultValue=""
                    className="rounded-lg border border-[#704321] bg-[#1a130f] px-3 py-2 text-sm text-[#f3dfc4]"
                  >
                    <option value="" disabled>Schriftart</option>
                    {FONT_FAMILIES.map((fontFamily) => (
                      <option key={fontFamily.value} value={fontFamily.value}>{fontFamily.label}</option>
                    ))}
                  </select>
                  <select
                    onFocus={captureSelection}
                    onChange={(event) => {
                      handleStyleWrap({ fontSize: event.target.value });
                      event.target.selectedIndex = 0;
                    }}
                    defaultValue=""
                    className="rounded-lg border border-[#704321] bg-[#1a130f] px-3 py-2 text-sm text-[#f3dfc4]"
                  >
                    <option value="" disabled>Schriftgröße</option>
                    {FONT_SIZES.map((fontSize) => (
                      <option key={fontSize} value={fontSize}>{fontSize}</option>
                    ))}
                  </select>
                  <label className="flex items-center gap-2 rounded-lg border border-[#704321] bg-[#1a130f] px-3 py-2 text-sm text-[#f3dfc4]">
                    <span>Schriftfarbe</span>
                    <input
                      type="color"
                      defaultValue={DEFAULT_TEXT_COLOR}
                      onMouseDown={captureSelection}
                      onFocus={captureSelection}
                      onChange={(event) => {
                        handleStyleWrap({ color: event.target.value });
                      }}
                      className="h-8 w-10 cursor-pointer rounded border border-[#704321] bg-transparent p-0"
                    />
                  </label>
                </div>

                <div
                  ref={editorRef}
                  contentEditable
                  suppressContentEditableWarning
                  onMouseUp={captureSelection}
                  onKeyUp={captureSelection}
                  onInput={captureSelection}
                  onFocus={captureSelection}
                  className="mt-5 min-h-72 rounded-[1.3rem] border border-white/10 bg-[#0f0b08] px-5 py-4 text-base leading-8 text-[#f5e7d5] outline-none"
                />

                <div className="mt-5 rounded-[1.3rem] border border-white/10 bg-black/15 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h4 className="text-sm font-black uppercase tracking-[0.16em] text-[#fff0da]">News-Bilder</h4>
                      <p className="mt-1 text-sm text-[#d7c2ab]">Ein Bild optional. Wenn keines vorhanden ist, bleibt der Kasten bildfrei.</p>
                    </div>
                    <span className="rounded-full border border-white/10 px-3 py-1 text-xs font-semibold text-[#ffcf98]">
                      {visibleImages.length + pendingFiles.length}/1 belegt
                    </span>
                  </div>

                  {images.length ? (
                    <div className="mt-4 grid gap-4">
                      {images.map((image, index) => (
                        <div key={`${image.assetUrl}-${index}`} className={`rounded-[1rem] border p-3 ${removeIndices.includes(index) ? 'border-red-500/40 bg-red-950/20' : 'border-white/10 bg-black/20'}`}>
                          <div className="overflow-hidden rounded-[0.9rem] border border-white/10 bg-black/30">
                            <img src={image.assetUrl} alt={image.assetName || `News Bild ${index + 1}`} className="h-48 w-full object-cover" style={{ objectPosition: `${positionX}% ${positionY}%` }} />
                          </div>
                          <label className="mt-3 flex items-center gap-3 text-sm text-[#f3dfc4]">
                            <input type="checkbox" checked={removeIndices.includes(index)} onChange={() => toggleRemoval(index)} className="h-4 w-4" />
                            Bild entfernen
                          </label>
                        </div>
                      ))}
                    </div>
                  ) : null}

                  {previewImage && !removeIndices.includes(0) ? (
                    <div className="mt-4 rounded-[1rem] border border-white/10 bg-black/20 p-3">
                      <p className="text-sm font-semibold text-white">Vorschau Bildposition</p>
                      <div className="mt-3 overflow-hidden rounded-[0.9rem] border border-white/10 bg-black/30">
                        <img src={previewImage} alt="News Vorschau" className="h-52 w-full object-cover" style={{ objectPosition: `${positionX}% ${positionY}%` }} />
                      </div>
                      <div className="mt-4 grid gap-3">
                        <label className="grid gap-2 text-sm text-[#f3dfc4]">
                          <span>Bild horizontal verschieben: {positionX}%</span>
                          <input type="range" min="0" max="100" value={positionX} onChange={(event) => setPositionX(Number.parseInt(event.target.value, 10))} />
                        </label>
                        <label className="grid gap-2 text-sm text-[#f3dfc4]">
                          <span>Bild vertikal verschieben: {positionY}%</span>
                          <input type="range" min="0" max="100" value={positionY} onChange={(event) => setPositionY(Number.parseInt(event.target.value, 10))} />
                        </label>
                      </div>
                    </div>
                  ) : null}

                  <div className="mt-4 grid gap-2">
                    <label className="text-sm font-semibold text-white">Neue Bilder hinzufügen</label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".png,.jpg,.jpeg,.webp"
                      multiple
                      disabled={availableUploadSlots === 0}
                      onChange={(event) => {
                        const files = Array.from(event.target.files || []).slice(0, availableUploadSlots);
                        setPendingFiles(files);
                      }}
                      className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white file:mr-4 file:rounded-lg file:border-0 file:bg-[#ff8a28] file:px-4 file:py-2 file:font-semibold file:text-black disabled:opacity-50"
                    />
                      <p className="text-xs text-[#c8b29a]">Es kann aktuell noch {availableUploadSlots} Bild ergänzt werden.</p>
                    {pendingFiles.length ? (
                      <p className="text-sm text-[#ffcf98]">Ausgewählt: {pendingFiles.map((file) => file.name).join(', ')}</p>
                    ) : null}
                  </div>

                  {error ? <p className="mt-4 rounded-xl border border-red-500/30 bg-red-950/40 px-4 py-3 text-sm text-red-200">{error}</p> : null}
                </div>

                <div className="mt-5 flex items-center justify-end gap-3">
                  <button type="button" onClick={() => setIsOpen(false)} className="rounded-xl border border-[#704321] px-4 py-2 text-sm font-semibold text-[#f3dfc4]">
                    Abbrechen
                  </button>
                  <button type="button" onClick={save} disabled={isSaving} className="rounded-xl bg-[#ff8a28] px-4 py-2 text-sm font-black text-black disabled:opacity-60">
                    {isSaving ? 'Speichert...' : 'Speichern'}
                  </button>
                </div>
              </div>
            </div>,
            document.body
          )
        : null}
    </>
  );
}