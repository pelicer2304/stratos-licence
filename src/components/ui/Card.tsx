import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  glow?: boolean;
  hover?: boolean;
}

export function Card({ children, className = '', glow = false, hover = false }: CardProps) {
  const glowClass = glow
    ? 'shadow-[0_0_0_1px_rgba(0,177,117,0.18)]'
    : 'shadow-[0_1px_0_rgba(255,255,255,0.04)]';
  const hoverClass = hover
    ? 'hover:bg-surface-elevated hover:border-border-subtle hover:-translate-y-0.5'
    : '';

  return (
    <div
      className={`bg-bg-secondary backdrop-blur-md border border-border-subtle rounded-2xl ${glowClass} ${hoverClass} transition-all duration-300 ${className}`}
    >
      {children}
    </div>
  );
}
