import { cn } from '@/lib/utils';
import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export function Card({ children, className, hover = false }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-[1.75rem] bg-[linear-gradient(180deg,rgba(28,18,12,0.7)_0%,rgba(12,9,7,0.26)_100%)] p-7',
        'ring-1 ring-white/6 shadow-[0_18px_50px_rgba(0,0,0,0.22)] backdrop-blur-sm',
        hover && 'transition-all duration-300 hover:-translate-y-1 hover:ring-[color:var(--color-accent)]/30 hover:shadow-[0_24px_56px_color-mix(in_srgb,var(--color-accent)_12%,transparent)]',
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('mb-4', className)}>{children}</div>;
}

export function CardTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return <h3 className={cn('text-lg font-bold text-white', className)}>{children}</h3>;
}

export function CardContent({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('text-gray-400 text-sm leading-relaxed', className)}>{children}</div>;
}
