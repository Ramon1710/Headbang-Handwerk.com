import { cn } from '@/lib/utils';
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  asChild?: boolean;
  href?: string;
  target?: React.HTMLAttributeAnchorTarget;
  rel?: string;
}

export function Button({
  children,
  className,
  variant = 'primary',
  size = 'md',
  href,
  target,
  rel,
  ...props
}: ButtonProps) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-[0.65rem] font-bold tracking-wide transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)] focus:ring-offset-2 focus:ring-offset-black disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer';

  const variants = {
    primary:
      'border border-[color:var(--color-accent)] bg-[linear-gradient(180deg,rgba(31,20,14,0.92)_0%,rgba(16,10,7,0.84)_100%)] text-[color:var(--text-link)] shadow-[0_8px_20px_color-mix(in_srgb,var(--color-accent)_28%,transparent),inset_0_1px_0_color-mix(in_srgb,var(--color-accent-soft)_20%,transparent)] hover:-translate-y-0.5 hover:border-[color:var(--color-accent-soft)]',
    secondary:
      'border border-[color:var(--color-border)] text-[color:var(--text-link)] bg-[color:var(--color-surface)] hover:bg-[color:var(--color-surface-2)] hover:border-[color:var(--color-accent)]',
    ghost: 'text-[color:var(--text-link)] hover:bg-white/10',
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
      <a href={href} className={classes} target={target} rel={rel}>
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
