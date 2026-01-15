import { type CSSProperties, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

export interface MultiSelectOption {
  value: string;
  label: string;
}

interface MultiSelectProps {
  label?: string;
  options: MultiSelectOption[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function MultiSelect({
  label,
  options,
  value,
  onChange,
  placeholder = 'Selecione...',
  disabled = false,
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const [popoverStyle, setPopoverStyle] = useState<CSSProperties>({});

  const labelByValue = useMemo(() => {
    return new Map(options.map(o => [o.value, o.label] as const));
  }, [options]);

  const toggleValue = (optionValue: string) => {
    if (value.includes(optionValue)) {
      onChange(value.filter(v => v !== optionValue));
    } else {
      onChange([...value, optionValue]);
    }
  };

  const removeValue = (optionValue: string) => {
    onChange(value.filter(v => v !== optionValue));
  };

  useLayoutEffect(() => {
    if (!isOpen) return;

    const updatePosition = () => {
      const el = triggerRef.current;
      if (!el) return;

      const rect = el.getBoundingClientRect();
      const margin = 8;
      const maxHeight = 240;

      const spaceBelow = window.innerHeight - rect.bottom - margin;
      const spaceAbove = rect.top - margin;

      const openUp = spaceBelow < 180 && spaceAbove > spaceBelow;
      const top = openUp
        ? Math.max(margin, rect.top - margin - Math.min(maxHeight, spaceAbove))
        : rect.bottom + margin;

      setPopoverStyle({
        position: 'fixed',
        left: rect.left,
        top,
        width: rect.width,
        maxHeight,
      });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isOpen]);

  return (
    <div className="w-full">
      {label && <label className="block text-sm font-medium text-text-secondary mb-2">{label}</label>}

      <div className="relative">
        <button
          type="button"
          disabled={disabled}
          onClick={() => setIsOpen(o => !o)}
          ref={triggerRef}
          className={`w-full min-h-[44px] px-4 py-2 text-left rounded-xl transition-all border ${
            disabled
              ? 'bg-bg-primary/40 border-border-subtle text-text-muted cursor-not-allowed'
              : 'bg-bg-secondary border-border-subtle text-text-primary hover:bg-surface-elevated focus:outline-none focus:ring-2 focus:ring-primary-ring focus:border-primary/50'
          }`}
        >
          {value.length === 0 ? (
            <span className="text-text-muted">{placeholder}</span>
          ) : (
            <div className="flex flex-wrap gap-2">
              {value.map(v => (
                <span
                  key={v}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-border-subtle bg-success-bg text-success text-sm"
                  onClick={e => {
                    e.stopPropagation();
                    removeValue(v);
                  }}
                >
                  {labelByValue.get(v) ?? v}
                  <X className="w-3 h-3" />
                </span>
              ))}
            </div>
          )}
        </button>

        {isOpen && !disabled &&
          createPortal(
            <>
              <button
                type="button"
                aria-label="Fechar"
                className="fixed inset-0 z-[190] cursor-default"
                onClick={() => setIsOpen(false)}
              />
              <div
                className="fixed z-[200] bg-bg-secondary border border-border-subtle rounded-xl shadow-[0_12px_28px_rgba(0,0,0,0.35)] overflow-y-auto"
                style={popoverStyle}
              >
                {options.length === 0 ? (
                  <div className="px-4 py-3 text-sm text-text-muted">Nenhuma opção disponível</div>
                ) : (
                  options.map(option => {
                    const selected = value.includes(option.value);
                    return (
                      <button
                        type="button"
                        key={option.value}
                        className={`w-full px-4 py-2.5 text-left transition-colors ${
                          selected ? 'bg-success-bg text-success' : 'text-text-secondary hover:bg-surface-elevated'
                        }`}
                        onClick={() => toggleValue(option.value)}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`w-4 h-4 rounded border flex items-center justify-center ${
                              selected ? 'border-primary bg-primary' : 'border-border-default'
                            }`}
                          >
                            {selected && (
                              <svg
                                className="w-3 h-3 text-white"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={3}
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            )}
                          </span>
                          <span>{option.label}</span>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </>,
            document.body
          )}
      </div>
    </div>
  );
}
