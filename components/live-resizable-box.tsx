'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { CSSProperties, ReactNode } from 'react';
import { useLiveLayoutSave } from './live-layout-save-context';

interface LiveResizableBoxProps {
  boxKey: string;
  className: string;
  children: ReactNode;
  initialStyle?: CSSProperties;
  isAdmin: boolean;
}

export function LiveResizableBox({ boxKey, className, children, initialStyle, isAdmin }: LiveResizableBoxProps) {
  const router = useRouter();
  const ref = useRef<HTMLDivElement | null>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [boxStyle, setBoxStyle] = useState<CSSProperties | undefined>(initialStyle);
  const liveLayoutSave = useLiveLayoutSave();

  function queueSave(style: { width?: string; height?: string; minHeight?: string; x?: string; y?: string }) {
    if (liveLayoutSave) {
      liveLayoutSave.setPendingStyle(boxKey, style);
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
          key: boxKey,
          style,
        }),
      });
    }, 350);
  }

  useEffect(() => {
    setBoxStyle(initialStyle);
  }, [initialStyle]);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  function getCurrentOffsets(style: CSSProperties | undefined) {
    const left = typeof style?.left === 'string' ? Number.parseFloat(style.left) || 0 : 0;
    const top = typeof style?.top === 'string' ? Number.parseFloat(style.top) || 0 : 0;

    if (left || top) {
      return { x: left, y: top };
    }

    const transform = typeof style?.transform === 'string' ? style.transform : '';
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
    const { x: initialX, y: initialY } = getCurrentOffsets(boxStyle);

    function handlePointerMove(moveEvent: PointerEvent) {
      const nextX = initialX + (moveEvent.clientX - startX);
      const nextY = initialY + (moveEvent.clientY - startY);

      setBoxStyle((current) => ({
        ...current,
        left: `${Math.round(nextX)}px`,
        top: `${Math.round(nextY)}px`,
        transform: undefined,
      }));
    }

    function finishDrag(endClientX: number, endClientY: number) {
      const nextX = initialX + (endClientX - startX);
      const nextY = initialY + (endClientY - startY);
      document.body.style.userSelect = '';

      queueSave({
        width: typeof ref.current?.style.width === 'string' ? ref.current.style.width || undefined : undefined,
        minHeight: typeof ref.current?.style.minHeight === 'string' ? ref.current.style.minHeight || undefined : undefined,
        x: `${Math.round(nextX)}px`,
        y: `${Math.round(nextY)}px`,
      });

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
    const minWidth = 180;
    const minHeight = 120;
    const currentX = typeof boxStyle?.left === 'string' ? boxStyle.left : undefined;
    const currentY = typeof boxStyle?.top === 'string' ? boxStyle.top : undefined;

    function handlePointerMove(moveEvent: PointerEvent) {
      const nextWidth = Math.max(minWidth, startWidth + (moveEvent.clientX - startX));
      const nextHeight = Math.max(minHeight, startHeight + (moveEvent.clientY - startY));

      setBoxStyle((current) => ({
        ...current,
        width: `${Math.round(nextWidth)}px`,
        height: `${Math.round(nextHeight)}px`,
        minHeight: `${Math.round(nextHeight)}px`,
      }));
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
      });

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
      className="relative min-w-0 min-h-0 self-start justify-self-start"
      style={isAdmin ? boxStyle : boxStyle}
      title={isAdmin ? 'Klick zum Bearbeiten, unten rechts Größe ändern, oben links verschieben' : undefined}
    >
      <div className={`relative h-full w-full overflow-auto ${className}`}>
        {isAdmin ? (
          <button
            type="button"
            onPointerDown={handleMoveStart}
            className="absolute left-2 top-2 z-10 cursor-grab touch-none rounded-full border border-[#ff9d3c]/70 bg-[#1a110b] px-2 py-1 text-[0.65rem] font-black uppercase tracking-[0.16em] text-[#ffcf98] shadow-[0_12px_30px_rgba(0,0,0,0.28)] active:cursor-grabbing"
          >
            Bewegen
          </button>
        ) : null}
        {children}
        {isAdmin ? (
          <button
            type="button"
            onPointerDown={handleResizeStart}
            aria-label="Größe ändern"
            className="absolute bottom-2 right-2 z-10 h-5 w-5 cursor-se-resize touch-none rounded-sm"
          >
            <span aria-hidden="true" className="pointer-events-none absolute bottom-0 right-0 h-4 w-4 border-b-2 border-r-2 border-[#ff9d3c]/80" />
          </button>
        ) : null}
      </div>
    </div>
  );
}