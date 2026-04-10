import { cn } from '@/lib/utils';
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  asChild?: boolean;
  href?: string;
}

export function Button({
  children,
  className,
  variant = 'primary',
  size = 'md',
  href,
  ...props
}: ButtonProps) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-[0.65rem] font-bold tracking-wide transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)] focus:ring-offset-2 focus:ring-offset-black disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer';

  const variants = {
    primary:
      'text-white border border-[color:var(--color-accent)] bg-[linear-gradient(180deg,var(--color-accent)_0%,var(--color-accent-strong)_54%,color-mix(in_srgb,var(--color-accent-strong)_72%,black)_100%)] shadow-[0_8px_20px_color-mix(in_srgb,var(--color-accent)_35%,transparent),inset_0_1px_0_color-mix(in_srgb,var(--color-accent-soft)_60%,transparent)] hover:brightness-110 hover:-translate-y-0.5',
    secondary:
      'border border-[color:var(--color-border)] text-[color:var(--color-accent-soft)] bg-[color:var(--color-surface)] hover:bg-[color:var(--color-surface-2)] hover:border-[color:var(--color-accent)]',
    ghost: 'text-[color:var(--color-muted)] hover:text-[color:var(--color-foreground)] hover:bg-white/10',
    danger: 'bg-red-600 hover:bg-red-500 text-white',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-7 py-3.5 text-base',
  };

  const classes = cn(base, variants[variant], sizes[size], className);

  if (href) {
    return (
      <a href={href} className={classes}>
        {children}
      </a>
    );
  }

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}
