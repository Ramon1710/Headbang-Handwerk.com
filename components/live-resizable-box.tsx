'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { CSSProperties, ReactNode } from 'react';

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

  function queueSave(style: { width?: string; height?: string; minHeight?: string; x?: string; y?: string }) {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      const response = await fetch('/api/cms/live-editor', {
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

      if (response.ok) {
        router.refresh();
      }
    }, 350);
  }

  useEffect(() => {
    setBoxStyle(initialStyle);
  }, [initialStyle]);

  useEffect(() => {
    if (!isAdmin || !ref.current) {
      return;
    }

    const element = ref.current;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      const width = `${Math.round(entry.contentRect.width)}px`;
      const height = `${Math.round(entry.contentRect.height)}px`;
      const nextStyle = {
        ...boxStyle,
        width,
        minHeight: height,
      };

      setBoxStyle(nextStyle);
      queueSave({
        width,
        minHeight: height,
        x: typeof nextStyle.transform === 'string' ? nextStyle.transform.match(/translate\(([^,]+),\s*([^\)]+)\)/)?.[1]?.trim() : undefined,
        y: typeof nextStyle.transform === 'string' ? nextStyle.transform.match(/translate\(([^,]+),\s*([^\)]+)\)/)?.[2]?.trim() : undefined,
      });
    });

    observer.observe(element);

    return () => {
      observer.disconnect();

      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [boxKey, boxStyle, isAdmin, router]);

  function handleMoveStart(event: React.PointerEvent<HTMLButtonElement>) {
    if (!isAdmin || !ref.current) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const startX = event.clientX;
    const startY = event.clientY;
    const transform = typeof boxStyle?.transform === 'string' ? boxStyle.transform : '';
    const currentMatch = transform.match(/translate\(([^,]+),\s*([^\)]+)\)/);
    const initialX = currentMatch ? Number.parseFloat(currentMatch[1]) : 0;
    const initialY = currentMatch ? Number.parseFloat(currentMatch[2]) : 0;

    function handlePointerMove(moveEvent: PointerEvent) {
      const nextX = initialX + (moveEvent.clientX - startX);
      const nextY = initialY + (moveEvent.clientY - startY);

      setBoxStyle((current) => ({
        ...current,
        transform: `translate(${Math.round(nextX)}px, ${Math.round(nextY)}px)`,
      }));
    }

    function handlePointerUp(upEvent: PointerEvent) {
      const nextX = initialX + (upEvent.clientX - startX);
      const nextY = initialY + (upEvent.clientY - startY);

      queueSave({
        width: typeof ref.current?.style.width === 'string' ? ref.current.style.width || undefined : undefined,
        minHeight: typeof ref.current?.style.minHeight === 'string' ? ref.current.style.minHeight || undefined : undefined,
        x: `${Math.round(nextX)}px`,
        y: `${Math.round(nextY)}px`,
      });

      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    }

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  }

  return (
    <div className="relative">
      <div
        ref={ref}
        className={className}
        style={isAdmin ? { ...boxStyle, resize: 'both', overflow: 'auto' } : boxStyle}
        title={isAdmin ? 'Klick zum Bearbeiten, unten rechts Größe ändern, oben links verschieben' : undefined}
      >
        {children}
      </div>
      {isAdmin ? (
        <button
          type="button"
          onPointerDown={handleMoveStart}
          className="absolute -left-2 -top-2 z-10 rounded-full border border-[#ff9d3c]/70 bg-[#1a110b] px-2 py-1 text-[0.65rem] font-black uppercase tracking-[0.16em] text-[#ffcf98] shadow-[0_12px_30px_rgba(0,0,0,0.28)]"
        >
          Bewegen
        </button>
      ) : null}
      {isAdmin ? <div aria-hidden="true" className="pointer-events-none absolute bottom-3 right-3 h-4 w-4 border-b-2 border-r-2 border-[#ff9d3c]/80" /> : null}
    </div>
  );
}