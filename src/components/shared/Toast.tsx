import { useEffect, useState } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useUIStore } from '../../stores/uiStore';
import { cn } from '../../lib/utils';
import type { Toast as ToastType } from '../../stores/uiStore';

const ICONS = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
} as const;

const STYLES = {
  success: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
  error: 'border-red-500/30 bg-red-500/10 text-red-300',
  info: 'border-sky-500/30 bg-sky-500/10 text-sky-300',
} as const;

function ToastItem({ toast }: { toast: ToastType }) {
  const removeToast = useUIStore((s) => s.removeToast);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Trigger enter animation on next frame
    const raf = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  const Icon = ICONS[toast.type];

  return (
    <div
      className={cn(
        'flex items-start gap-2.5 w-72 px-3 py-2.5 rounded-lg border shadow-lg',
        'bg-surface transition-all duration-300',
        STYLES[toast.type],
        visible ? 'translate-x-0 opacity-100' : 'translate-x-8 opacity-0',
      )}
    >
      <Icon size={16} className="shrink-0 mt-0.5" />
      <p className="flex-1 text-sm leading-snug text-slate-200">{toast.message}</p>
      <button
        onClick={() => removeToast(toast.id)}
        className="shrink-0 text-slate-500 hover:text-slate-300 transition-colors"
        aria-label="Cerrar"
      >
        <X size={14} />
      </button>
    </div>
  );
}

export function ToastContainer() {
  const toasts = useUIStore((s) => s.toasts);

  if (toasts.length === 0) return null;

  return createPortal(
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>,
    document.body,
  );
}
