import { ReactNode, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from './Button';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'default' | 'large';
  zIndex?: number;
}

export function Modal({ isOpen, onClose, title, children, footer, size = 'default', zIndex = 100 }: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const maxWidth = size === 'large' ? 'max-w-4xl' : 'max-w-2xl';

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4" style={{ zIndex }}>
      <div
        className="absolute inset-0 bg-black/75 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className={`relative w-full ${maxWidth} max-h-[90vh] overflow-hidden`}>
        <div className="bg-bg-secondary border border-border-subtle rounded-2xl shadow-[0_12px_32px_rgba(0,0,0,0.45)] overflow-hidden">
          <div className="flex items-center justify-between p-6 border-b border-border-subtle">
            <h2 className="text-xl font-semibold text-text-primary">{title}</h2>
            <Button variant="ghost" size="sm" onClick={onClose} className="!p-2">
              <X className="w-5 h-5" />
            </Button>
          </div>

          <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
            {children}
          </div>

          {footer && (
            <div className="flex items-center justify-end gap-3 p-6 border-t border-border-subtle bg-bg-primary/40">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
