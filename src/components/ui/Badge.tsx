import { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  variant?: 'active' | 'expiring' | 'blocked' | 'success' | 'warning' | 'error' | 'secondary';
  className?: string;
}

export function Badge({ children, variant = 'active', className = '' }: BadgeProps) {
  const variants = {
    active: 'bg-success-bg text-success border-success/40',
    expiring: 'bg-warning-bg text-warning border-warning/40',
    blocked: 'bg-danger-bg text-danger border-danger/40',
    success: 'bg-success-bg text-success border-success/40',
    warning: 'bg-warning-bg text-warning border-warning/40',
    error: 'bg-danger-bg text-danger border-danger/40',
    secondary: 'bg-surface-elevated text-text-muted border-border-default'
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-medium border backdrop-blur-sm ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}
