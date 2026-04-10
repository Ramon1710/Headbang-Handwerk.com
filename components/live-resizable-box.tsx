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
            style: {
              width,
              minHeight: height,
            },
          }),
        });

        if (response.ok) {
          router.refresh();
        }
      }, 450);
    });

    observer.observe(element);

    return () => {
      observer.disconnect();

      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [boxKey, boxStyle, isAdmin, router]);

  return (
    <div className="relative">
      <div
        ref={ref}
        className={className}
        style={isAdmin ? { ...boxStyle, resize: 'both', overflow: 'auto' } : boxStyle}
        title={isAdmin ? 'Unten rechts ziehen, um die Kästchengröße zu ändern' : undefined}
      >
        {children}
      </div>
      {isAdmin ? <div aria-hidden="true" className="pointer-events-none absolute bottom-3 right-3 h-4 w-4 border-b-2 border-r-2 border-[#ff9d3c]/80" /> : null}
    </div>
  );
}