type SupabaseLikeError = {
  message?: unknown;
  details?: unknown;
  hint?: unknown;
  code?: unknown;
};

function asString(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value == null) return '';
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

export function formatSupabaseError(err: unknown, fallback = 'Erro inesperado'): string {
  if (!err) return fallback;

  if (err instanceof Error) {
    return err.message || fallback;
  }

  if (typeof err === 'object') {
    const e = err as SupabaseLikeError;
    const message = asString(e.message);
    const details = asString(e.details);
    const hint = asString(e.hint);
    const code = asString(e.code);

    const parts = [message, details && `Detalhes: ${details}`, hint && `Dica: ${hint}`, code && `Código: ${code}`].filter(
      Boolean
    );

    return parts.length > 0 ? parts.join(' | ') : fallback;
  }

  return asString(err) || fallback;
}
