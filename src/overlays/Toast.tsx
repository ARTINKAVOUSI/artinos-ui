'use client';
import { useFlip } from '../core/motion';
import { ThemedPortal } from '../core/portal';
import { reducedMotion } from '../core/utils';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';

export interface ToastOptions {
  title: ReactNode;
  description?: ReactNode;
  tone?: 'neutral' | 'success' | 'warning' | 'error';
  /** Milliseconds; 0 keeps it until dismissed. Default 3500. */
  duration?: number;
  action?: { label: string; onClick: () => void };
}

interface ToastEntry extends ToastOptions {
  id: number;
  /** Playing its exit; removed when it ends. */
  leaving?: boolean;
}

/** How long a toast takes to leave, before the ones around it close the gap. */
const EXIT_MS = 180;

type Notify = (options: ToastOptions) => () => void;

const ToastContext = createContext<Notify | null>(null);

/**
 * Toasts — brief, non-blocking notifications. Wrap the app once in
 * <ToastProvider>, then call `useToast()(options)` anywhere below it.
 * Messages are announced to screen readers through a polite live region.
 */
export function ToastProvider({ children, placement = 'bottom-right' }: { children?: ReactNode; placement?: 'bottom-right' | 'bottom-center' | 'top-right' }) {
  const [toasts, setToasts] = useState<ToastEntry[]>([]);
  const next = useRef(0);
  const stack = useRef<HTMLDivElement>(null);
  useFlip(stack);

  // leave first, then free the space: the rest of the stack slides into it
  const dismiss = useCallback((id: number) => {
    setToasts((list) => list.map((toast) => (toast.id === id ? { ...toast, leaving: true } : toast)));
    setTimeout(() => setToasts((list) => list.filter((toast) => toast.id !== id)), reducedMotion() ? 0 : EXIT_MS);
  }, []);
  const notify = useCallback<Notify>(
    (options) => {
      const id = ++next.current;
      setToasts((list) => [...list.slice(-4), { ...options, id }]);
      return () => dismiss(id);
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={notify}>
      {children}
      <ThemedPortal>
        <div ref={stack} className="ar-toasts" data-placement={placement} role="status" aria-live="polite">
          {toasts.map((toast) => (
            <ToastItem key={toast.id} toast={toast} onDismiss={dismiss} />
          ))}
        </div>
      </ThemedPortal>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onDismiss }: { toast: ToastEntry; onDismiss: (id: number) => void }) {
  const { id, leaving } = toast;
  const [paused, setPaused] = useState(false);
  const duration = toast.duration ?? 3500;
  // Hovering pauses the clock where it is, as the time bar shows; leaving resumes the rest.
  const remaining = useRef(duration);
  useEffect(() => {
    if (!duration || paused || leaving) return;
    const start = performance.now();
    const timer = setTimeout(() => onDismiss(id), remaining.current);
    return () => {
      clearTimeout(timer);
      remaining.current = Math.max(0, remaining.current - (performance.now() - start));
    };
  }, [duration, paused, leaving, onDismiss, id]);
  return (
    <div
      className="ar-toast"
      data-flip={id}
      data-tone={toast.tone ?? 'neutral'}
      data-state={leaving ? 'closing' : 'open'}
      data-paused={paused || undefined}
      style={{ '--_life': `${duration}ms` } as CSSProperties}
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
    >
      {duration > 0 && <span className="ar-toast__time" aria-hidden />}
      <span className="ar-toast__dot" aria-hidden />
      <div className="ar-toast__text">
        <strong>{toast.title}</strong>
        {toast.description && <span>{toast.description}</span>}
      </div>
      {toast.action && (
        <button
          type="button"
          className="ar-toast__action"
          onClick={() => {
            toast.action!.onClick();
            onDismiss(id);
          }}
        >
          {toast.action.label}
        </button>
      )}
      <button type="button" className="ar-toast__close" aria-label="Dismiss" onClick={() => onDismiss(id)}>
        <svg viewBox="0 0 10 10" aria-hidden>
          <path d="M2.5 2.5l5 5M7.5 2.5l-5 5" />
        </svg>
      </button>
    </div>
  );
}

/** Returns `notify(options)`; outside a provider it logs to the console instead. */
export function useToast(): Notify {
  const notify = useContext(ToastContext);
  return useMemo<Notify>(
    () =>
      notify ??
      ((options) => {
        console.info('[toast]', options.title, options.description ?? '');
        return () => {};
      }),
    [notify],
  );
}

