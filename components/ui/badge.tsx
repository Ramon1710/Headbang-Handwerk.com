import { cn } from '@/lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  className?: string;
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  const variants = {
    default: 'bg-gray-700 text-gray-300',
    success: 'bg-green-900/60 text-green-400 border border-green-700/50',
    warning: 'bg-yellow-900/60 text-yellow-400 border border-yellow-700/50',
    danger: 'bg-red-900/60 text-red-400 border border-red-700/50',
    info: 'bg-orange-900/60 text-orange-400 border border-orange-700/50',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
