'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';

type SupportedTag = 'div' | 'p' | 'span' | 'h1' | 'h2' | 'h3';

interface LiveEditableTextProps {
  as?: SupportedTag;
  className?: string;
  editorKey: string;
  initialHtml: string;
  isAdmin: boolean;
  title?: string;
}

const FONT_FAMILIES = [
  { label: 'Cinzel', value: 'Cinzel' },
  { label: 'Exo 2', value: 'Exo 2' },
  { label: 'Georgia', value: 'Georgia' },
  { label: 'Segoe UI', value: 'Segoe UI' },
];

const FONT_SIZES = ['14px', '16px', '18px', '20px', '24px', '28px', '32px', '40px'];

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

function wrapSelectionWithTag(tagName: 'strong' | 'em' | 'u') {
  const selection = window.getSelection();

  if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
    return;
  }

  const range = selection.getRangeAt(0);
  const wrapper = document.createElement(tagName);

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

export function LiveEditableText({ as = 'div', className, editorKey, initialHtml, isAdmin, title }: LiveEditableTextProps) {
  const Component = as;
  const router = useRouter();
  const editorRef = useRef<HTMLDivElement | null>(null);
  const selectionRef = useRef<Range | null>(null);
  const [html, setHtml] = useState(initialHtml);
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setHtml(initialHtml);
  }, [initialHtml]);

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

  function handleFormat(tagName: 'strong' | 'em' | 'u') {
    if (!restoreSelection()) {
      return;
    }

    wrapSelectionWithTag(tagName);
    captureSelection();
  }

  function handleStyleWrap(style: Partial<CSSStyleDeclaration>) {
    if (!restoreSelection()) {
      return;
    }

    wrapSelectionWithStyle(style);
    captureSelection();
  }

  async function save() {
    if (!editorRef.current) {
      return;
    }

    setIsSaving(true);

    try {
      const nextHtml = editorRef.current.innerHTML;
      const response = await fetch('/api/cms/live-editor', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          kind: 'richText',
          key: editorKey,
          html: nextHtml,
        }),
      });

      if (!response.ok) {
        throw new Error('save-failed');
      }

      setHtml(nextHtml);
      setIsOpen(false);
      router.refresh();
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <>
      <Component
        className={`${className || ''}${isAdmin ? ' cursor-pointer rounded-md outline outline-1 outline-dashed outline-transparent transition hover:outline-[#ff9d3c]/45' : ''}`}
        dangerouslySetInnerHTML={{ __html: html }}
        onClick={isAdmin ? () => setIsOpen(true) : undefined}
        title={isAdmin ? title || 'Zum Bearbeiten anklicken' : undefined}
      />

      {isOpen && isMounted ? createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 px-4 py-6 backdrop-blur-sm">
          <div className="w-full max-w-3xl rounded-[1.6rem] border border-[#704321] bg-[#120d0a] p-5 shadow-[0_30px_70px_rgba(0,0,0,0.45)] sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#ffbf76]">Live Editor</p>
                <h3 className="mt-2 text-2xl font-black text-[#fff0da]">{title || 'Inhalt bearbeiten'}</h3>
              </div>
              <button type="button" onClick={() => setIsOpen(false)} className="rounded-xl border border-[#704321] px-3 py-2 text-sm font-semibold text-[#f6e7d3]">
                Schließen
              </button>
            </div>

            <div className="mt-5 flex flex-wrap gap-2 rounded-2xl border border-white/8 bg-black/20 p-3">
              <button type="button" onMouseDown={(event) => { event.preventDefault(); captureSelection(); handleFormat('strong'); }} className="rounded-lg border border-[#704321] px-3 py-2 text-sm font-semibold text-[#f3dfc4]">Fett</button>
              <button type="button" onMouseDown={(event) => { event.preventDefault(); captureSelection(); handleFormat('em'); }} className="rounded-lg border border-[#704321] px-3 py-2 text-sm font-semibold text-[#f3dfc4]">Kursiv</button>
              <button type="button" onMouseDown={(event) => { event.preventDefault(); captureSelection(); handleFormat('u'); }} className="rounded-lg border border-[#704321] px-3 py-2 text-sm font-semibold text-[#f3dfc4]">Unterstreichen</button>
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
      ) : null}
    </>
  );
}