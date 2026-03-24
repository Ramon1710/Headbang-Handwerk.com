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
    'inline-flex items-center justify-center gap-2 rounded-[0.65rem] font-bold tracking-wide transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-black disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer';

  const variants = {
    primary:
      'text-[#fff5e8] border border-[#ff9e43] bg-[linear-gradient(180deg,#ff8f2a_0%,#d86000_54%,#9d3f00_100%)] shadow-[0_8px_20px_rgba(255,120,0,0.35),inset_0_1px_0_rgba(255,214,173,0.6)] hover:brightness-110 hover:-translate-y-0.5',
    secondary:
      'border border-[#7a4a2d] text-[#ffd198] bg-[#1b120d] hover:bg-[#2d1b13] hover:border-[#a15f36]',
    ghost: 'text-[#d9c4ac] hover:text-[#ffe3bc] hover:bg-white/10',
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
