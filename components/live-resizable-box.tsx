'use client';

import { useEffect, useRef, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import type { ResolvedLiveBoxStyle } from '@/lib/cms/live-editor';
import { useLiveLayoutSave } from './live-layout-save-context';

type LiveViewport = 'desktop' | 'mobile';

interface LiveResizableBoxProps {
  boxKey: string;
  className: string;
  children: ReactNode;
  initialStyle?: ResolvedLiveBoxStyle;
  isAdmin: boolean;
}

export function LiveResizableBox({ boxKey, className, children, initialStyle, isAdmin }: LiveResizableBoxProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [viewport, setViewport] = useState<LiveViewport>('desktop');
  const [boxStyles, setBoxStyles] = useState<ResolvedLiveBoxStyle | undefined>(initialStyle);
  const liveLayoutSave = useLiveLayoutSave();

  function getStorageKey(targetViewport: LiveViewport) {
    return targetViewport === 'mobile' ? `${boxKey}@mobile` : boxKey;
  }

  function updateViewportStyle(style: Partial<ResolvedLiveBoxStyle[LiveViewport]>, targetViewport: LiveViewport = viewport) {
    setBoxStyles((current) => ({
      ...current,
      [targetViewport]: {
        ...(current?.[targetViewport] || {}),
        ...style,
      },
    }));
  }

  function getViewportStyle(styles: ResolvedLiveBoxStyle | undefined, targetViewport: LiveViewport) {
    return targetViewport === 'mobile' ? styles?.mobile : styles?.desktop;
  }

  function buildResponsiveStyle(styles: ResolvedLiveBoxStyle | undefined) {
    const nextStyle = {
      '--live-box-width-desktop': styles?.desktop?.width,
      '--live-box-height-desktop': styles?.desktop?.height,
      '--live-box-min-height-desktop': styles?.desktop?.minHeight,
      '--live-box-x-desktop': styles?.desktop?.x,
      '--live-box-y-desktop': styles?.desktop?.y,
      '--live-box-width-mobile': styles?.mobile?.width,
      '--live-box-height-mobile': styles?.mobile?.height,
      '--live-box-min-height-mobile': styles?.mobile?.minHeight,
      '--live-box-x-mobile': styles?.mobile?.x,
      '--live-box-y-mobile': styles?.mobile?.y,
    } as CSSProperties;

    return nextStyle;
  }

  function queueSave(style: { width?: string; height?: string; minHeight?: string; x?: string; y?: string }, targetViewport: LiveViewport) {
    const storageKey = getStorageKey(targetViewport);

    if (liveLayoutSave) {
      liveLayoutSave.setPendingStyle(storageKey, style);
      return;
    }

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      await fetch('/api/cms/live-editor', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          kind: 'boxStyle',
          key: storageKey,
          style,
        }),
      });
    }, 350);
  }

  useEffect(() => {
    setBoxStyles(initialStyle);
  }, [initialStyle]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const mediaQuery = window.matchMedia('(max-width: 767px)');
    const updateViewport = () => {
      setViewport(mediaQuery.matches ? 'mobile' : 'desktop');
    };

    updateViewport();
    mediaQuery.addEventListener('change', updateViewport);

    return () => {
      mediaQuery.removeEventListener('change', updateViewport);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  function getCurrentOffsets(style: ResolvedLiveBoxStyle[LiveViewport] | undefined) {
    const left = typeof style?.x === 'string' ? Number.parseFloat(style.x) || 0 : 0;
    const top = typeof style?.y === 'string' ? Number.parseFloat(style.y) || 0 : 0;

    if (left || top) {
      return { x: left, y: top };
    }

    const transform = '';
    const match = transform.match(/translate\(([^,]+),\s*([^\)]+)\)/);

    return {
      x: match ? Number.parseFloat(match[1]) || 0 : 0,
      y: match ? Number.parseFloat(match[2]) || 0 : 0,
    };
  }

  function handleMoveStart(event: React.PointerEvent<HTMLButtonElement>) {
    if (!isAdmin || !ref.current) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    document.body.style.userSelect = 'none';
    event.currentTarget.setPointerCapture(event.pointerId);

    const startX = event.clientX;
    const startY = event.clientY;
    const activeViewport = viewport;
    const { x: initialX, y: initialY } = getCurrentOffsets(getViewportStyle(boxStyles, activeViewport));

    function handlePointerMove(moveEvent: PointerEvent) {
      const nextX = initialX + (moveEvent.clientX - startX);
      const nextY = initialY + (moveEvent.clientY - startY);

      updateViewportStyle(
        {
          x: `${Math.round(nextX)}px`,
          y: `${Math.round(nextY)}px`,
        },
        activeViewport
      );
    }

    function finishDrag(endClientX: number, endClientY: number) {
      const nextX = initialX + (endClientX - startX);
      const nextY = initialY + (endClientY - startY);
      document.body.style.userSelect = '';

      queueSave({
        width: getViewportStyle(boxStyles, activeViewport)?.width,
        height: getViewportStyle(boxStyles, activeViewport)?.height,
        minHeight: getViewportStyle(boxStyles, activeViewport)?.minHeight,
        x: `${Math.round(nextX)}px`,
        y: `${Math.round(nextY)}px`,
      }, activeViewport);

      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerCancel);
    }

    function handlePointerUp(upEvent: PointerEvent) {
      finishDrag(upEvent.clientX, upEvent.clientY);
    }

    function handlePointerCancel() {
      document.body.style.userSelect = '';
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerCancel);
    }

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerCancel);
  }

  function handleResizeStart(event: React.PointerEvent<HTMLButtonElement>) {
    if (!isAdmin || !ref.current) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    document.body.style.userSelect = 'none';
    event.currentTarget.setPointerCapture(event.pointerId);

    const startX = event.clientX;
    const startY = event.clientY;
    const rect = ref.current.getBoundingClientRect();
    const startWidth = rect.width;
    const startHeight = rect.height;
    const activeViewport = viewport;
    const minWidth = activeViewport === 'mobile' ? 96 : 180;
    const minHeight = activeViewport === 'mobile' ? 72 : 120;
    const currentStyle = getViewportStyle(boxStyles, activeViewport);
    const currentX = currentStyle?.x;
    const currentY = currentStyle?.y;

    function handlePointerMove(moveEvent: PointerEvent) {
      const nextWidth = Math.max(minWidth, startWidth + (moveEvent.clientX - startX));
      const nextHeight = Math.max(minHeight, startHeight + (moveEvent.clientY - startY));

      updateViewportStyle(
        {
          width: `${Math.round(nextWidth)}px`,
          height: `${Math.round(nextHeight)}px`,
          minHeight: `${Math.round(nextHeight)}px`,
        },
        activeViewport
      );
    }

    function finishResize(endClientX: number, endClientY: number) {
      const nextWidth = Math.max(minWidth, startWidth + (endClientX - startX));
      const nextHeight = Math.max(minHeight, startHeight + (endClientY - startY));
      document.body.style.userSelect = '';

      queueSave({
        width: `${Math.round(nextWidth)}px`,
        height: `${Math.round(nextHeight)}px`,
        minHeight: `${Math.round(nextHeight)}px`,
        x: currentX,
        y: currentY,
      }, activeViewport);

      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerCancel);
    }

    function handlePointerUp(upEvent: PointerEvent) {
      finishResize(upEvent.clientX, upEvent.clientY);
    }

    function handlePointerCancel() {
      document.body.style.userSelect = '';
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerCancel);
    }

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerCancel);
  }

  return (
    <div
      ref={ref}
      className="live-resizable-box relative min-h-0 min-w-0 self-start justify-self-start"
      style={buildResponsiveStyle(boxStyles)}
      title={isAdmin ? 'Klick zum Bearbeiten, unten rechts Größe ändern, oben links verschieben' : undefined}
    >
      {isAdmin ? (
        <button
          type="button"
          onPointerDown={handleMoveStart}
          className="absolute left-2 right-8 top-2 z-20 flex h-10 cursor-grab touch-none items-start justify-start bg-transparent active:cursor-grabbing"
        >
          <span className="rounded-full border border-[#ff9d3c]/70 bg-[#1a110b] px-2 py-1 text-[0.65rem] font-black uppercase tracking-[0.16em] text-[#ffcf98] shadow-[0_12px_30px_rgba(0,0,0,0.28)]">
            Bewegen
          </span>
        </button>
      ) : null}
      <div className={`relative h-full w-full overflow-auto ${className}`}>
        {children}
      </div>
      {isAdmin ? (
        <button
          type="button"
          onPointerDown={handleResizeStart}
          aria-label="Größe ändern"
          className="absolute bottom-2 right-2 z-20 h-5 w-5 cursor-se-resize touch-none rounded-sm"
        >
          <span aria-hidden="true" className="pointer-events-none absolute bottom-0 right-0 h-4 w-4 border-b-2 border-r-2 border-[#ff9d3c]/80" />
        </button>
      ) : null}
    </div>
  );
}