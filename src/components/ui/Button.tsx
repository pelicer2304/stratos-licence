import { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles = 'font-medium rounded-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    primary: 'bg-primary hover:bg-primary-hover text-white shadow-[0_1px_0_rgba(255,255,255,0.06)] focus:outline-none focus:ring-2 focus:ring-primary-ring focus:ring-offset-0',
    secondary: 'bg-bg-secondary hover:bg-surface-elevated text-text-primary border border-border-subtle focus:outline-none focus:ring-2 focus:ring-primary-ring focus:ring-offset-0',
    ghost: 'hover:bg-surface-elevated text-text-secondary hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary-ring focus:ring-offset-0'
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
